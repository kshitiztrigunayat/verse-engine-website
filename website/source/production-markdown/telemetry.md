# Telemetry schema (v0)

*Normative source: `web/playground/telemetry.js` (client), the
`POST /v1/telemetry` handler in `web/playground/serve.mjs` (sink), and the
call sites in `render-worker.js` / `main.js`. Everything below is read from
that code as of 2026-09-11.*

Design law #5: every session reports. Telemetry is a same-origin `POST` to
`/v1/telemetry` carrying either a **frame-time batch** (every 10 s) or a
**reliability event** (as it happens). It must never break the app: every
send is wrapped so a failure is swallowed.

## No PII

- The session id is `crypto.randomUUID()` generated at boot and held only
  in memory — no cookie, no `localStorage`, nothing survives a reload.
  (the analytics feed additionally keeps a random browser id in
  `localStorage` so returning visitors count once — stored server-side only
  as a keyed hash, never under an opt-out; see the look-and-stall feed.)
- No user id, no IP is recorded client-side (the server appends the raw
  body only; it does not add the remote address).
- What *is* sent about the device: adapter name, backend, tier,
  `navigator.userAgent`, in-app WebView classification. These are device
  fingerprint fields, not identity fields. Consent gating for partner pages
  is P3 scope per the source comment (not implemented — not verified
  beyond that comment).

## Two session ids

There are two independent `createTelemetry(session)` instances, each with
its own UUID:

| Instance | Where | Sends |
|---|---|---|
| Render-worker telemetry | `render-worker.js`, created on `init` unless `golden` mode | Frame-time **batches** |
| Main-thread telemetry (`mainTelemetry`) | `main.js`, module scope; exposed as `window.__verseTelemetryEvent` | Reliability **events** |

