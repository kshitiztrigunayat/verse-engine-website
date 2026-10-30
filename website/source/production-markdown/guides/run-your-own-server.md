# Run your own server

Verse ships as **one container**: the playground, the embed SDK, the docs
site, the ingest API with the native compiler, Ed25519 signing, share
links, review comments, presence rooms, telemetry. Point the exporters and
the embed script at your origin and nothing else changes — the protocol is
identical to the hosted service.

**You need:** Docker, a host that can terminate HTTPS, and a persistent
disk for the ingest volume. Node 22 and Rust are only needed for the
no-Docker path.

## Hard requirements

| Requirement | Why | If missing |
| --- | --- | --- |
| HTTPS (or `localhost`) | WebGPU, service workers and `SharedArrayBuffer` need a secure context | nothing renders |
| `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` on every engine document | `SharedArrayBuffer` for the sim↔render triple buffer | engine falls back to a single worker (slower, still works) |
| HTTP Range requests reach the origin untouched | streaming is byte-range fetches of the `.vpk` | the runtime refuses the host ("range not honored") |
| **Exactly one replica** | rate limits, the job map and the compile semaphore are in memory | duplicated state, lost jobs |

`serve.mjs` sets the headers itself; a reverse proxy must pass them (and
`Range`) through.

## 1. Build and run with Docker

```sh
docker build -t verse-engine .
docker run -d --name verse -p 8080:8080 \
  -v verse-ingest:/app/web/playground/ingest \
  verse-engine
curl -s http://localhost:8080/v1/health/deep
# → {"ok":true,"checks":{"volumeWritable":true,"compilerPresent":true,"signingKey":true, …}}
```

The multi-stage `Dockerfile` builds both wasm tiers (WebGPU and the WebGL2
fallback), the native `verse-compile` and `splat-pack` binaries,
precompresses the engine, and pins + sha256-verifies the vendored Draco and
Basis codecs. Build time is 5–7 minutes; the Rust stage dominates.

The volume at `/app/web/playground/ingest` is **the product**: compiled
`.vpk`/`.vsp` scenes, posters, tours, experiences, review comments, and the
operational dotfiles (signing key, API keys, usage, telemetry log). It must
persist across deploys. The entrypoint fixes the mount's ownership and
drops to the unprivileged `node` user.

Compiled scenes can live in an **S3-compatible bucket** instead of the
volume (this is how the hosted service runs): set `VERSE_STORAGE=s3` and the
`VERSE_S3_*` variables below. Metadata (keys, accounts, usage, reviews,
telemetry) and compiler scratch stay on the volume, so it is still
required. Scene bytes are **proxied** through the origin by default (range
requests, signing and private-scene rules unchanged); `VERSE_S3_REDIRECT=1`
restores the older `302` to the object URL. Provisioning, migration,
backups and rollback: `docs/storage.md` in the repository.

### Without Docker (development)

```sh
export PATH="$HOME/.cargo/bin:$PATH"
wasm-pack build crates/verse-web --target web --profile wasm-release --out-dir ../../web/playground/pkg
wasm-pack build crates/verse-web --target web --profile wasm-release --out-dir ../../web/playground/pkg-gl -- --no-default-features --features webgl
scripts/build-codecs.sh   # JPEG / WebP / HDR codec module (loaded on first need), next to both tiers
cargo build --release -p verse-compile --bins
node web/playground/serve.mjs                   # http://localhost:8080
```

Vendored codecs (`web/playground/vendor/`) and the sample helmet are
fetched by the commands in `DEPLOY.md` §3–4.

## 2. Environment variables

All optional. The server runs with sensible defaults and no configuration.

### Server

