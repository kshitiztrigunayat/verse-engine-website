# Monitor production

Four signals tell you whether a Verse deployment is healthy, and every one
of them is plain HTTP — no agent to install, no credential needed for the
uptime check. All calls below were run against a live server.

## 1. Uptime: `GET /v1/health/deep`

No auth (a monitor must not need a credential to ask "are you down?"),
rate-limited, and cheap by contract: in-memory counters plus a
touch-and-unlink probe on the volume — never a compile. `200` when every
check passes, `503` otherwise, so a dumb uptime monitor can alarm on status
alone and a smart one can read which subsystem broke:

```sh
curl -sS -D - https://HOST/v1/health/deep
# HTTP/1.1 200 OK
# {"ok":true,"checks":{
#    "volumeWritable":true,            touch+unlink in ingest/
#    "compilerPresent":true,           verse-compile binary present
#    "signingKey":true,                Ed25519 key loaded at boot
#    "disk":{"freeMB":491739,"totalMB":948534,"usedPct":48},   ok:false below 512 MB free
#    "storage":{"backend":"s3","bucket":"…","reachable":true}, only with VERSE_STORAGE=s3; unreachable bucket = 503
#    "lastIngest":{"t":1790833829990,"ok":true},               null before the first upload
#    "ingestLastHour":{"attempts":18,"done":16,"failed":2},
#    "telemetryWritable":true}}
```

Point your uptime service at it with a 1–5 minute interval. Also keep the
cheap `GET /` (the platform health check Railway uses).

## 2. Ingest health: `GET /v1/ops/ingest-stats`

Account auth required (any valid account token or the `/studio` cookie).
The last 24 hours of compile outcomes from the server's persisted ring of
the last 200 ingests, plus the client-side failures the server never saw:

```sh
curl -sS https://HOST/v1/ops/ingest-stats -H "Authorization: Bearer TOKEN"
# {"last24h":{"attempts":68,"done":61,"failed":7,
#             "byReason":{"failed":7,"evicted":46},"p50s":5,"p95s":19},
#  "recent":[{"t":…,"idHash":"ace65061d8ab","sizeMB":77.32,"outcome":"done","seconds":613}, …],
#  "telemetry24h":{"canaryFails":0,"uploadFails":1,"loadErrors":0,
#                  "lastCanaryFail":null,"lastUploadFail":{"t":…,"detail":"HTTP 400: …","phase":"upload"}}}
```

What to watch:

| Field | Healthy | Worry when |
| --- | --- | --- |
| `byReason.safe-mode-used` | absent or rare | rising — compiles are landing only via the low-memory retry; the box is starved before hard OOMs begin |
| `byReason.timeout` / `oom` | 0 | any — look at `recent[].sizeMB`: a tiny file timing out means CPU starvation, a huge one means a real limit |
| `byReason.storage-full` | 0 | any — uploads are being refused with `507`; raise the volume or `VERSE_VPK_BUDGET_MB` |
| `byReason.evicted` | housekeeping | fine on its own (unowned scenes reclaimed by the disk budget), but owners should claim scenes they care about |
| `p95s` | tens of seconds for products, minutes for scans | climbing week over week on similar sizes |
| `telemetry24h.uploadFails` with `phase: "upload"` | 0 | the **edge** answered uploads itself (a bare `400`/`502` without `X-Verse-Error`) — the app never saw them; this is the only place they show |

Scene ids are stored hashed (`idHash`); raw ids never enter the log.

## 3. The canary

A probe uploads a tiny fixture every 15 minutes with `X-Verse-Name:
canary`, polls it to `done`, fetches the compiled `.vpk`, and on any failure
POSTs a `{ "kind": "canary-fail", "detail": "<class>" }` telemetry row.
`ingest-stats.telemetry24h.canaryFails` counts them, `lastCanaryFail`
carries the detail, and `/studio` surfaces the most recent one. Canary
artifacts older than 24 h are pruned by the sweeper.

On the reference deployment the probe is `web/test/qa-smoke-remote.mjs`,
run by the `verse-worker` service against the public URL (so a green
canary also proves the compile-fleet path); set `VERSE_ALERT_WEBHOOK` on
that service for Slack-compatible alerts. The same script is the
post-deploy smoke:

```sh
node web/test/qa-smoke-remote.mjs https://HOST            # 9 checks, ~2 s; exit 1 on any failure
node web/test/qa-smoke-remote.mjs https://HOST --no-ingest --json   # read-only
node web/test/qa-smoke-remote.mjs https://HOST --report --webhook https://hooks.slack.com/…  # canary mode
```

Or run a minimal one from any cron box:

```sh
#!/bin/sh
BASE=https://HOST
fail() { curl -sS -o /dev/null -X POST "$BASE/v1/telemetry" -H "Content-Type: application/json" \
           -d "{\"kind\":\"canary-fail\",\"detail\":\"$1\",\"t\":$(date +%s000)}"; exit 1; }
JOB=$(curl -sS -X POST "$BASE/v1/ingest" -H "Content-Type: model/gltf-binary" -H "X-Verse-Name: canary" \
        --data-binary @test-blend.glb | sed -n 's/.*"job":"\([^"]*\)".*/\1/p') || fail "upload"
[ -n "$JOB" ] || fail "upload: no job id"
for i in $(seq 1 60); do
  R=$(curl -sS "$BASE/v1/ingest/$JOB"); case "$R" in *'"status":"done"'*) break;; *'"status":"error"'*) fail "compile";; esac; sleep 5
done
URL=$(echo "$R" | sed -n 's/.*"vpkUrl":"\([^"]*\)".*/\1/p')
curl -sS -f -o /dev/null -H "Range: bytes=0-1023" "$URL" || fail "fetch"
echo "canary ok: $JOB"
```