Consequences: a batch and an event from the same page tab carry
**different** `session` values, and a watchdog restart spawns a fresh render
worker and therefore a fresh batch session id (the main-thread id persists
for the tab's lifetime). Joining the two streams is not possible from the
payloads alone.

The embed host (`embed-host.js`) drives the same render worker, so
embedded viewers send batches. It defines no `__verseTelemetryEvent`, so **no
reliability events are sent from embeds** (only the playground `main.js`
emits them).

## Frame-time batch

Sent by `maybeFlush(now)`, which the render loop calls after every rendered
frame. A flush happens when both hold: ≥ 10 000 ms since the last flush
(`FLUSH_MS`) and at least one CPU sample was recorded. Histograms and
counters reset to zero after each flush, so every batch is a disjoint
window. Transport: `fetch` POST, `Content-Type: application/json`,
`keepalive: true`.

```json
{
  "v": 0,
  "session": "<uuid>",
  "ts": 1757600000000,
  "adapter": "Apple M2",
  "backend": "WebGPU",
  "tier": "A",
  "hasTimestamps": true,
  "mode": "sab",
  "inApp": null,
  "capTier": "A/B",
  "ua": "Mozilla/5.0 …",
  "frames": 612,
  "cpu": { "hist": [0, 0, …32 ints…], "p50": 0.65, "p95": 1.09 },
  "gpu": { "hist": [ … ], "p50": 1.83, "p95": 4.36 }
}
```

| Field | Type | Source | Meaning |
|---|---|---|---|
| `v` | `0` | constant | Schema version. |
| `session` | string | `crypto.randomUUID()` in the render worker | Per-worker-lifetime id (see above). |
| `ts` | number | `Date.now()` at flush | Wall-clock ms. |
| `adapter` | string | `engine.adapter_name` (`wgpu` adapter info name) | GPU adapter fingerprint. May be empty when the browser hides it. |
| `backend` | string | `engine.backend` | Rendering backend as reported by the wasm engine (exact string values not verified here). |
| `tier` | `"A" \| "B" \| "C"` | `engine.tier` (`verse-rhi` `Tier`) | Engine tier: A = WebGPU with `max_storage_buffer_binding_size > 128 MiB` and `max_buffer_size > 256 MiB`; B = other WebGPU adapters; C = the WebGL2 build. |
| `hasTimestamps` | boolean | `engine.has_timestamps` | Whether GPU timestamp queries are available; when false `gpu` is always `null`. |
| `mode` | `"sab" \| "fallback"` | render worker | `sab` = sim worker + SharedArrayBuffer triple buffer; `fallback` = single-worker camera-only world (page not cross-origin isolated). |
| `inApp` | string \| null | `msg.caps?.inApp` — intended source `caps.inApp` (`caps.js` `inAppBrowser`) | WebView classification from the UA: `instagram`, `facebook`, `whatsapp`, `pinterest`, `tiktok`, `snapchat`, `line`, `twitter`, or `null` for a real browser. **Currently always `null`:** neither `main.js` nor `embed-host.js` puts a `caps` object on the render worker's `init` message (they pass only `tierC`), so the field is wired on the receiving side but never populated. |
| `capTier` | `"A/B" \| "C" \| "-" \| null` | `msg.caps?.tier` — intended source `caps.tier` (`caps.js` `detect`) | Pre-engine capability tier: `A/B` = WebGPU adapter + OffscreenCanvas, `C` = WebGL2 only, `-` = neither (poster + link-out; such a page never boots the engine). **Currently always `null`** for the same reason as `inApp`. |
| `ua` | string | `navigator.userAgent` | Raw UA string. |
| `frames` | int | CPU sample count | Frames rendered in this window (frames with a non-positive CPU time are not counted). |
| `cpu.hist` | `int[32]` | | Bucket counts of render-worker CPU time per frame: wall time of `engine.render_packed` / `engine.frame` (`performance.now()` delta) — not the whole rAF callback. |
| `cpu.p50`, `cpu.p95` | number \| null | | Percentiles estimated from the histogram (see below). |
| `gpu` | object \| null | `engine.gpu_frame_ms` | Same shape for the last completed GPU frame time (timestamp queries). `null` when no GPU sample landed in the window (no timestamps, or `gpu_frame_ms` is `NaN` — the WebGL2 backend always reports `NaN`). |

`setMeta()` replaces the whole meta object; the fields above are the only
ones the render worker sets.

### Histogram buckets

32 log-spaced buckets covering 0.25 ms … 64 ms, four buckets per octave:

- `edge(i) = 0.25 · 2^(i/4)` ms; bucket `i` covers `[edge(i), edge(i+1))`.
- `index(ms) = floor(log2(ms / 0.25) · 4)`, clamped to `[0, 31]`. Times
  below 0.25 ms land in bucket 0; times ≥ ~53.8 ms (edge 31) land in
  bucket 31, which is therefore open-ended. `NaN`, `0`, and negatives are
  dropped (not counted in `frames`).
- Bucket edges (ms): 0.25, 0.30, 0.35, 0.42, 0.50, 0.59, 0.71, 0.84, 1.0,
  1.19, 1.41, 1.68, 2.0, 2.38, 2.83, 3.36, 4.0, 4.76, 5.66, 6.73, 8.0,
  9.51, 11.3, 13.5, 16.0, 19.0, 22.6, 26.9, 32.0, 38.1, 45.3, 53.8, (64).
- Percentile `p`: the midpoint `edge(i + 0.5)` of the first bucket at which
  the cumulative count reaches `count · p`, rounded to two decimals; `64`
  if never reached; `null` when `count == 0`. So `p50`/`p95` are bucket
  midpoints, not exact values — the ~19 % bucket width bounds the error.

The same `stats()` numbers feed the playground HUD (`cpuP50`, `cpuP95`,
`gpuP50`, `gpuP95`).

## Reliability events

`telemetry.event(kind, detail)` sends immediately, one POST per event, via
`navigator.sendBeacon` (survives page teardown) or `fetch` POST when
`sendBeacon` is unavailable (no `Content-Type` header in that path).

```json
{ "session": "<uuid>", "kind": "event", "event": "watchdog-restart",
  "detail": "no heartbeat 8s", "t": 1757600000000 }
```

| Field | Meaning |
|---|---|
| `session` | The **main-thread** telemetry UUID (all events go through `mainTelemetry`). |
| `kind` | Always `"event"` — distinguishes this record from a batch (which has `v` and no `kind`). |
| `event` | One of the kinds below. |
| `detail` | `String(detail ?? "")` truncated to 300 chars. |
| `t` | `Date.now()`. |

| `event` | Emitted from | `detail` |
|---|---|---|
| `watchdog-restart` | `main.js` watchdog: no message from the render worker for > 8 s while the page is visible and not in XR; the worker is terminated and rebuilt (up to 5 restarts, then "giving up") | `"no heartbeat 8s"` |
| `recovered` | `main.js` on the render worker's `recovered` message (GPU device lost and re-created in place) | `"<ms>ms"` — recovery time |
| `uncaught` | `window` `error` listener | `e.message` |
| `unhandled-rejection` | `window` `unhandledrejection` listener | `String(e.reason)` |
| `engine-error` | `main.js` on a render-worker `error` message (wasm engine failure) | the engine's message |
| `render-worker-error` | `main.js` `renderWorker.onerror` (worker script failed to parse/start) | Called with an object `{ message }`, which `String()` collapses to `"[object Object]"` — the message text is lost in the payload as written. |

**`degraded` is not a telemetry event.** It is an embed-SDK event
(`verse:event` with `name: "degraded"`, detail `{ tier, inApp, reasons }`
from `embed-host.js` when caps land on tier `-`, or
`{ reason: "iframe-unavailable" }` from `embed.js` when the iframe never
reports ready within 8 s). It reaches the partner page's `viewer.on(
"degraded")` listeners and `viewer.events()`; nothing posts it to
`/v1/telemetry`. Single-thread degraded mode (no SAB) is visible in batches
as `mode: "fallback"`, not as an event.

### Guided-tour events

The onboarding tour (`web/playground/onboarding.js`) sends product events
through the same `event()` call, on every page that has a tour. In the app
they share the main-thread session id; on the product page, Studio and the
docs the module creates its own in-memory `createTelemetry` instance, so
the id is again a per-page-load UUID. `detail` is a JSON string holding the
surface (`landing`, `app`, `studio`, `docs`) and a step id — nothing else.

| `event` | When | `detail` |
|---|---|---|
| `tour-started` | The visitor starts or resumes a tour | `{surface, step, source}` — `source` is `chip`, `nav`, `url` (a `?guide=` link) or `api` (`verseOnboarding.start()`, e.g. the assistant) |
| `tour-step` | A step is reached for the first time (furthest step only, so going back sends nothing) | `{surface, step, n, of}` |
| `tour-step-skipped` | A step's control is not on the page, so the tour moved past it | `{surface, step}` |
| `tour-completed` | The last step's button is pressed | `{surface, steps}` |
| `tour-skipped` | The tour is closed before the end | `{surface, step, n, of}` |
| `tour-chip-dismissed` | The first-visit chip is closed without starting | `{surface}` |

## Server-side sink

`POST /v1/telemetry` in `serve.mjs` (dev server and production alike):

- Reads the body up to a hard cap of 1 000 000 characters; a body that
  would exceed it destroys the connection.
- Does **not** parse or validate the JSON. It replaces every newline with a
  space and appends the body as one line to
  `web/playground/ingest/.telemetry.jsonl` (the ingest volume, so it
  survives redeploys — REL-12), then answers `204`.
- No API key and no rate limit are applied on this route (only
  `/v1/ingest` is keyed/rate-limited).
- **Dotfiles are never served**: any request whose path has a segment
  starting with `.` gets `404`, so `.telemetry.jsonl`, `.verse-keys.json`
  and `.verse-usage.json` cannot be downloaded (audit P0 fix).
- The source comment says a ClickHouse sink "takes over in P3"; the JSONL
  file is the only *local* sink, but the server can batch-forward the same
  lines to an external collector (below).

## Forwarding (INF-5)

When the environment variable `VERSE_TELEMETRY_URL` is set, the server
forwards telemetry to it in addition to the local JSONL (which keeps being
appended exactly as before — it is the fallback and the QA surface):

- Every accepted `POST /v1/telemetry` body (newlines flattened, `\n`
  terminated — the same line the JSONL gets) is queued in memory.
- Every **15 s** the queue is drained into a `POST` to
  `VERSE_TELEMETRY_URL` with `Content-Type: application/x-ndjson`, at most
  **500 KB** of lines per batch (always at least one line, so an oversized
  line cannot wedge the queue). If `VERSE_TELEMETRY_AUTH` is set, the
  request carries `Authorization: Bearer <value>`.
- A non-2xx response or a network error puts the batch back at the front of
  the queue (order preserved) for the next tick. The queue is capped at
  **5 MB**; beyond that the oldest lines are dropped, and the drop count is
  reported in a server log line at most once a minute.
- Nothing is retried across a restart — the queue is in-memory only. The
  local JSONL is the durable record.

The ndjson body is ClickHouse-HTTP-compatible: point the URL at
`https://<clickhouse>/?query=INSERT%20INTO%20telemetry%20FORMAT%20JSONEachRow`
(ClickHouse accepts ndjson bodies for `FORMAT JSONEachRow`), or at any
collector that accepts newline-delimited JSON. Lines are forwarded
unparsed and unvalidated, exactly as received — the collector must treat
them as untrusted input, same as JSONL consumers.