| Variable | Default | Effect |
| --- | --- | --- |
| `PORT` | `8080` | listen port |
| `VERSE_SIGNING_KEY` | auto-generated on the volume | base64 PKCS8 DER Ed25519 key that signs every compiled scene. Set it from a secret store in production; a malformed value refuses to start. Generate: `node -e 'console.log(require("node:crypto").generateKeyPairSync("ed25519").privateKey.export({type:"pkcs8",format:"der"}).toString("base64"))'` |
| `VERSE_INGEST_PER_HOUR` | `6` | anonymous uploads per hour per IP (loopback exempt) |
| `VERSE_INGEST_PER_HOUR_TOKEN` | `20` | uploads per hour per **account token** — independent of IP |
| `VERSE_UPLOAD_STALE_MS` | 2 h | idle time before a resumable upload expires |
| `VERSE_VPK_BUDGET_MB` | `3500` | disk budget for compiled scenes; over it, the least-recently-opened **unowned** scene is evicted. Owned scenes are never evicted |
| `VERSE_MIN_FREE_MB` | `1024` | free-space floor; uploads are refused with `507` when free space is below `max(this, 3× upload size)` |
| `VERSE_SWEEP_MS` | 15 min | sweeper cadence (compile intermediates, stale uploads, finished job records, canary artifacts) |
| `VERSE_MAX_POSTERS` / `VERSE_MAX_TOURS` / `VERSE_MAX_EXPERIENCES` | `500` / `1000` / `1000` | newest-N caps on published sidecars |
| `VERSE_CDN_BASE` | unset | https origin of an edge cache; public `.vpk`/`.vsp` GETs `302` there, `/v1/config` hands it to the client. See [CDN](#4-put-a-cdn-in-front) |
| `VERSE_STORAGE` | `volume` | `s3` stores compiled scenes in an S3-compatible bucket (see [above](#1-build-and-run-with-docker)) |
| `VERSE_S3_BUCKET` / `VERSE_S3_ENDPOINT` / `VERSE_S3_REGION` / `VERSE_S3_ACCESS_KEY_ID` / `VERSE_S3_SECRET_ACCESS_KEY` | unset | the bucket and its credentials (`VERSE_S3_FORCE_PATH_STYLE`, `VERSE_S3_PREFIX` optional) |
| `VERSE_S3_REDIRECT` | unset | `1` answers public scene GETs with a `302` to the bucket instead of proxying the bytes (the pre-2026-10-12 behaviour) |
| `VERSE_CDN_RANGES` | unset | `0` keeps ranged requests on the origin for a CDN that cannot serve `206` |
| `VERSE_TELEMETRY_URL` (+ `VERSE_TELEMETRY_AUTH`) | unset | batch-forward telemetry as ndjson every 15 s (ClickHouse-HTTP compatible); the local JSONL keeps being written |
| `VERSE_WORKER_TOKEN` | unset | enables `/v1/work/*` so external `tools/verse-worker` boxes pull compile jobs. Unset = compiles run in-process |
| `VERSE_CLASSIC_FALLBACK_MB` | `96` | largest prepared model the lossless fallback publishes in compatibility mode when every build attempt fails; `0` disables the fallback (jobs then fail with a friendly error) |
| `VERSE_COMPILE_STALL_S` | `600` | stall watchdog: a compile with no output **and** no CPU time for this many seconds is killed and retried |
| `VERSE_SLACK_WEBHOOK` | unset (falls back to `VERSE_ALERT_WEBHOOK`) | Slack incoming-webhook URL: upload received, contact attached, live, healing, failure. See [Monitor production](monitor-production.md#7-upload-notifications-slack-and-email) |
| `VERSE_RESEND_API_KEY` + `VERSE_MAIL_FROM` | unset | Resend API key and sender (e.g. `Verse Engine <hello@ctruh.com>`) for the "email me when it's live" notice. Unset = nothing is sent and nothing fails |
| `VERSE_MAIL_REPLY_TO` | unset | optional Reply-To for those emails |
| `VERSE_OPS_ACCOUNTS` | unset | comma-separated account ids allowed to read `GET /v1/ops/leads` (the admin token always may) |
| `SIM_LATENCY_MS` | `0` | dev only: delay every Range response to reproduce real-internet RTT |

### Compiler (texture streaming)

`verse-compile` reads these from the server's environment. The defaults
suit a 2-core box with the 30-minute compile attempt (45-minute job wall clock); raise them on a
bigger machine or an external worker.

| Variable | Default | Effect |
| --- | --- | --- |
| `VERSE_STREAM_TEXTURES` | `256` | how many materials (the most important by world surface area) get full streamed textures; the rest live on the 1024² preview atlas |
| `VERSE_STREAM_BUDGET_MB` | `768` | byte budget for the encoded streamed texture blobs; selection stops at whichever limit — count or bytes — hits first |
| `VERSE_STREAM_DEADLINE_SECS` | `600` | wall-clock budget for the texture phase before the compiler degrades to the fast path |
| `VERSE_ENCODE_THREADS` | `2` (clamped 1–8) | parallel texture encoders; each costs RAM |
| `VERSE_HERO_TEXTURES` / `VERSE_HERO_DIM` | `12` / `4096` | the top-N materials whose **source** is at least `HERO_DIM` are kept at 4096² for the tier-A hero pool instead of 2048² |
| `VERSE_TEX_SAFE` | unset | set by the server itself on the last rung of the self-healing ladder: low-memory ETC1S texture path |
| `VERSE_ENCODE_CACHE_DIR` | `ingest/.encode-cache` (set by the server) | encoded-texture cache: each streamed blob is stored keyed by a SHA-256 of its source bytes, factors, size and encoder settings, so re-uploading a scene skips the texture encode — the longest phase of a compile. Checksummed on read; output is byte-identical to a cold compile. Set to empty to disable. The finished job record reports `stats.texCache: {hits, misses}` |
| `VERSE_ENCODE_CACHE_MB` | `4096` | cache size bound; least-recently-used entries (by mtime, bumped on every hit) are evicted after each compile |

### Access control

Create `ingest/.verse-keys.json` on the volume to switch ingest from open
mode to keyed mode (`X-API-Key` required, per-key daily quota):

```json
{ "vk_example123": { "name": "acme-storefront", "quotaMB": 1024 } }
```

Accounts (`POST /v1/account`) work in either mode and add ownership,
`/studio`, private scenes and share tokens on top — see the
[API reference](../api.md#accounts-studio).

## 3. Verify

```sh
BASE=https://your.origin
curl -sS -D - -o /dev/null "$BASE/" | grep -i "cross-origin"        # COOP + COEP present
curl -sS "$BASE/v1/health/deep"                                       # {"ok":true,…}
curl -sS "$BASE/v1/pubkey"                                            # {"alg":"Ed25519","spki":"MCow…"} — must be stable across restarts
curl -sS -X POST "$BASE/v1/ingest" -H "Content-Type: model/gltf-binary" \
  -H "X-Verse-Name: smoke" --data-binary @web/playground/test-blend.glb   # → 202 {"job":"smoke-…"}
```

A `spki` that changes after a redeploy means the signing key was not
persisted (no env var and the dotfile not on a volume) and every earlier
scene will report `signed: false`.

Then open `https://your.origin/` — the landing page — and `/app`, drop a
GLB, and confirm the status line ends in " · signed".

## 4. Put a CDN in front

Streaming is RTT-bound. An edge cache near the viewer roughly halves
time-to-sharp for remote viewers. The server is already CDN-correct —
`public, max-age=31536000, immutable` + strong ETags + `Accept-Ranges` on
public `/ingest/*`, `no-store` on `/v1/*` and on every byte of a private
scene — so the operator's half is DNS, cache rules and (optionally)
`VERSE_CDN_BASE`. Put any CDN that honours `Cache-Control` and byte ranges in front of the origin.

## 5. Deploying on Railway

The repo's `railway.json` and `Dockerfile` are configured for it:
`railway up --detach`, a volume mounted at `/app/web/playground/ingest`,
`overlapSeconds: 0` (the volume forces stop-then-start; expect ~20 s of
502 per deploy), one replica. The hosted service adds a Railway bucket with
`VERSE_STORAGE=s3` for compiled scenes; the volume keeps the metadata.

## Next

- [Monitor production](monitor-production.md) — health, ingest stats,
  canary, failure beacons.
- [Publish from Blender](publish-from-blender.md) — point the exporter's
  Server URL at your origin.