Triage when it fails: first `GET /v1/health/deep` (names the broken
subsystem), then `ingest-stats` for the failure class.

## 4. Failure beacons from real viewers

The playground client posts a telemetry row for the failures that never
reach the server as errors:

| `kind` | When | Fields |
| --- | --- | --- |
| `upload-fail` | an upload failed client-side — HTTP error, network error, or the job polled to `error` | `detail` (`HTTP <status>: <message>`), `phase` (`upload` = the POST itself failed, including edge failures; `compile` = server-side) |
| `load-error` | a share link failed to load in the viewer (broken/vanished `.vpk`, edge error on a range) | `detail`, `phase: "load"` |
| `canary-fail` | the canary's probe failed | `detail` |

They land in `ingest/.telemetry.jsonl` on the volume (rotated at ~32 MB,
one kept rotation) and roll up into `ingest-stats.telemetry24h`. With
`VERSE_TELEMETRY_URL` set, every row is also forwarded as ndjson every 15 s
to your warehouse — the schema is in [Telemetry](../telemetry.md).

## 5. Logs

`railway logs` (or `docker logs`) shows structured ingest lines:
`ingest start id=… ip=… size=…MB`, `ingest done id=… tris=… clusters=… in …s`,
`ingest FAIL id=…: …`, plus `boot-signed N of M` at startup and `sign FAIL`
if signing ever breaks. Grep for `FAIL`.

## 6. Signing-key sanity

```sh
curl -sS https://HOST/v1/pubkey
# {"alg":"Ed25519","spki":"MCowBQYDK2VwAyEA…"}
```

The `spki` must be identical across deploys. If it changes, the key was
not persisted and every previously compiled scene now reports
`signed: false` (it still loads).

## 7. Upload notifications: Slack and email

The server tells you who uploaded what, and tells the uploader when their
scene is live. Both are optional and neither can fail or slow an upload —
every call is fire-and-forget with a timeout and one retry.

### Slack

Create an **incoming webhook** in Slack (Apps → Incoming Webhooks → Add to
a channel) and set it on the web service:

| Variable | Value |
| --- | --- |
| `VERSE_SLACK_WEBHOOK` | the `https://hooks.slack.com/services/…` URL. When unset, `VERSE_ALERT_WEBHOOK` is used |

Messages (Block Kit, with a plain-text fallback):

| Message | Carries |
| --- | --- |
| **Upload received** | scene name, size, format, triangles / meshes / textures, job id, the owning account or "anonymous", country (only when a CDN header provides one — never the IP), client (browser or exporter), estimated build time |
| **Contact attached** | name, phone and email for that job, and whether the email will go out |
| **Experience is live** | the full `/app?vpk=…` link, build time, triangles → clusters, attempts and whether it healed, the mode (streamed or compatibility), the verification result and anything it repaired, texture-cache hits, whether the uploader was emailed |
| **Build healing itself** | failure class, which attempt is next, the sentence the uploader sees, the raw detail in a code block |
| **Published in compatibility mode** | the streamed build could not be delivered and the lossless fallback was used: why, attempts, the working link, the raw detail |
| **Build failed** | failure class and code, attempts, what the uploader was told, the raw detail in a code block. Since 2.1.0 this means even the fallback was impossible (model too large, unreadable file) |

Synthetic uploads never post: scene names starting `canary`, `qa-` or
`smoke` (the 15-minute canary and the QA suites) are skipped.

### Email

Uploaders can leave a name, phone number and email while their scene
builds. To send them the link, create a [Resend](https://resend.com) API
key for a verified sending domain and set:

| Variable | Value |
| --- | --- |
| `VERSE_RESEND_API_KEY` | the Resend API key |
| `VERSE_MAIL_FROM` | the sender, e.g. `Verse Engine <hello@ctruh.com>` |
| `VERSE_MAIL_REPLY_TO` | optional Reply-To address |

With both set, the uploader gets "Your 3D experience is live" (link, how to
share, the one-line embed) when the job reaches `done`, or an apology with
the plain-language reason if it finally fails. Without them nothing is sent
and nothing fails: the lead is stored with `emailed: false, reason: "mail not configured"`, the form tells the uploader the team will follow up, and the Slack message says the email was not sent.

### Reading the contacts

```sh
curl -sS https://HOST/v1/ops/leads -H "Authorization: Bearer $VERSE_ADMIN_TOKEN"
```

Contacts are personal data: they live in `ingest/.leads.json` on the
volume (mode `0600`, never served, included in the metadata backup), are
never written to the log in full (the email domain only), and are readable
only with the admin token or by an account listed in `VERSE_OPS_ACCOUNTS`.

## Checklist for the first week

- Uptime monitor on `/v1/health/deep`, alert on non-200.
- Hourly canary from a box outside the hosting provider.
- A daily glance at `ingest-stats`: `byReason`, `p95s`, `uploadFails`.
- Disk: `health.checks.disk.freeMB` trending down means the volume needs
  growing before `storage-full` appears. With `VERSE_STORAGE=s3` compiled scenes live in the
  bucket, so the volume holds only metadata and compiler scratch; watch
  `health.checks.storage.reachable` too.