Each line of `.telemetry.jsonl` is therefore either a batch object or an
event object, distinguishable by the presence of `"v": 0` vs
`"kind": "event"`. Because the server appends whatever it receives,
consumers should treat lines as untrusted input.

## Look-and-stall feed (2.5)

`web/playground/look-feed.js`, started by `main.js` (playground, `/view`)
and `embed-host.js` (embeds). While a scene is live, one row every
**2 s** (`SAMPLE_MS`, the documented sampling rate — not a fraction of
sessions: every opted-in session samples at this rate):

```json
{"kind":"look","v":1,"session":"<uuid>","scene":"ingest/<id>.vpk",
 "t":1760000000000,"pos":[3.71,3.13,5.3],"yaw":-125.0,
 "streaming":true,"stalled":false,"walking":false}
```

- `pos` — the camera eye (metres, scene space; 2 decimals); `yaw` — the
  view direction in degrees (`atan2(forward.z, forward.x)`).
- `streaming` — bytes were still arriving since the previous sample (the
  resident-KB counter grew) or the complete-mode loader was up.
- `stalled` — `streaming` while the visitor stood still (moved < 0.5 m) or
  the loader held the page: *waited for the scene here*.
- `walking` — walk mode was on (playground only; embeds send `false`).
- Transport `sendBeacon` (fallback `fetch keepalive`); hidden tabs skip
  samples; a `429` backs off 15 minutes like the batches.

The session id is the page's main-thread telemetry UUID (playground) or a
fresh in-memory UUID per embed load. **No IP is stored**: the sink appends
the body only. Opt-outs, decided client-side before the first row:
`?analytics=0` (or `?telemetry=0`) on the link, the embed option
`analytics: false` (→ `?analytics=0` on the iframe), or a browser sending
Do Not Track. Golden mode sends nothing, as before.

The server folds these rows per scene (`web/playground/analytics.mjs`)
into the heatmap grid + funnel `GET /v1/scenes/<id>/heatmap` returns and
Studio draws over the floor plan: *opens* (a session's first row of any
kind on a day), *entered* (≥ 1 look row), *walked* (walk mode or ≥ 2 m of
path), *30 s* and *2 min* of look samples. Same window as the per-scene
opens: the current log plus one rotation.

### 4.0: views, actions, browser id, batching

For the client-facing dashboard (`GET /v1/scenes/<id>/analytics`, see
[API](api.md#analytics)) the same module also sends:

```json
{"kind":"view","v":2,"session":"<uuid>","vid":"<uuid>","scene":"ingest/<id>.vpk","t":1760000000000,
 "dev":"phone","os":"ios","app":"instagram","via":"share","ref":"none"}
{"kind":"act","v":1,"session":"<uuid>","vid":"<uuid>","scene":"ingest/<id>.vpk","t":1760000000000,"act":"hotspot","target":"kitchen"}
{"kind":"act","v":1,"session":"<uuid>","vid":"<uuid>","scene":"ingest/<id>.vpk","t":1760000000000,"act":"enquiry"}
```

- `view` — once per scene per page. `dev`/`os`/`app` are computed on the
  device from fixed lists (`deviceOf` in look-feed.js); `via` is `embed`
  inside an iframe, `share` with a `?share=` token, else `direct`.
- `act` — `interact` (first pointer, touch, wheel or key on the page while
  a scene is live), `enquiry` (the owner's enquiry button), `hotspot` (a
  hotspot opened — `target` = its id from the experience manifest), `link`
  (a hotspot card's link — `target` = its id), `question` (a question asked
  in Ask Verse while the scene is open — the count only, the text is never
  sent), `cta` (an interactivity hotspot card's call-to-action — Book a
  visit, WhatsApp — `target` = the hotspot id; sent as a beacon) and
  `object` (an interactive object used — a door, a switch, Empty room —
  `target` = its id; the interactivity hotspots log `hotspot` / `link` like
  the experience ones). `target` must match `[A-Za-z0-9_-]{1,64}`, anything else is dropped.
  (Before the viewer report, `hotspot` meant the card link.)
- `view.ref` (viewer report) — the referring site's class, from a fixed
  list (`referrerOf` in look-feed.js): `whatsapp`, `instagram`, `facebook`,
  `linkedin`, `twitter`, `youtube`, `google`, `search`, `email`, `other`, or
  `none` (no referrer, or this same site). The referrer URL itself never
  leaves the page — it can carry a search query or a message id.
- `vid` — a random UUID kept in `localStorage` (`verse.vid`) so a
  returning browser counts once. Never created under an opt-out; the server
  stores only a keyed hash of it.
- Look rows are buffered and posted as `{"kind":"batch","rows":[…]}`
  every ~10 s (5 samples), flushed with `sendBeacon` on `visibilitychange`
  → hidden and `pagehide`. The server stores one line per row.
- Opt-outs (added): Global Privacy Control, and `?analytics=never`, which
  is remembered on that browser (`localStorage` `verse.analytics=off`,
  the browser id deleted) until `?analytics=1`. The server also drops
  analytics rows sent with `DNT: 1` or `Sec-GPC: 1`.
- Server side, every `view`/`look`/`act` row is rebuilt from a whitelist
  (`sanitizeRow` in `analytics-report.mjs`) — the stored line is no longer
  the raw body for these kinds — and they draw from their own rate bucket.

## Cadence summary

| Signal | When | Transport |
|---|---|---|
| Batch | first rendered frame ≥ 10 s after the previous flush (or after worker start), only if ≥ 1 CPU sample | `fetch` POST JSON, `keepalive` |
| Event | immediately on occurrence | `sendBeacon` (fallback `fetch`) |
| Look (2.5) | every 2 s while a scene is live, tab visible, not opted out | `sendBeacon` (fallback `fetch keepalive`) |
| Nothing | golden-capture mode (`?golden`), tier `-` pages, embeds for events | — |

Whether batches are sent while the tab is hidden depends on whether the
render loop runs (rAF is paused by the browser); not verified.
