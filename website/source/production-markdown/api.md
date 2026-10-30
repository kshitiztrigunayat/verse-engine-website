# API reference

Everything Verse does is plain HTTP on one origin: upload a 3D file, poll
the compile, get a signed streaming link, own it, share it privately, pin
review comments on it, publish tours and posters, watch the platform. The
playground, `/studio`, the embed SDK and the Blender, Unity and Unreal
exporters are all clients of these routes — nothing below is internal.

- **Base URL:** `https://verse.ctruh.com` for the
  hosted service, or your own origin ([Run your own server](guides/run-your-own-server.md)).
  Examples write `https://HOST`.
- **New here?** The [API quickstart](api-quickstart.md) is the three-call
  version of this page. The Postman collection at
  [`/verse-api.postman_collection.json`](/verse-api.postman_collection.json)
  has every route below ready to run (generated from the same route table
  as the [JS/TS SDK](sdk.md) — `scripts/gen-postman.mjs`).
- **History:** [API changelog](api-changelog.md).

Every request and response shape on this page was executed against a live
server before it was written down.

## Conventions

### Requests and responses

JSON in, JSON out, except where a body is raw bytes (GLB, PNG, upload
parts) and where noted (`204`, `302`, SSE). All `/v1/*` responses are
`Cache-Control: no-store` (exception: `/v1/pubkey`, `public, max-age=300`).
Scene artifacts under `/ingest/*` are immutable and cacheable
(`Cache-Control: public, immutable` on hashed artifacts, ranges supported).

### Error contract

**Every error the application generates carries the header `X-Verse-Error: 1` and a JSON body `{"error": "<human-readable cause>"}`.**
Every status ≥ 400 from every route — `400`, `401`, `402`, `404`, `405`, `409`,
`413`, `429`, `500`, `503`, `507` — follows the rule, static-file `404`s
included:

```sh
curl -sS -D - https://HOST/v1/ingest/does-not-exist
# HTTP/1.1 404 Not Found
# X-Verse-Error: 1
# {"error":"unknown job"}
```

The header is the deterministic tell between the app and the network
edge. Hosting proxies occasionally answer a request themselves — a bare
`400` on a large or aborted body, a `502`/`504` on a timeout — and those
responses do **not** carry it. Clients should treat:

- **error + `X-Verse-Error: 1`** → the app spoke. The `error` string is
  authoritative and actionable; do not blind-retry a 4xx (`401`/`413`/
  `429`/`507` say exactly what to fix or wait for).
- **error without the header** → an intermediary spoke; the app never saw
  or never finished the request. Transient — one retry is appropriate.

Success responses never carry the header. The bundled exporters implement
exactly this rule (`integrations/blender/verse_publish/net.py`).

On the ingest routes the body also carries `errorInfo` — the structured
twin of `error` (see [Friendly errors](#friendly-errors)). `error` is
always a string.

### Authentication

Three credentials, each optional, each for a different job:

| Credential | Header | Grants |
| --- | --- | --- |
| **API key** `vk_…` | `X-API-Key: vk_…` | upload quota in **keyed mode** (the operator provisioned `ingest/.verse-keys.json`; absent file = open mode, no key needed). Daily quota per key, default 512 MB; over → `429`; unknown key → `401`. |
| **Account token** (64 hex) | `Authorization: Bearer <token>` — or the httpOnly `verse_session` cookie that `POST /v1/account/login` sets | ownership of what you publish, the account routes, `/studio`, moderation, ops reads, and the per-token ingest rate bucket. Returned **once** at `POST /v1/account`. |
| **Share token** (32 hex) | `?share=<token>` on the URL, or `X-Verse-Share: <token>` | read access to one **private** scene's artifacts and review comments. Minted by the owner, revocable individually. |

A request carrying both an API key and account auth is quota-checked by
the key and **owned** by the account.

People signing in through the website use a six-digit code sent by email
or WhatsApp ([Sign in](guides/sign-in.md)); that creates the same
`verse_session` cookie. The code routes (`/v1/auth/*`) exist for the
website only and are not a stable API: scripts and plug-ins keep using the
account token.

### Rate limits

Per client IP (first hop of `X-Forwarded-For`; loopback exempt) unless
stated. Exceeding a bucket returns `429` with a body that says which.

| Bucket | Default | Routes |
| --- | --- | --- |
| Anonymous ingest | **6 / hour / IP** (`VERSE_INGEST_PER_HOUR`) | `POST /v1/ingest`, `POST /v1/ingest/begin`, `POST /v1/ingest/url` without a valid account token |
| Authenticated ingest | **20 / hour / token** (`VERSE_INGEST_PER_HOUR_TOKEN`), independent of IP | the same routes with `Authorization: Bearer` |
| Publish | 30 / hour | `/v1/experience`, `/v1/tour`, `/v1/poster` |
| Review posts | 60 / hour | `POST /v1/review/<scene>` |
| Account creation | **3 / day** | `POST /v1/account` |
| Login | 30 / hour | `POST /v1/account/login` |
| Dashboard reads and scene management | 240 / hour | `/v1/account/*`, `/v1/scenes/*`, `/v1/ops/*`, review moderation |
| Telemetry | 240 / hour | `POST /v1/telemetry` |
| Analytics rows | 3600 / hour (`VERSE_ANALYTICS_PER_HOUR`) — about ten viewers behind one office network | `POST /v1/telemetry` with `kind` `view`, `look`, `act` or `batch` |
| Health | rate-limited, no auth | `GET /v1/health/deep` |
| Assistant | 40 / hour (`VERSE_ASSIST_PER_HOUR`) | `POST /v1/assist` |

### Plan allowances: 402 and the Verse-Upgrade header

Every plan has monthly allowances (storage, bandwidth, API calls, Verse
Homes, films, room captures, renders, seats, max upload — see
[Plans and pricing](guides/plans-and-pricing.md)). The server enforces all
of them. **API calls** are requests authenticated with an
`Authorization: Bearer` header (an org API key or an account token); they
are counted per account and per key for the billing month. `/v1/plans`,
sign-in and webhooks are never counted, and a browser session (cookie) is
not an API call.

At an allowance the route answers **`402 Payment Required`**:

```json
{
  "error": "Your API allowance of 5000 calls this month is used up. Starter includes 50000 API calls a month.",
  "code": "upgrade_required",
  "feature": "apiCallsPerMonth",
  "limit": 5000,
  "used": 5000,
  "plan": "free",
  "suggest": "starter",
  "upgrade_url": "https://verse.ctruh.com/pricing?from=api_call&suggest=starter",
  "nudge": { "type": "limit_100", "title": "…", "body": "…", "url": "https://verse.ctruh.com/n/…", "next": { "plan": "starter", "price": { "amount": 29, "currency": "USD" } } }
}
```

`error`, `limit`, `used`, `plan` and `upgrade_url` are always present
(`upgradeUrl`, relative, is kept for older clients); `feature` names the
allowance (`storageGB`, `bandwidthGB`, `apiCallsPerMonth`,
`plan2homePerMonth`, `filmsPerMonth`, `capturesPerMonth`, `rendersPerMonth`,
`seats`, `rawUploadMB`, …). The `upgrade_url` carries the trial offer while
the account's trial runs (`&offer=trial`). A 402 is not retryable until the
plan changes or the billing month resets.

Near an allowance (80 % or more of API calls used) every API response
carries a **`Verse-Upgrade`** header:

```
Verse-Upgrade: https://verse.ctruh.com/pricing?suggest=starter&from=nudge_limit_80; meter=apiCallsPerMonth; used=82%; plan=free; next=starter
```

Viewers are never refused: a published scene keeps opening when its owner
is over the month's bandwidth (it is served at a lighter quality).

### Endpoint index

| Area | Routes |
| --- | --- |
| [Ingest](#ingest) | `GET /v1/limits` · `POST /v1/ingest` · `GET /v1/ingest/<job>` · `POST /v1/ingest/<job>/contact` · `POST /v1/ingest/url` · `POST /v1/ingest/begin` · `PUT|GET /v1/ingest/part/<uploadId>` · `POST /v1/ingest/commit/<uploadId>` |
| [Accounts](#accounts-studio) | `POST /v1/account` · `POST /v1/account/login` · `POST /v1/account/logout` · `GET /v1/account` · `GET /v1/account/scenes` · `GET /v1/account/stats` · `GET /v1/account/analytics[.csv]` · `GET|POST /v1/account/webhooks` · `DELETE /v1/account/webhooks/<id>` · `GET /v1/account/webhooks/<id>/deliveries` |
| [Scenes](#scenes) | `POST /v1/scenes/<id>/claim` · `DELETE /v1/scenes/<id>` · `PATCH /v1/scenes/<id>` · `GET /v1/scenes/<id>/stats` · `POST|GET /v1/scenes/<id>/share` · `DELETE /v1/scenes/<id>/share/<shareId>` · `GET /v1/scenes/<id>/current` · `/v1/scenes/<id>/versions[/<n>[/diff|/activate|/file|/stage]]` · `GET /v1/scenes/<id>/heatmap` · `GET /v1/scenes/<id>/analytics[.csv]` · `GET /v1/scenes/<id>/report[.csv]` · `GET|POST /v1/scenes/<id>/report/links` · `DELETE /v1/scenes/<id>/report/links/<linkId>` · `GET /v1/reports/<token>[.csv]` · `GET|PUT|DELETE /v1/scenes/<id>/enquiry` · `GET /v1/scenes/<id>/experiences` · `PUT|GET /v1/scenes/<id>/experience` · `PUT /v1/scenes/<id>/ground` · `GET|PUT /v1/scenes/<id>/config` |
| [Embeds](#embeds) | `GET /oembed` · `GET /embed` (the lazy embed card) |
| [Review comments](#review-comments) | `POST|GET /v1/review/<scene>` · `DELETE /v1/review/<scene>/<id>` · `POST /v1/review/<scene>/<id>/resolve` |
| [Publishing](#publishing-experiences-tours-posters) | `POST /v1/experience` · `GET|PUT /v1/experience/<id>` · `POST /v1/experience/<id>/media` · `POST /v1/tour` · `POST /v1/poster` |
| [Presence](#presence-rooms) | `GET /v1/room/<room>/events` (SSE) · `POST /v1/room/<room>/pose` · `POST /v1/room/<room>/signal` · `POST /v1/room/<room>/leave` · `POST /v1/tour/invite` · `GET /v1/tour/invite/<code>` · `GET /t/<code>` |
| [Signing](#signing) | `GET /v1/pubkey` |
| [Operations](#operations) | `GET /v1/health/deep` · `GET /v1/status` · `GET /v1/ops/ingest-stats` · `GET /v1/ops/errors` · `GET /v1/ops/leads` · `GET /v1/config` · `POST /v1/telemetry` |
| [Floor plan to 3D home](#floor-plan-to-3d-home) | `POST /v1/plan2home/analyze` · `POST /v1/plan2home/build` · `GET /v1/plan2home/status` |
| [Assistant](#assistant) | `POST /v1/assist` (SSE) · `GET /v1/assist/status` |
| [Compile fleet](#compile-fleet-v1-work) | `GET /v1/work/claim` · `GET /v1/work/<id>/source` · `GET /v1/work/<id>/images` · `POST /v1/work/<id>/stage` · `POST /v1/work/<id>/result` |

## Ingest

### GET /v1/limits

What an uploader should know **before** choosing a file. Public, no auth,
`Cache-Control: public, max-age=60`. The app's upload screen and its
preflight are driven by this body; guide:
[What you can upload](guides/what-you-can-upload.md).

```sh
curl -sS https://HOST/v1/limits
```

```json
{
  "limits": { "maxUploadBytes": 536870912, "maxUploadMB": 512, "maxPreparedUploadMB": 2048, "compileWallClockMin": 45, "compileAttemptMin": 30,
              "maxAttempts": 3, "concurrentCompiles": 2, "queueMax": 32, "maxSplats": 4000000,
              "uploadsPerHour": { "anonymous": 6, "account": 20 }, "jobRecordTtlMin": 120, … },
  "formats": [ { "ext": "glb", "name": "GLB (binary glTF 2.0)", "kind": "mesh", "note": "…" }, … ],
  "extensions": { "decoded": ["KHR_draco_mesh_compression", "KHR_mesh_quantization", "EXT_texture_webp", "KHR_texture_basisu", "EXT_meshopt_compression", "KHR_meshopt_compression"],
                  "unsupported": ["EXT_texture_avif", "KHR_gaussian_splatting"] },
  "textures": { "streamedMaterials": 2048, "streamBudgetMB": 768, "streamSizePx": 2048, "heroTextures": 12, "heroSizePx": 4096 },
  "recommended": { "triangles": 3000000, "textures": 400, "textureSizePx": 2048, "fileMB": 170, "basis": "…", "note": "…" },
  "timing": { "secondsPerMB": 8, "floorS": 15, "source": "formula", "samples": 0 },
  "queue": { "active": 1, "compiling": 1, "waiting": 0 },
  "storage": { "freeMB": 3811, "ok": true },
  "notify": { "email": true },
  "scanImport": { "extensions": ["usdz", "usd", "usda", "usdc", "glb", "gltf", "ply", "obj", "zip", "e57", "las", "laz", "xyz", "pts", "splat"],
                  "maxUploadMB": 512, "convertBudgetMin": 15, "cleanupBudgetMin": 10, "packAttemptMin": 30, "compileWallClockMin": 45,
                  "maxCloudPoints": 200000000, "maxSplats": 4000000,
                  "up": ["auto", "x", "y", "z", "-x", "-y", "-z"], "units": ["auto", "m", "cm", "mm", "in", "ft"], "linkImport": false }
}
```

| Field | Meaning |
| --- | --- |
| `limits` | **enforced** — the server's own constants and environment |
| `recommended` | **recommendations, not limits** — the largest scene tested every release; larger scenes are attempted |
| `textures` | the texture streaming budget (the compiler's defaults unless the server's environment overrides them) |
| `timing` | typical build seconds per source MB — `source: "history"` once the server has enough completed builds of its own, else the `"formula"` (~8 s/MB) |
| `queue` | live: jobs in flight, compiles running, jobs waiting for a slot |
| `notify.email` | whether this server can email uploaders (see [contact](#post-v1-ingest-job-contact)) |
| `scanImport` | [Import a scan](scan-import.md): the capture extensions, the same upload cap, the budget of each step a capture goes through (converter, cleanup, packing attempt, whole job), the point and splat caps, the accepted `X-Verse-Up` / `X-Verse-Units` values, and `linkImport: false` (a hosted-tour link is recognised, not fetched) |

### POST /v1/ingest

Upload a 3D file; the compile runs in the background.

- **Body**: the raw bytes — no multipart. A GLB (`Content-Type:
  model/gltf-binary`), a Gaussian-splat capture (`.splat` antimatter15
  or INRIA 3DGS binary `.ply`), a point cloud (`.ply` with `x y z`
  vertices, `.las`/`.laz` LAS 1.2–1.4 point formats 0–10, `.e57`), an
  **IFC** building model (`.ifc`, IFC2x3 / IFC4), a **USD** scene
  (`.usdz`, `.usd`, `.usda`, `.usdc` — one self-contained file; see
  [IFC and USD](#ifc-and-usd-2-7)), or an **FBX** / **OBJ** model, alone or
  in a `.zip` with its textures (see [FBX and OBJ](#fbx-and-obj-3-0)). Max **512 MB** one-shot; larger files (up to the plan's raw cap, 2 GB on Free) go through the
  [resumable upload](#resumable-uploads) and are prepared on arrival.
- **Headers** (optional): `X-Verse-Name` — slug prefix for the scene id
  (`[a-z0-9-_]`); `X-Verse-Kind: splat` | `cloud` | `ifc` | `usd` | `fbx` | `obj` | `ply` (a PLY mesh) — force the kind (otherwise
  sniffed: `ply\n` magic → splat when the 3DGS fields are present, else
  cloud; `LASF` / `ASTM-E57` magic → cloud; `ISO-10303-21` → ifc; `#usda`,
  `PXR-USDC` or a `.usdz` zip → usd; `Kaydara FBX Binary` or an ASCII
  `; FBX` header → fbx; OBJ text → obj; a zip holding an `.fbx` / `.obj` →
  fbx / obj — for IFC/USD/FBX/OBJ the bytes decide and the
  header is only a hint; a 32-byte-aligned body with
  neither the `VPK1` nor `glTF` magic → splat); `X-Verse-Units: m` | `cm` |
  `mm` | `in` | `ft` — the file's unit for an OBJ (see
  [FBX and OBJ](#fbx-and-obj-3-0)) and, 4.0, for a scan capture that does
  not declare one (OBJ, PLY, text clouds, E57, LAS; otherwise read from the
  capture's height); `X-Verse-Up: auto` | `x` | `y` | `z` | `-x` | `-y` |
  `-z` — which file axis is up for a capture (otherwise from the
  surfaces, then the format's convention; GLB and USD keep the frame they
  declare); `X-Verse-Scan: clean` | `off` — force or skip the scan
  cleanup (levelled floor, debris removed, small holes filled, baked-in
  light evened out) instead of letting detection decide; the record's
  `scan` says what was done — guide: [Import a scan](scan-import.md);
  `X-Verse-Source` — tool attribution;
  `X-API-Key` in keyed mode; `Authorization: Bearer` to own the scene;
  `X-Verse-Bake: preview` | `final` — [bake the lighting](#bake-for-me-2-7)
  of a live-lit GLB on the server before compiling (2.7);
  `X-Verse-As: product` | `interior` | `building` | `exterior` — say what
  the file is (the upload card's "3D model or scene?" answer: a model is
  a `product`, a scene is walkable); without it the classifier decides;
  `X-Verse-Path: fidelity` | `streamed` — (2.8) take the
  [Fidelity road](guides/fidelity-mode.md): the Draco-decoded file itself
  is published as `ingest/<id>.fidelity.glb` (textures at source
  resolution, no compile, seconds), opened by `/view?glb=`; without the
  header an upload streams as before and the record's `classification`
  says what the shared classifier would pick; `X-Verse-Look:
  studio:neutral|warm|dark[,bg:rrggbb]` — the studio preset and backdrop
  the share link opens with (`?look=`).
- Draco-compressed, KHR-quantized and WebP/KTX2-textured GLBs are accepted
  and normalized server-side.

```sh
curl -sS -X POST https://HOST/v1/ingest \
  -H "Content-Type: model/gltf-binary" -H "X-Verse-Name: docs-demo" \
  --data-binary @scene.glb
# HTTP/1.1 202 Accepted
# {"job":"docs-demo-718035483f84"}
```

- **Validation**: right after the upload, before a compile is queued, the
  server inspects the file (magic bytes; for a GLB its JSON chunk — meshes,
  triangles, external references, required extensions). A file it cannot
  build still answers `202 {job}`; the job's first poll is then
  `status: "error"` with a [friendly error](#friendly-errors). Nothing was
  compiled and any key quota is refunded.
- **Response `202`**: `{ "job": "<id>" }`. The job id **is** the scene id. - **Errors**: `400` malformed · `401` unknown/missing key (keyed mode) ·
  `413` over 512 MB · `429` rate limit or quota (body says which) · `503`
  compile queue full · `507` storage full — refused **before** the body is
  read when free space is below `max(VERSE_MIN_FREE_MB, 3× the declared
  size)`.

### GET /v1/ingest/<job>

Fidelity mode (2.8) adds to a done record: `path` (`"fidelity"` |
`"streamed"`), `glbUrl` (`https://HOST/ingest/<id>.fidelity.glb`),
`classification` (`{ kind, path, plan, evidence, requested, resolved,
reason? }` — the verdict with its evidence: meshes, triangles, textures,
`maxTextureDim`, `decodedMB`, `longestSide`, lights, lighting), `look`,
`digest` (`sha256:<hex>` of the artifact) and `signature` (base64 Ed25519
over that digest under the server's signing key, the `.vpk` trailer's
twin), `stats.mode: "fidelity"`; `arUrl` as for a streamed scene.

Poll every few seconds until `status` leaves `"compiling"`. Small models
compile in seconds; multi-million-triangle scans in minutes. `estimateS` is
the expected build time, calibrated against this server's recent builds of
similar size (falling back to ~8 s per source MB, floor 15 s).

A finished record may carry `prepare: { inputBytes, outputBytes, resized, meshesInstanced, seconds }` when the server ran [verse-prepare](guides/verse-prepare.md) on the upload (it does not when the file arrived with the marker), and its `fixes` line says what changed.

```sh
curl -sS https://HOST/v1/ingest/docs-demo-718035483f84
```

```json
{ "status": "compiling", "stage": "textures", "started": 1790833827622, "sizeMB": 0.0016, "estimateS": 15,
  "attempt": 1, "progress": 0.31, "etaS": 9, "etaText": "A few seconds left",
  "preflight": { "format": "glb", "triangles": 24, "meshes": 2, "materials": 2, "textures": 0, "compression": [] } }
```

```json
{
  "status":   "done",
  "finished": 1790833827961,
  "url":      "https://HOST/?vpk=ingest/docs-demo-718035483f84.vpk",
  "vpkUrl":   "https://HOST/ingest/docs-demo-718035483f84.vpk",
  "stageUrl": "https://HOST/ingest/docs-demo-718035483f84.stage.json",
  "planUrl":  "https://HOST/ingest/docs-demo-718035483f84.plan.svg",
  "arUrl":    "https://HOST/ingest/docs-demo-718035483f84.usdz",
  "ar":       { "bytes": 13122418, "triangles": 24, "textures": 0, "resized": 0, "seconds": 0.01 },
  "stats":    { "mode": "streamed", "tris": 24, "clusters": 3 },
  "signed":   true,
  "verify":   { "ok": true, "checks": 7 }
}
```

```json
{ "status": "error", "finished": 1790833827961,
  "error": "The file has no meshes with triangles — nothing we could show. Make sure the objects are selected and visible when exporting, and that “Mesh” is ticked in the exporter. Curves, empties and cameras alone are not enough.",
  "errorInfo": { "code": "no_meshes", "title": "There is no 3D geometry in this file",
                 "message": "The file has no meshes with triangles — nothing we could show.",
                 "fix": "Make sure the objects are selected and visible when exporting, …", "retryable": false } }
```

While compiling:

| Field | Meaning |
| --- | --- |
| `progress` | `0..1`, never goes back |
| `etaS` / `etaText` | seconds left and its label ("About 6 min left"). **Never counts up**: it includes the queue wait while queued, and once a build overruns its estimate `etaS` is `0`, `overEstimate` is `true` and the label reads "Finishing up — taking a little longer than usual". Absent during `preparing` (no number is promised before the server knows whether the job must queue) |
| `queue` | `{ position, waiting }` while the job waits for a compile slot |
| `attempt` | `1..3` — which build attempt is running (see [Self-healing](#self-healing)) |
| `healing` | present while a retry runs: one plain sentence for the uploader, e.g. "That took more memory than expected — rebuilding with lighter texture settings. No action needed." |
| `preflight` | what the server's inspection found: format, triangles, meshes, materials, textures, compression |
| `fixes` | what the server repaired on the fly, in plain words (also on the `done` record) |
| `contact` | `true` once a contact is attached (never the contact itself) |

When done:

| Field | Meaning |
| --- | --- |
| `url` | the share link — opens the viewer and streams |
| `vpkUrl` / `vspUrl` / `vpcUrl` | the compiled artifact itself (range-addressable, per-group checksummed, signed) |
| `cdnUrl` | present when `VERSE_CDN_BASE` is set: the same artifact on the edge (the origin URL would `302` there anyway) |
| `stageUrl` / `planUrl` | auto-staging sidecars (below); absent when the scene has no walkable floor or was compiled by a pre-staging fleet worker |
| `arUrl` / `ar` | (2.7) [See it in your room](guides/view-in-ar.md): the iOS AR Quick Look package `GET /ingest/<id>.usdz` (`model/vnd.usdz+zip`; same visibility and `?v=` rules as the scene) and its report `{ bytes, triangles, textures, resized, seconds }` — present for product-scale scenes under the AR caps (150 MB prepared source, 5 M triangles; interiors never); otherwise `ar: { skipped }` says why and there is no `arUrl` |
| `stats` | `{ tris, clusters }` for meshes, `{ splats, chunks }` for captures, `{ points, nodes }` for point clouds; `texCache: { hits, misses }` when the encode cache was used; `healed: true` when the scene landed on a retry |
| `propsUrl` | (2.7) IFC/USD scenes: the `<id>.props.json` object index — per-node identity, storeys, types, property sets and the cluster → object map the viewer's properties panel reads ([IFC and USD](#ifc-and-usd-2-7)) |
| `convert` | (2.7) IFC/USD scenes: the conversion report `{ kind, schema, products, triangles, materials, storeys, skipped, seconds }` (while `stage` is `converting`: `{ kind, phase, done, total }`) |
| `stats` | `{ tris, clusters }` for meshes (+ `products` for IFC/USD), `{ splats, chunks }` for captures, `{ points, nodes }` for point clouds; `texCache: { hits, misses }` when the encode cache was used; `healed: true` when the scene landed on a retry |
| `attempts` | present when more than one build attempt was needed (also on a final `error`) |
| `signed` | `true` = Ed25519-signed by this server and the signature verified before the job was marked done. (`false` only on `.vsp` splat jobs whose signing failed; the capture still streams and the record carries `warning`) |
| `verify` | `{ ok, checks, repaired? }` — the scene passed [verification](#verify-before-done) before it was handed out; `repaired` lists findings fixed on the spot |
| `stats.mode` | `"streamed"` (a `.vpk`) or `"classic"` — published through the [lossless fallback](#lossless-fallback); the record then has `modelUrl` instead of `vpkUrl`, plus `fallback { mode, reason }` and `notice` (the sentence to show the uploader) |
| `poster` | added later by the first viewer's automatic capture (`ingest/<id>.poster.png`) |
| `prepare` | `{ inputBytes, outputBytes, resized, meshesInstanced, seconds }` when the server ran verse-prepare on the upload |
| `bake` | (2.7) when the upload asked for a bake: the report `{ quality, seconds, traceSeconds, texels, hiddenTexels, lightmaps, hiddenAreaFraction, eyes, lights, emitters, sky, spp: [min, max], sppAchieved, noise: [pre, post], vertexLit, unconverged, fill, bytes }` (2.7.2 added `sppAchieved` — mean samples per visible texel —, `noise` — the worst lightmap's relative noise before → after the denoiser —, `vertexLit` — materials shaded per vertex: cut-outs plus refused lightmaps —, `unconverged` — lightmaps the quality gate refused — and `fill` — the interior fill radiance, 0 for an open scene), or `{ quality, skipped }` with the reason the scene was compiled live-lit instead — see [Bake for me](#bake-for-me-2-7) |

- Compile jobs and finished records are durable: after a server restart a
  job in flight is recovered and a finished one answers its full record
  again. Polling clients should ride out the server being away for a few
  minutes rather than fail.
- **Errors**: `404` unknown or expired job — finished job records are kept for **2 hours**; the compiled artifact lives much longer (see
  [Retention](#retention)).

#### Compile stages

While compiling, `stage` is live text. In pipeline order:

| `stage` | Meaning |
| --- | --- |
| `preparing` | upload accepted; payload being normalized (Draco rewrite, KTX2 transcode) |
| `converting` | (2.7) an IFC / USD upload is being converted to glTF (web-ifc / tinyusdz); the record's `convert { kind, phase, done, total }` and `workText` follow the product count, `progress` runs 0.02–0.10 |
| `baking` | (2.7) the cloud bake is tracing the lighting into lightmaps (`X-Verse-Bake`); the record's `bake { quality, phase, done, total }` and `workText` follow its progress, `progress` runs 0.03–0.15 |
| `queued` | waiting for a compile slot (two concurrent compiles per origin) |
| `remote` | claimed by an external fleet worker; its own stage reports follow |
| `textures` | texture encode / atlas phase (also the stage of every retry — `attempt` and `healing` say which) |
| `geometry` | meshlet-DAG build (clusters, LOD hierarchy) |
| `packing` | writing the container (`.vpk`; the whole pack phase for `.vsp` splat and `.vpc` point-cloud jobs) |
| `signing` | Ed25519-signing the finished file |
| `verifying` | checking the built scene before it goes live (integrity, signature, counts, bounds, texture streams, staging) |
| `uploading` | storing the artifact in the bucket (`VERSE_STORAGE=s3` only) |
| `publishing` | publishing the model in compatibility mode (the lossless fallback) |

Treat the value as informational — fleet workers may report additional
lowercase `[a-z-]` stages; never gate behaviour on a specific string.

#### Friendly errors

No raw compiler, OS or runtime text ever reaches an uploader. Every failure
the ingest path can produce maps to one entry of a single taxonomy
(`web/playground/upload-care.js`, shared by the server and the app):

- `error` — **always a string**: one friendly sentence plus its fix. Safe
  to print verbatim; exporters and the embed SDK need no change.
- `errorInfo` — `{ code, title, message, fix, retryable }`. `retryable`
  answers "is trying the same file again worthwhile?".

| `code` | When |
| --- | --- |
| `file_too_large` · `empty_file` · `unsupported_format` · `already_compiled` · `gltf_version` | the file is not something the server builds |
| `gltf_external_files` | a GLB/glTF that references a separate `.bin` or image files |
| `corrupt_file` · `no_meshes` · `unsupported_geometry` · `unsupported_feature` · `bad_texture` | the model itself: damaged, empty, lines/points, a compression that cannot be decoded, an unreadable image |
| `splat_invalid` · `splat_too_many` | Gaussian-splat captures |
| `cloud_invalid` · `cloud_too_many` | point clouds (`.ply`/`.las`/`.laz`/`.e57`; 200 M-point cap) |
| `bim_invalid` | (2.7) not a readable IFC (ISO-10303-21) or USD (`#usda` / `PXR-USDC` / usdz) file, or the reader found no products / Mesh prims with geometry — not retryable |
| `convert_failed` | (2.7) the IFC/USD converter crashed or ran past its budget (15 min) — retryable |
| `rate_limited` · `quota_exceeded` · `auth_required` · `bad_request` | the request |
| `storage_full` · `server_busy` · `server_unreachable` | the server cannot take the upload right now (`507`, `503`, a gateway timeout) — retryable |
| `upload_interrupted` · `upload_incomplete` · `upload_expired` · `network` | the transfer |
| `out_of_memory` · `compile_timeout` · `output_invalid` | the build failed **after** the self-healing retries and the model was too large for the lossless fallback |
| `compile_stalled` · `compile_interrupted` · `server_restart` · `compiler_unavailable` · `storage_write_failed` | our side — retryable, the operator is alerted |
| `unknown_job` | job records expire after 2 hours |
| `internal` | anything unforeseen: an honest generic message; the full detail is in the server log and the operator's alert |

Treat unknown codes as `internal`; new codes may be added.

#### Self-healing

A compile that fails for a recoverable reason is retried automatically —
deterministically, up to **3 attempts**, inside the 45-minute wall clock:

| Failure | Next attempt |
| --- | --- |
| interrupted (`SIGTERM` on a restart, a spawn that could not start) | re-run as it was |
| out of memory (killed), per-attempt timeout, or stalled (no output and no CPU for 10 min — `VERSE_COMPILE_STALL_S`) | lighter texture settings: fewer streamed materials, a smaller byte budget, no 4096² hero tier; fewer encode threads after a memory kill, a shorter texture deadline after a timeout |
| the output failed [verification](#verify-before-done) (a fleet worker's result included) | rebuilt on the next rung |
| still failing | last compile rung: the low-memory ETC1S texture path (`VERSE_TEX_SAFE`), one encode thread, a small streamed set. Geometry and the preview atlas are untouched |
| every rung failed, or the wall clock ran out | the [lossless fallback](#lossless-fallback): the job still ends `done` |

Bad input and server faults (disk full, a compiler crash) are not retried
— a server fault goes straight to the lossless fallback. The encode cache
stays in effect across attempts, so a retry reuses every texture the
failed attempt already encoded. While a retry runs the record carries
`attempt` and `healing`; a healed scene reports `stats.healed: true` and
`attempts`. Splat packs are not retried.

#### Verify before done

A compiled scene is checked **before** its job is marked `done` (stage
`verifying`), so a bad output is never handed out as a link:

| Check | Fails when |
| --- | --- |
| `opens` | the file is not a readable `.vpk` |
| `integrity` | the contents do not match the hash the compiler recorded (truncated, altered) |
| `signature` | the Ed25519 signature is missing or does not verify — repaired by signing again |
| `counts` | no clusters or triangles; the full-detail level does not carry the source's triangles; a payload range lies outside the file |
| `bounds` | bounds are not finite, reach outside the source's bounds (2 % tolerance), or collapsed to a fraction of them |
| `texture-streams` | a referenced texture stream, the preview atlas or the collision grid is missing from the file |
| `staging` | the `.stage.json` spawn is not finite, is implausibly far away, or — for an object-scale scene (largest extent under 2 m) — sits **inside** the object. Repaired by removing the spawn from the manifest (the tour and the floor plan stay): the viewer then frames the scene itself |

A finding with a repair is fixed on the spot and re-checked
(`verify.repaired`). Anything else fails the attempt: the scene is rebuilt
on the next rung of the ladder and, past that, published through the
lossless fallback. The hook is pluggable — `OUTPUT_CHECKS` in
`web/playground/verify-output.mjs`.

#### Lossless fallback

When every rung fails, the output keeps failing verification, or the
45-minute wall clock runs out, the uploader still gets a working link: the
prepared model itself is published through the viewer's non-virtualized
classic path.

```json
{ "status": "done",
  "url": "https://HOST/?model=ingest/villa-0413581a2dd3.classic.glb",
  "modelUrl": "https://HOST/ingest/villa-0413581a2dd3.classic.glb",
  "stats": { "mode": "classic", "tris": 184220 },
  "fallback": { "mode": "classic", "reason": "out_of_memory" },
  "notice": "Published in compatibility mode: full quality, larger download.",
  "attempts": 3 }
```

- `url` is a share link like any other; there is no `vpkUrl`. Embed it
  with `data-model="<modelUrl>"` rather than `data-scene`.
- The file is the uploaded model after normalization (Draco decoded) — the
  link therefore serves the source geometry and textures in full.
- Offered for prepared models up to `VERSE_CLASSIC_FALLBACK_MB` (default
  **96**; `0` disables it; published as `limits.classicFallbackMaxMB`).
  Larger models, splat captures and unreadable files fail with the friendly
  taxonomy instead.
- The operator is alerted on Slack and the ops history records the outcome
  `classic-fallback`.
- **Animated and rigged models take this path by design.** A streamed scene
  is static, so a model with animations or skins that fits the size cap is
  published here directly — no compile attempt — with
  `fallback.reason: "animated"`, a `notice` saying the animation was kept,
  and the ops outcome `classic-animated` (no Slack alert). A larger
  animated model compiles as a static streamed scene.

### POST /v1/ingest/<job>/contact

Attach the uploader's contact to a job — the app's "email me when it's
live" form. JSON body, max 4 KB:

```sh
curl -sS -X POST https://HOST/v1/ingest/docs-demo-718035483f84/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Rao","phone":"+91 98765 43210","email":"asha@example.com","consent":true}'
# {"ok":true,"emailConfigured":true,"emailed":false,"notify":"when-live"}
```

- `name` (2–80 chars), `email`, `phone` (7–15 digits; `+`, `00`, spaces,
  dashes and brackets accepted) and `consent: true` are all required.
- `notify`: `"when-live"` — an email goes out when the job reaches `done`
  (or an apology if it finally fails); `"sent"` — the job had already
  finished, the email went immediately; `"follow-up"` — this server has no
  mail provider configured, nothing is sent and the operator follows up.
- One scene mails one address: a different address after the email went
  out is `409`.
- **Errors**: `400` `{ error, field }` on invalid input · `404` unknown
  or expired job · `429` (12 per hour per IP).
- The contact is stored on the server in a private file, is never
  served, never appears in a job record and is never logged in full.

#### Auto-staging sidecars

Scenes whose compile produced a walk-collision grid also emit, beside the
artifact:

- **`<id>.stage.json`** — `{ "spawn": { "position", "yaw" }, "tour": {
  "samples": [[t,x,y,z,fx,fy,fz], …] }, "bounds": { "min", "max" },
  "kind": "interior" | "object" | "open", "walk": true | false,
  "view": { "mode": "walk" | "orbit", "eye", "look", "radius" } }`.
  `kind` is what the scene is: an **interior** (ceilinged, person-sized
  free space) opens at `view` — standing at the spawn in walk mode; an
  **object** (nowhere a person could stand) has no `spawn`, `walk: false`,
  an orbit `view` framing the whole object from outside and a turntable
  tour, and no `.plan.svg`; an **open** scene (walkable ground under open
  sky) has no `view` and opens on the overview orbit. Manifests written
  before `kind` existed carry only the first three fields and behave as
  before. `?view=overview` on the viewer skips the opening view. The
  spawn is a walkable interior pick (on the main walkable floor, clear of
  walls and furniture); the tour is a loop in the `/v1/tour` sample
  format — for interiors a 20–60 s walkthrough **planned through free
  space** on the collision grid (room targets, A* with wall clearance,
  smoothed and re-validated, ~0.9 m/s, yaw ≤ 45°/s; rows every 0.2 s), an
  orbit for open-sky scenes, a slow pan at the spawn when an interior has
  no routable rooms. Scenes compiled before 2026-10-01 carry the old
  straight-leg tour and must be re-ingested to get a planned one. The
  viewer applies the spawn and offers **Tour** and **Export video**
  when a plain `?vpk=` link loads (no tour → no chip).
- **`<id>.plan.svg`** — a deterministic 2D floor plan (walkable floor,
  walls, spawn dot, scale bar, north arrow, area label); `data-nx/nz/
  cell/ox/oz` carry the grid mapping. The minimap uses it as its base.
- **`<id>.usdz`** — (2.7) the iOS AR Quick Look package of a product-scale
  scene (`GET /ingest/<id>.usdz`, `model/vnd.usdz+zip`, immutable, the
  scene's visibility and `?v=` version key), built from the prepared GLB at
  compile time; the record's `arUrl` points at it and `ar` carries the
  report or the reason there is none. Put it in `<a rel="ar"><img></a>`
  and Safari opens it in AR — [guides/view-in-ar.md](guides/view-in-ar.md).

#### Retention

**Account-owned scenes are permanent.** Unowned scenes are retained
best-effort: when compiled scenes exceed the disk budget
(`VERSE_VPK_BUDGET_MB`, default 3500), the least-recently-opened unowned
`.vpk`/`.vsp` and its sidecars are evicted. Uploaded source files are
deleted after compile — except for a scene published through the
[lossless fallback](#lossless-fallback), where the uploaded GLB is the scene. Finished job records expire after 2 h;
compile intermediates are swept after 2 h.

### Bake for me (2.7)

A live-lit GLB — lights in the file (`KHR_lights_punctual`), no lightmaps —
streams with the engine's live lighting. Ask for a **cloud bake** and the
server traces the lighting into lightmaps before it compiles, so the link
streams with the baked look (the path the renderer does best; see
[the guide](guides/bake-for-me.md)):

- `POST /v1/ingest` with `X-Verse-Bake: preview` (or `final`); resumable
  uploads pass `"bake": "preview" | "final"` in the `begin` body (the header
  on `commit` also works). `1`/`true` mean `preview`. Ignored for splats
  and point clouds.
- **preview**: lightmaps up to 1024² per material, a 24 M-texel scene
  budget, 64 samples per texel, one indirect bounce, ≤ ~10 min on a
  3 M-triangle flat. **final**: 2048², 96 M texels, 256 samples, two
  bounces, ≤ ~30 min.
- Surfaces no visitor can see from the walkable floor (the compiler's
  occupancy grid) are not traced and get a flat ambient level; the report's
  `hiddenAreaFraction` says how much that was.
- The job passes through `stage: "baking"` with live counters (`bake.phase`
  `visibility` | `lightmaps` | `texels`, `done`, `total`, plus `workText`).
  The done record carries `bake` (the report, above) and a `fixes` line
  ("Baked the lighting for you (preview quality): …"). The published link
  is the baked scene; `stats.mode` and verification are as for any upload.
- A scene the bake cannot carry — animated or skinned, already baked,
  nothing bakeable (all glass / unlit / cut-out) — or a bake that fails or
  runs past its cap (`VERSE_BAKE_TIMEOUT_S`, default 15 min preview /
  45 min final) is compiled **live-lit as it came**; the record says so in
  `bake.skipped` and `fixes`. `VERSE_BAKE=0` turns the stage off.
- The upload screen offers the same thing as its **Lighting** choice (2.7.2):
  **Keep as exported** (the default — no bake), **Bake for me · preview** or
  **Bake for me · final**, shown on every live-lit upload. Preflight records carry `lighting: "live" | "baked" | "unlit"`
  and `lights`.

```sh
curl -sS -X POST https://HOST/v1/ingest -H "Content-Type: model/gltf-binary" \
  -H "X-Verse-Name: flat-a" -H "X-Verse-Bake: preview" --data-binary @flat-a.glb
# … poll: {"status":"compiling","stage":"baking","bake":{"quality":"preview","phase":"lightmaps","done":12,"total":40},"workText":"Baking lighting · lightmap 12 of 40"}
# … done: {"status":"done","bake":{"quality":"preview","seconds":312.4,"texels":18200000,"lightmaps":40,"hiddenAreaFraction":0.31,…},"fixes":["Baked the lighting for you (preview quality): …"]}
```

### Resumable uploads

For clients whose single large POST keeps dying mid-body (edge proxies are
unkind to 100 MB+ requests). Same pipeline, different transport: `commit`
answers the exact `202 {job}` the one-shot path does and everything from
`GET /v1/ingest/<job>` on is identical. The Blender add-on switches to this
flow automatically above 100 MB.

#### POST /v1/ingest/begin

- **Body**: `{ "size": <bytes>, "name"?: "<slug>", "kind"?: "splat", "prepared"?: true, "bake"?: "preview" | "final", "path"?, "look"?, "scan"?, "up"?, "units"? }` (the last five are the body spellings of `X-Verse-Path` / `-Look` / `-Scan` / `-Up` / `-Units`; the headers also work on `commit`) —
  `size` is the exact total length: **1 … the plan's raw cap** (Free 500 MB,
  Starter 2 GB, Pro 10 GB, Scale 20 GB, Enterprise custom — `rawUploadMB`
  in `plans.json`; past it, or past the plan's storage with the files you
  already have, `402 upgrade_required`, past the server's own
  `VERSE_MAX_RAW_MB` `400 file_too_large`). Send anything over 64 MB through
  this resumable path; the one-shot `POST /v1/ingest` keeps its 512 MB door.
  The server **prepares** every model on arrival (convert, right-size
  textures, merge duplicates, instance repeated meshes) and the plan's size
  limit (Free 500 MB, Starter 2 GB, Pro 10 GB, Scale 20 GB) applies to the
  **prepared** size: over it, stronger tiers run automatically (2K, then 1K
  textures; colour maps to JPEG, normal maps stay lossless), then the job
  pauses with `prepare.state: "choice"` and the 402 upgrade shape
  (`prepare.choice.deny`) — answer with
  `POST /v1/ingest/<job>/choice {"action":"compress"|"cancel"|"recheck"}`;
  upgrading the plan lets the same job carry on by itself. `"prepared": true`
  (verse-prepare ran on your side) still reads the plan's prepared limit.
  The job record carries `prepare` (`state`, `line` such as
  `"943 MB → 292 MB · 405 textures optimised · 41 meshes reused"`, `tiers`) and,
  for an FBX / OBJ naming textures that were not in the upload,
  `convert.textureWarning` (`count`, `names`, `message`) — non-blocking.
- Rate, quota and storage gates run **here** (this is the upload's
  debit).

```sh
curl -sS -X POST https://HOST/v1/ingest/begin -H "Content-Type: application/json" \
  -d '{"size":1696,"name":"docs-resumable"}'
# {"uploadId":"c5de5f9fdbf9aab0","received":0,"size":1696}
```

- **Errors**: `400` bad size · `401`/`429` key/quota/rate · `503` too
  many open uploads · `507` storage full.

#### PUT /v1/ingest/part/<uploadId>

Append one part. **Strictly ordered, one at a time**: the part's
`Content-Range` start must equal the server's current `received`.

```sh
curl -sS -X PUT https://HOST/v1/ingest/part/c5de5f9fdbf9aab0 \
  -H "Content-Range: bytes 0-847/1696" --data-binary @part1.bin
# {"uploadId":"c5de5f9fdbf9aab0","received":848,"size":1696}
```

- **Errors**: `400` malformed or mismatched range / body length (a torn
  body rolls back to the last good offset) · `404` unknown or expired
  upload · **`409` out of order** — the body carries the authoritative
  offset; resume from there:

```json
{ "error": "out-of-order part: next byte is 848", "received": 848 }
```

  A `409` whose `received` equals the part's own start means **another
  attempt at this part is still in flight** (`"another part is already
  uploading"`): wait and retry. A writer that has sent nothing for 30 s
  (`VERSE_PART_STALL_S`) is cut when the next attempt arrives, so a client
  that vanished behind a proxy never holds the upload for long.
- **Refusals are readable.** A refused part of up to 64 MB is answered and
  its body drained rather than the connection cut, so clients that stream
  the body without `Expect: 100-continue` (Node's `fetch`) read the status
  instead of a reset ("fetch failed").

#### GET /v1/ingest/part/<uploadId>

`200 { uploadId, received, size }` — how a client that lost its connection
learns where to resume. After a server restart `received` is the number of
bytes that actually reached the disk (it may sit in the middle of the part
that was in flight). A committed upload also carries `job`.

#### POST /v1/ingest/commit/<uploadId>

Send the same auth headers as a one-shot upload (`X-API-Key` debits the
quota here; `Authorization: Bearer` stamps the owner).

```sh
curl -sS -X POST https://HOST/v1/ingest/commit/c5de5f9fdbf9aab0
# HTTP/1.1 202 Accepted
# {"job":"docs-resumable-c47d410e4f51"}
```

- **Errors**: `401`/`429` · `404` unknown/expired upload · `409` upload
  incomplete (body carries `received`/`size`) · `503` compile queue full.
- **Idempotent**: committing an already-committed upload answers the same
  `202 {job}` — retry a commit whose response was lost.

**Upload sessions survive server restarts.** Each open upload is recorded
on the server (`ingest/.uploads/`, never served); after a restart `GET
/v1/ingest/part/<uploadId>` answers the true `received` and the client
continues from there. A client should treat a network error or a gateway
status (`502`/`503`/`504` without `X-Verse-Error`) on any of these routes
as "the server is away": wait, `GET` the part to resync, carry on. The web
app does exactly that (`web/playground/upload-transport.js`) and shows
"Reconnecting — your upload is safe" meanwhile. **2 hours** of inactivity
(`VERSE_UPLOAD_STALE_MS`) expires a session and later requests answer `404`. A `404`/`405` on `begin` is also how an
older server without these routes announces itself — fall back to one-shot.

### Upload from URL

`POST /v1/ingest/url` — the server fetches the file itself and compiles it
exactly like a body upload. For automation platforms (Zapier, Make, n8n)
and CMS media libraries, where the file already has a URL and should not
pass through the automation platform.

```sh
curl -sS -X POST https://HOST/v1/ingest/url -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"url":"https://www.dropbox.com/scl/fi/…/palm-villa.glb?dl=1","name":"palm-villa"}'
# HTTP/1.1 202 Accepted
# {"job":"palm-villa-3f1c9a2b7e04","sizeBytes":48213990,"source":"uc1234.dl.dropboxusercontent.com"}
```

- **Body** (JSON, ≤ 4 KB): `url` (required, absolute `http(s)`), `name`
  (scene name; default: the file name in the URL), `kind` (as `X-Verse-Kind`;
  default: from the URL's extension, the bytes decide), `bake`, `path`,
  `look`, `scan` (as the resumable `begin`). `X-Verse-Kind` / `X-Api-Key` /
  `Authorization` headers work as on `POST /v1/ingest`.
- **What is fetched.** Public addresses only: the host name is resolved by
  the server and every address must be routable (no loopback, private,
  link-local / cloud-metadata, CGNAT, multicast; IPv6 ULA / link-local /
  v4-mapped alike), the request goes to the vetted address (the name travels
  as `Host` / SNI, so a DNS answer cannot change between check and use),
  redirects are followed by hand (at most 3, each re-vetted), the download
  is streamed to disk and cut at the upload limit (512 MB; a `Content-Length`
  over it is refused before a byte is read), 10 minutes wall clock. A
  Dropbox share link needs `dl=1`; a Google Drive link needs "Anyone with the
  link"; S3 / R2 / GCS work with a presigned URL.
- **Answer**: the one-shot `202 {job}` plus `sizeBytes` and `source` (the
  host the file came from). Poll `GET /v1/ingest/<job>` as usual.
- **Errors** (same contract, `errorInfo.code`): `400 url_blocked` (not
  `http(s)`, credentials in the URL, a private / local / unresolvable host),
  `400 bad_request` (no `url`), `400 empty_file`, `404 url_fetch_failed` (the
  URL answered 404), `413 file_too_large`, `502`/`504 url_fetch_failed`
  (the URL did not give a file, ended early, redirected too often, timed
  out), `401` / `429` / `503` / `507` as `POST /v1/ingest`. Rate-limited
  with the ingest bucket.

### Splat captures

`POST /v1/ingest` with a `.splat`/`.ply` body (and ideally `X-Verse-Kind:
splat`) packs a streamed `.vsp` instead of compiling a mesh. Same limits,
quotas, rate buckets and polling (stage `packing`):

```json
{
  "status": "done",
  "url":    "https://HOST/?model=ingest/room-9f3a01b2c4d5.vsp",
  "vspUrl": "https://HOST/ingest/room-9f3a01b2c4d5.vsp",
  "stats":  { "splats": 1200000, "chunks": 160 },
  "signed": true
}
```

`.vsp` files are Ed25519-signed like `.vpk` scans (an 80-byte trailer
over the head the browser already fetched). Splat jobs always pack on the
origin — the compile fleet runs `verse-compile` only. WebGPU tiers only in
the viewer.

### Point clouds

`POST /v1/ingest` with a `.ply` (xyz vertices, no 3DGS fields), `.las`,
`.laz`, `.e57` or `.xyz` / `.pts` text body — `X-Verse-Kind: cloud` recommended; LAS/LAZ (`LASF`)
and E57 (`ASTM-E57`) are sniffed by magic, a plain `.ply` by its header —
packs a streamed `.vpc` octree (`docs/vpc-format.md`) instead of compiling
a mesh. Same limits, quotas, rate buckets and polling (stage `packing`);
input cap **200 M points** (`limits.maxCloudPoints`; `cloud_too_many`
otherwise, `cloud_invalid` for unreadable files):

```json
{
  "status": "done",
  "url":    "https://HOST/?model=ingest/scan-9f3a01b2c4d5.vpc",
  "vpcUrl": "https://HOST/ingest/scan-9f3a01b2c4d5.vpc",
  "stats":  { "points": 5000000, "nodes": 509 },
  "signed": true
}
```

`.vpc` files are Ed25519-signed with the `.vsp` trailer convention
(`VPCS`). Cloud jobs always pack on the origin. The viewer streams them in
**both** tiers (WebGPU and WebGL2); `?cloud=scale,min,max,lit` tunes the
point discs. Text clouds: one point per line, `x y z` with optional
intensity, colour (0–255 or 0–1) and normal. Formats not read: ASCII LAS
text dumps, PTX, `.e57` spherical-only scans without Cartesian data.

### IFC and USD (2.7)

`POST /v1/ingest` with an `.ifc` (IFC2x3 or IFC4 STEP) or a single-file
USD (`.usdz`, `.usd`, `.usda`, `.usdc`) body — `X-Verse-Kind: ifc` | `usd`
is a hint; the bytes decide (`ISO-10303-21`, `#usda`, `PXR-USDC`, a zip
whose first entry is a `.usd*` layer). The upload is **converted on the
server** (stage `converting`; `tools/ifc-convert`: web-ifc for IFC,
tinyusdz for USD — both WASM) into a glTF where **every product / Mesh
prim is one node** carrying its identity in `extras`, then takes the
ordinary mesh road (prepare → compile → sign → verify). The compiler
builds **one detail hierarchy per product**, so every streamed cluster
belongs to exactly one object at every level of detail — a click names
the object, and hiding a storey removes its pixels, in both tiers.

```json
{
  "status": "done",
  "url":      "https://HOST/?vpk=ingest/house-9f3a01b2c4d5.vpk",
  "vpkUrl":   "https://HOST/ingest/house-9f3a01b2c4d5.vpk",
  "propsUrl": "https://HOST/ingest/house-9f3a01b2c4d5.props.json",
  "stats":    { "mode": "streamed", "tris": 48, "clusters": 4, "products": 4 },
  "convert":  { "kind": "ifc", "schema": "IFC4", "products": 4, "triangles": 48, "materials": 3, "storeys": 2, "skipped": 0, "seconds": 0.1 },
  "fixes":    ["Converted the IFC model (IFC4) on our side: 4 objects, 48 triangles, 2 storeys in 1 s. Click any object in the link for its properties."]
}
```

- **`<id>.props.json`** — the object index, served next to the scene under
  the same rules as `.stage.json`; the scene's `.stage.json` carries
  `"props": true` so viewers fetch the sidecar only when it exists (private scenes: owner or share token
  only; versioned, deleted and backed up with the scene):
  `{ "version": 1, "source": "ifc" | "usd", "schema", "products",
  "nodes": { "<glTF node>": { "id", "type", "name", "storey"?, "description"?, "tag"?, "props": { "Pset_WallCommon.IsExternal": true, … }, "bounds"? } },
  "ids": { "<GlobalId | prim path>": node }, "storeys": [ { "name", "elevation"?, "id"?, "nodes": […] } ],
  "types": { "IfcWall": [nodes…] }, "clusters": { "count", "runs": [[firstCluster, count, node | -1], …] } }`.
  For IFC `id` is the GlobalId, `type` the entity (`IfcWall`), `storey` the
  containing IfcBuildingStorey, and `props` the flattened property sets
  and quantities (`Pset.Property` → value; type psets included); for USD
  `id` is the prim path, `type` is `Mesh` and `storey` the group below the
  root prim. `bounds` is the world AABB.
- **Viewer**: the share link grows an *Objects* panel (tree by storey and
  type with visibility toggles, search by name / id / type, the selected
  object's property sets); clicking an object selects it; `?select=<id>`
  deep-links to one. Hidden objects are dropped before the cut test in
  both tiers (never drawn, never requested).
- **Embed SDK**: `viewer.getProperties(id)` / `getProperties()`,
  `viewer.setVisible(ids, bool)` / `isolate(ids)` / `setVisible("all")`,
  `viewer.select(id, { frame })`; events `objects`, `select`, `visibility`,
  and `pick` carries `object`. `@ctruhtech/verse-sdk`: `kind: "ifc" | "usd"` (and, 3.0, `"fbx" | "obj"`) on
  `upload()`; `JobRecord.propsUrl` / `convert`.
- **What is read**: IFC2x3 and IFC4 body geometry through web-ifc (every
  product with a representation; `IfcSpace`, openings, annotations and
  grids are skipped; unstyled products take a per-type palette); USD Mesh
  prims (any face size, triangulated), xform chains, the stage's `upAxis`
  (Z-up is stood upright) and `metersPerUnit`; materials from a
  **MaterialX** network (OpenPBR `ND_open_pbr_surface_surfaceshader`; Autodesk
  `ND_standard_surface_surfaceshader` in `.usda` text layers) or
  `UsdPreviewSurface` → glTF PBR with clearcoat, sheen, transmission,
  specular, IOR and emissive-strength extensions; base colour, normal,
  emissive, occlusion and metallic/roughness textures inside the file (the
  last two packed into one). `convert` adds `materialX`, `standardSurface`,
  `previewSurface` (materials per model), `extensions`, `upAxis`,
  `metersPerUnit`. Files over 160 MB use tinyusdz's 64-bit build. **Not read**:
  IFC files over the 512 MB cap, USD references / payloads / sublayers to
  files outside the upload (`usdz` carries its own), skinning, animation,
  point instancers, Standard Surface inside binary crates (`.usdc` /
  `.usdz` — their UsdPreviewSurface is used), texture connections on
  Standard Surface. Conversion runs under the compile semaphore
  with a 15-minute budget (`VERSE_CONVERT_TIMEOUT_S`); BIM jobs always
  compile on the origin. Guide: [docs/guides/publish-from-ifc.md](guides/publish-from-ifc.md).

### FBX and OBJ (3.0)

`POST /v1/ingest` with an `.fbx` (binary or ASCII, FBX 2011–2020 / 7.1–7.7),
an `.obj`, or a `.zip` holding either with its `.mtl` and textures —
`X-Verse-Kind: fbx` | `obj` is a hint; the bytes decide. The upload is
**converted on the server** (stage `converting`, phases `unpack` →
`transcode` (ASCII FBX) → `import` → `export`; `tools/model-convert`:
headless Blender 5.0, ASCII FBX transcoded to binary first, MTL texture
paths repaired against the zip) into a GLB that then takes the **ordinary
GLB road**: verse-prepare, classification from the converted GLB, Fidelity
(`X-Verse-Path: fidelity` for a product) or streamed. No props sidecar.

```json
{
  "status": "done",
  "url": "https://HOST/?vpk=ingest/boat-9f3a01b2c4d5.vpk",
  "convert": { "kind": "fbx", "schema": "FBX 7.4 ASCII", "container": "zip", "products": 115,
               "triangles": 3747008, "materials": 28, "images": 95, "pbrUpgraded": 28,
               "units": "from the FBX header", "size": [36.2, 19.9, 23.8], "animations": 0, "skins": 0,
               "missingTextures": [], "missingTextureCount": 0, "seconds": 72.1 },
  "fixes": ["Converted the FBX 7.4 ASCII file on our side (from the zip): 115 objects, 3,747,008 triangles, 28 materials, 95 textures — 36 × 20 × 24 m; 28 PBR materials (3ds Max Physical / Stingray / Arnold) mapped in 1 min."]
}
```

- **Units and axes**: FBX from the file's `UnitScaleFactor` and `UpAxis`
  (a centimetre Z-up 3ds Max file lands in metres, Y-up). OBJ has no
  units: `X-Verse-Units` (`m` | `cm` | `mm` | `in` | `ft`; SDK `units`)
  says which; without it a model wider than 1,000 units is read as
  centimetres and wider than 100,000 as millimetres (`convert.units`
  says what was assumed).
- **Materials**: Phong / Lambert; 3ds Max Physical, Maya Stingray PBS and
  Arnold base values and maps (`convert.pbrUpgraded` counts them); MTL
  `Kd` / `Ke` / `Pr` / `Pm` and `map_*`. Embedded FBX textures always;
  separate files when zipped. Missing ones are listed in
  `convert.missingTextures` and the fix line; the upload still builds.
- **Animation**: node animation and skins, one clip (`convert.animations`
  is 1 when anything moves; static takes are dropped). OBJ: none.
- **Zip rules**: Deflate or stored, no password, zip64 fine; entries that
  escape the folder are skipped; unpacked size capped (`VERSE_ZIP_MAX_BYTES`,
  20 GB); other scene files (`.max`, `.blend`, USD, glTF) are not unpacked.
- **Errors**: `model_invalid` (not retryable) — not FBX/OBJ bytes, FBX
  older than 7.1, a zip without a model, a file Blender cannot read;
  `convert_failed` (retryable) — the converter crashed or ran past
  `VERSE_CONVERT_TIMEOUT_S` (15 min), or Blender is not installed on the
  server. Guide: [docs/guides/upload-fbx-obj.md](guides/upload-fbx-obj.md).

## Accounts & Studio

Accounts add **ownership, analytics, privacy and moderation** on top of ingest. There is no e-mail and no password: the account **token is the credential**, like an API key.

> The token is returned **once**, at creation. It cannot be recovered or
> rotated (delete-and-recreate is the rotation story). Anyone holding it
> controls the account.

Accounts sit **beside** keyed mode: anonymous uploads and every existing
share link behave exactly as before. Auth on every account route (and on
any ingest, poster, tour or experience publish that should carry an
owner): `Authorization: Bearer <token>`, or the `verse_session` cookie.

### POST /v1/account

```sh
curl -sS -X POST https://HOST/v1/account -H "Content-Type: application/json" -d '{"name":"Docs Demo"}'
# {"accountId":"acct-5fab29f5aa8e","name":"Docs Demo","createdAt":1790833829999,
#  "token":"<64 hex, shown once>",
#  "note":"This token is shown once and IS your credential — store it like an API key."}
```

Hard-limited to **3 per day per IP**. `name` ≤ 80 chars.

### POST /v1/account/login · POST /v1/account/logout

```sh
curl -sS -c jar.txt -X POST https://HOST/v1/account/login \
  -H "Content-Type: application/json" -d '{"token":"<token>"}'
# {"accountId":"acct-5fab29f5aa8e","name":"Docs Demo"}
```

`login` sets `verse_session` (httpOnly, SameSite=Lax, Secure over https;
value = the token) — how `/studio` authenticates in a browser. `logout`
clears it.

### GET /v1/account · /v1/account/scenes · /v1/account/stats

```sh
curl -sS https://HOST/v1/account -H "Authorization: Bearer <token>"
# {"accountId":"acct-5fab29f5aa8e","name":"Docs Demo","createdAt":1790833829999}

curl -sS https://HOST/v1/account/scenes -H "Authorization: Bearer <token>"
# {"accountId":"acct-5fab29f5aa8e","scenes":[{"id":"docs-demo-718035483f84","kind":"vpk","path":"streamed",
#   "url":"https://HOST/?vpk=ingest/docs-demo-718035483f84.vpk",
#   "fileUrl":"https://HOST/ingest/docs-demo-718035483f84.vpk","visibility":"unlisted",
#   "engine":{"version":12,"current":12,"older":false},
#   "sizeBytes":46910,"created":1790833827960,
#   "stats":{"opens":0,"uniqueSessions":0,"totalMinutes":0},"reviews":{"open":0,"total":0}},
#  {"id":"shoe-0437dfafa54a","kind":"fidelity","path":"fidelity",
#   "url":"https://HOST/?glb=ingest/shoe-0437dfafa54a.fidelity.glb",
#   "fileUrl":"https://HOST/ingest/shoe-0437dfafa54a.fidelity.glb",
#   "glbUrl":"https://HOST/ingest/shoe-0437dfafa54a.fidelity.glb", …}]}

curl -sS https://HOST/v1/account/stats -H "Authorization: Bearer <token>"
# {"accountId":"acct-5fab29f5aa8e","scenes":1,"opens":0,"uniqueSessions":0,"totalMinutes":0,
#  "last7d":[{"day":"2026-09-25","opens":0}, … 7 entries]}
```

Analytics come from viewer telemetry (batches carry `scene`): an *open* is
a session's first batch for a scene on a day; `totalMinutes` estimates
10 s per frame-histogram batch. The window is the current telemetry log
plus one rotation (~64 MB); forward telemetry to a warehouse
(`VERSE_TELEMETRY_URL`) when history must outlive it.

**`GET /studio`** is the dashboard built on these routes: create/sign in,
scene cards (poster, open, copy link, embed snippet, delete), visibility
and share links per scene, stats, claim by id, sign out — and, per streamed
scene (2.5.0), a **Versions** panel (list, diff, make current, delete,
upload new version) and an **Analytics** panel (heatmap over the floor
plan + funnel).

### Webhooks (2.7)

Per-account receivers for the things an integration waits on. Events:

| Event | When | `data` |
| --- | --- | --- |
| `scene.ready` | a job the account owns finished | `{ job, scene, status: "done", url, vpkUrl?, stats? }` (`scene` = the scene id, the same as `job`) |
| `scene.failed` | …or failed (the friendly error, never the raw detail) | `{ job, scene, status: "error", error, code }` |
| `ping` | only from `POST …/webhooks/<id>/test` — not subscribable | `{ hook, events }` |
| `comment.added` | a review pin landed on an owned scene | `{ scene, comment: { id, t, pos, text, author?, measure? } }` |
| `version.promoted` | a new version went live, or a rollback | `{ scene, version, job?, diffSummary? \| rollback: true }` |
| `config.changed` | the owner saved (or cleared) a configuration schema | `{ scene, groups: [{ id, name, options }] }` |

A delivery is one `POST` of `{ "id", "event", "t", "account", "data" }`
with `Content-Type: application/json` and the headers `X-Verse-Event`,
`X-Verse-Delivery` (the id), `X-Verse-Timestamp` (unix seconds) and
`X-Verse-Signature: sha256=<hex>` — HMAC-SHA256 with the hook's secret
over `<timestamp>.<raw body>`. Verify by recomputing it over the bytes
you received and comparing in constant time; reject stale timestamps.
A non-2xx answer, a timeout (10 s) or an unreachable host is retried:
**3 tries**, backoff 2 s then 8 s. Redirects are not followed and the
receiver's response body is never read or stored.

```js
import { createHmac, timingSafeEqual } from "node:crypto";
const expected = "sha256=" + createHmac("sha256", SECRET).update(`${req.headers["x-verse-timestamp"]}.${rawBody}`).digest("hex");
const ok = timingSafeEqual(Buffer.from(expected), Buffer.from(req.headers["x-verse-signature"] ?? ""));
```

Or, with `@ctruhtech/verse-sdk` (WebCrypto — Node 18+, Workers, Deno, Bun):
`await verifyWebhook({ secret, body: rawBody, signature, timestamp })`
— constant-time, rejects timestamps more than 5 minutes off. Copy-paste
receivers: [developers.md § Webhooks](developers.md#webhooks).

#### GET /v1/account/webhooks

→ `{ "accountId", "events": [...all five], "webhooks": [{ "id", "url", "events", "created", "secretHint", "last"? }] }`.
The secret is **never** returned after creation; `secretHint` is its last
four characters. `last` is the newest delivery's `{ t, ok, event }`.

#### POST /v1/account/webhooks

```sh
curl -sS https://HOST/v1/account/webhooks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/verse-hook","events":["scene.ready","comment.added"]}'
# {"id":"3f1c9a2b7e04","url":"https://example.com/verse-hook","events":[…],"created":…,"secretHint":"…c1d2","secret":"<shown once>"}
```

`url` must be an absolute http(s) URL (in production: a public address,
no credentials); `events` defaults to all five; `secret` (16–128 chars)
is generated when omitted and shown **once**. Ten webhooks per account.
Errors: `400` · `401` · `409` at the cap.

#### DELETE /v1/account/webhooks/<id>

→ `{ "deleted" }`. The delivery log goes with it. `404` for another
account's hook.

#### GET /v1/account/webhooks/<id>/deliveries

→ `{ "id", "deliveries": [{ "id", "event", "t", "ok", "attempts": [{ "t", "ms", "status", "error"? }] }] }`,
the last 50, newest first. `status` 0 with `error` `"timeout"` or
`"unreachable"` when no HTTP answer came back. No secrets, no payloads
from the receiver — the log is safe to show in Studio.

#### POST /v1/account/webhooks/<id>/test

One signed `ping` delivery to the hook **now**, a single attempt
(no retries), logged like any other →
`{ "id", "delivery", "ok", "status", "ms", "error"? }`. The quickest way
to prove a receiver verifies signatures before the first real upload.

```sh
curl -sS -X POST https://HOST/v1/account/webhooks/3f1c9a2b7e04/test -H "Authorization: Bearer $TOKEN"
# {"id":"3f1c9a2b7e04","delivery":"9a0b…","ok":true,"status":200,"ms":41}
```

## Scenes

All owner-only unless noted: `401` without account auth, `404` for anyone
who is not the owner (existence is never advertised).

| Route | What |
| --- | --- |
| `POST /v1/scenes/<id>/claim` | Take ownership of an **unowned** scene → `{ "id", "owner" }`. `409` if someone else owns it. |
| `DELETE /v1/scenes/<id>` | Remove the artifact, its sidecars, poster and review file; every share link stops working; the job record `404`s. |
| `PATCH /v1/scenes/<id>` `{ "visibility" }` | `"public"` · `"unlisted"` (default) · `"private"` → `{ "id", "visibility" }`. |
| `GET /v1/scenes/<id>/stats` | Per-scene `{ id, opens, uniqueSessions, totalMinutes, last7d }`. |
| `POST /v1/scenes/<id>/share` | Mint a share token → `{ "id", "suffix", "created", "shareToken" }`. The 32-hex token is shown **once** (stored hashed); up to 32 per scene. |
| `GET /v1/scenes/<id>/share` | Active share links as `{ "scene", "shares": [{ "id", "suffix", "created" }] }` — never the tokens. |
| `DELETE /v1/scenes/<id>/share/<shareId>` | Revoke one → `{ "revoked": "<shareId>" }`; holders get `404`s from then on. |

```sh
curl -sS -X POST https://HOST/v1/scenes/docs-demo-718035483f84/claim -H "Authorization: Bearer <token>"
# {"id":"docs-demo-718035483f84","owner":"acct-5fab29f5aa8e"}
curl -sS -X PATCH https://HOST/v1/scenes/docs-demo-718035483f84 -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"visibility":"private"}'
# {"id":"docs-demo-718035483f84","visibility":"private"}
curl -sS -X POST https://HOST/v1/scenes/docs-demo-718035483f84/share -H "Authorization: Bearer <token>"
# {"id":"0ca2f454","suffix":"629b","created":1790833830310,"shareToken":"<32 hex, shown once>"}
```

### Visibility & share tokens

- **`unlisted`** *(default)* — reachable by anyone with the URL, listed
  nowhere.
- **`public`** — reserved for a future gallery; serves identically to
  unlisted today.
- **`private`** — *every* artifact (`.vpk`/`.vsp`, `.stage.json`,
  `.plan.svg`, poster) and the scene's review comments require the owner's
  auth or a share token. Everyone else gets a `404` byte-identical to a
  missing file's, plus `X-Verse-Private: 1` so the viewer can say "This
  scene is private". Range requests work unchanged for anyone granted
  access.

```sh
curl -sS -D - -o /dev/null https://HOST/ingest/docs-demo-718035483f84.vpk
# HTTP/1.1 404 Not Found
# X-Verse-Private: 1
curl -sS -D - -o /dev/null -H "Range: bytes=0-1023" \
  "https://HOST/ingest/docs-demo-718035483f84.vpk?share=<shareToken>"
# HTTP/1.1 206 Partial Content
# Cache-Control: private, no-store
```

Share tokens are 16 random bytes (32 hex), returned once, stored as
SHA-256 hashes, compared in constant time, never logged. Pass `?share=` on
the share link (the app threads it onto every artifact fetch, including the
worker's range requests) or on artifact URLs, or send `X-Verse-Share`.
Deleting the scene or losing ownership revokes them all.

> **CDN caveat:** with `VERSE_CDN_BASE` set, unlisted/public artifacts > `302` to the edge; a **private scene never redirects** — CDN copies are
> public bytes with no auth in front. Flipping an already-cached scene
> private does not purge the edge; purge it there.

Anonymous (ownerless) scenes have no visibility record and can never be
private until an owner claims them. Step-by-step:
[Share privately with tokens](guides/share-privately.md).

### Scene versions (2.5.0)

An owned, streamed (`.vpk`) scene takes a new upload as a **version**. The
share link (`/view?vpk=ingest/<id>.vpk`) never changes and always serves the
*current* version; Studio lists every version with a diff against the one
before; rollback points the link at an older version. Private/share-token
rules are unchanged (version artifacts are only reached through the scene's
own names or the owner-only routes below).

| Route | Who | What |
| --- | --- | --- |
| `GET /v1/scenes/<id>/current` | anyone who may read the scene (private: owner or `?share=`) | `{ id, version, versions, file }` — `file` is `ingest/<id>.vpk` for a scene without versions, `ingest/<id>.vpk?v=<N>` otherwise (the viewer fetches the scene under that per-version cache key, so a new version is a new entry in the browser cache, the device scene cache and any CDN). `no-store`. |
| `POST /v1/scenes/<id>/versions` (GLB body, `Content-Type: model/gltf-binary`, optional `X-Verse-Name`) | owner | Compiles the upload as an ordinary job → `202 { id, job, pending: true, url }`; when it finishes it is **promoted**: archived as version N, made current, diffed. Poll `GET /v1/ingest/<job>` — the finished record carries `sceneId`, `version`, `diffSummary` and points at the scene link. |
| `POST /v1/scenes/<id>/versions` (JSON `{ "job" }`) | owner | Attach a job the same account uploaded through `/v1/ingest` — done (`200 { version }`) or still compiling (`202 { pending: true }`, promoted when done). The job stops being a scene of its own. |
| `GET /v1/scenes/<id>/versions` | owner | `{ id, current, versions: [{ n, created, sizeBytes, tris, clusters, materials, textures, name, bounds, variants, current, diffSummary }], pending?, lastError? }` — oldest first. |
| `GET /v1/scenes/<id>/versions/<n>/diff` | owner | The diff of version n against the version before it (`<id>.v<n>.diff.json`): `triangles`/`clusters`/`sizeBytes` `{ before, after, delta }`, `bounds` (min/max/extent deltas), `materials` (`added`/`removed`/`changed` by name with base colour hex, metallic, roughness, texture resolution), `textures` (count, largest, `resolutionChanges` per image), `summary`. Computed from the pre-compile GLB scan, the compiler's stats and the staging manifest. |
| `POST /v1/scenes/<id>/versions/<n>/activate` | owner | Rollback / forward: the scene's names serve version n → `{ id, current, changed }`. |
| `GET /v1/scenes/<id>/versions/<n>/file` · `/stage` | owner | That version's `.vpk` (Range supported) and staging manifest — Studio's "Open v2". |
| `DELETE /v1/scenes/<id>/versions/<n>` | owner | Remove an archived version (never the current one: `409`). Numbers are never reused. |

```sh
curl -sS -X POST https://HOST/v1/scenes/docs-demo-718035483f84/versions -H "Authorization: Bearer <token>" \
  -H "Content-Type: model/gltf-binary" -H "X-Verse-Name: flat-v2" --data-binary @flat-v2.glb
# {"id":"docs-demo-718035483f84","job":"flat-v2-3c1f0a9e77d2","pending":true,"url":"https://HOST/?vpk=ingest/docs-demo-718035483f84.vpk"}
curl -sS https://HOST/v1/scenes/docs-demo-718035483f84/current
# {"id":"docs-demo-718035483f84","version":2,"versions":2,"file":"ingest/docs-demo-718035483f84.vpk?v=2","v":2}
curl -sS https://HOST/v1/scenes/docs-demo-718035483f84/versions/2/diff -H "Authorization: Bearer <token>"
# {"from":1,"to":2,"summary":"+12 triangles · 1 material added · 2 changed · 1 resolution change · +1 KB", …}
```

Up to 50 versions per scene. The archive lives under `ingest/.versions/<id>/`
on the server (never served directly); the current version is a hard link
to it. With a CDN in front, a new version is a new URL (`?v=`), so no purge
is needed; a *rollback* re-uses an older key the edge may still hold —
purge there if the edge cached it. The upload screen in `/app` offers
"New version of …" to a signed-in owner (`/app?version-of=<id>` preselects).

### Heatmap (2.5.0)

| Route | Who | What |
| --- | --- | --- |
| `GET /v1/scenes/<id>/heatmap` | owner | Where visitors stood and where they waited for bytes, as a 2D grid over the floor plan, plus the funnel. `{ id, sampleEveryMs: 2000, window, sessions, samples, grid: { ox, oz, cell, nx, nz, stood[], stalled[], max, maxStalled, bounds, fromStage }, funnel: { opens, entered, walked, s30, m2 }, privacy }`. The grid's world mapping matches the `.plan.svg`'s `data-ox/oz/cell`, so Studio draws it straight over the plan. Folded from the telemetry log (current + one rotation), cached a minute; `?fresh=1` refolds. |

The rows it folds are the viewer's **look feed** (`kind: "look"`, see
[Telemetry](telemetry.md#look-and-stall-feed-2-5)): one per 2 s while the
scene is live. No IP is stored anywhere (the sink appends the body only);
`?analytics=0`, the embed option `analytics: false` and Do Not Track opt a
viewer out entirely.

### Analytics

The numbers behind Studio's **Analytics** page (`/studio/analytics`) and the
printable client report (`/studio/report?scene=<id>&days=30`). Guide:
[Show your clients who looked](guides/analytics.md).

| Route | Who | What |
| --- | --- | --- |
| `GET /v1/scenes/<id>/analytics?days=7\|30\|90` | owner | One scene over the last 7, 30 (default) or 90 UTC days (other values → `400`). `{ id, range: {days, from, to}, views, uniqueViewers, returningViewers, time: {totalSeconds, medianSeconds, averageSeconds}, funnel: [{key, label, n, pct}], hotspotClicks, devices: {class, os, inApp, via: [{key, n, pct}]}, title, rooms: [{key, name, kind: "room"\|"outside"\|"overview", visitors, seconds, pct, area, x, z, corridor, named}], roomsSource: "plan"\|"none", floorM2, roomsPerVisit, roomMap, viewpoints: [{x, z, yaw, samples, seconds, room, facing}], samples, daily: [{day, views, uniqueViewers}], heatmap: {ox, oz, cell, nx, nz, stood[], stalled[], samples, inside, outsideSamples, outside: [{x, z, n, ex, ez}], framed, max, maxStalled, bounds, fromStage}, plan, enquiry, sampleEveryMs, privacy }`. `title` is the scene's name for people (the upload's file name without the id suffix). `roomMap` is the room of every plan cell (one character per cell, `"0"`… = `keys[i]`, `~` open sky, `.` none) for click-to-rename. Funnel keys: `opened`, `interacted`, `stayed30`, `enquired`. Cached a minute; `?fresh=1` refolds. Non-owners `404`, anonymous `401`. |
| `GET /v1/scenes/<id>/analytics.csv?days=…` | owner | The same as a CSV attachment: header, `metric,value` rows, one row per day, funnel, rooms, device / OS / in-app browser / arrival breakdowns. |
| `GET /v1/account/analytics?days=…` | account | Every scene you own added up (unique viewers are the union across scenes) plus `scenes: [{id, views, uniqueViewers, medianSeconds, totalSeconds, enquiries, enquiryConfigured}]`. Rooms and viewpoints are per scene only. |
| `GET /v1/account/analytics.csv?days=…` | account | The account roll-up as CSV, with one row per scene. |
| `GET /v1/scenes/<id>/enquiry` | public (mirrors the scene's visibility) | The scene's enquiry button `{label, url}`, or `204` when none is set. The viewer draws it over the canvas. |
| `PUT /v1/scenes/<id>/enquiry` | owner | `{label?, url}` — `url` must be `https://…`, `mailto:…` or `tel:…` (else `400`); `label` ≤ 40 characters (default "Enquire"). `{url: null}` clears. |
| `DELETE /v1/scenes/<id>/enquiry` | owner | Removes the button. |
| `GET /v1/scenes/<id>/report?days=7\|30\|90` | owner | The **viewer report**: everything `/analytics` returns plus `sources: [{key, n, pct}]` (one per visit — keys below), `hotspots: [{key, name, opens, sessions, pct}]` (opens by hotspot id, named after the default experience's hotspot), `linkClicks`, `questions: {total, sessions, pct}`, `viewers: [{id, sessions, seconds, device, source, rooms, topRoom, roomList: [{name, seconds}], hotspots, questions, firstSeen, lastSeen}]` (the 100 who spent the most time, busiest first), `viewerCount`, `preparedBy`, `visibility`, `sceneUrl`, `shared: false` and `links` (this scene's report links, as below). |
| `GET /v1/scenes/<id>/report.csv?days=…` | owner | The viewer report as a CSV attachment: the `/analytics.csv` sections plus `hotspot_opens`, `hotspot_links_followed`, `questions_asked`, `sessions_with_questions` metrics, `source` breakdown rows, a hotspot section and one row per viewer (all of them). |
| `POST /v1/scenes/<id>/report/links` | owner | `{label?, days?}` (`label` ≤ 60 characters, `days` 7 / 30 (default) / 90 — the link's rolling window) → `201 {id, link: {id, label, days, created, last4}, token, path: "/r/<token>"}`. The token (`r` + 40 hex) is shown **once**; the server keeps its sha256. At most 16 per scene (`409`). |
| `GET /v1/scenes/<id>/report/links` | owner | `{id, links: [{id, label, days, created, last4}]}` — never a token or hash. |
| `DELETE /v1/scenes/<id>/report/links/<linkId>` | owner | Revokes the link at once (`404` if it is not this scene's). Deleting the scene revokes all of them. |
| `GET /v1/reports/<token>` | anyone with the link | The viewer report for the link's window, `shared: true`, `link: {label, days, created}`. Without the owner-only fields: no `links`, no `roomList`, the enquiry label only. For a **private** scene: `sceneUrl: null`, `plan: false` (the plan image is a scene artifact behind the private gate; the room map is drawn without it). Unknown, malformed and revoked tokens are all `404`. `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`. Report tokens and scene share tokens have different shapes: neither opens the other. |
| `GET /v1/reports/<token>.csv` | anyone with the link | The same CSV as the owner's. |
| `PUT /v1/scenes/<id>/rooms` | owner | `{key, name}` names one room (`key` from `rooms[].key`; unknown → `400`); `name: ""` goes back to the default. Stored per scene (≤ 64), used by the dashboard, CSV and report for every stored day. |

**Definitions.** A *view* is one browser tab opening the scene (a session);
a session belongs to the UTC day of its first row. *Unique viewers* are
distinct browser ids; *returning* ones opened the scene in two or more
sessions in the range. *Time* is visible time: look samples × 2 s.
*Interacted* = a drag, tap, wheel or key on the page, or walking.
*Stayed 30 s+* = at least 15 samples. *Enquired* = a click on the enquiry
button. Rooms come from the scene's floor plan (`.plan.svg`): indoor vs
open sky (the plan's `data-open` layer, or ray casting on older plans), then a
watershed over the distance-to-wall field — passages up to 1.25 m wide
(doorways) separate rooms, wider openings join them, slivers under 3 m² merge
into a neighbour, narrow long rooms are corridors. A room is named by the
owner (`PUT …/rooms`), else after the default experience's hotspot standing
in it, else "Room N" / "Corridor N" by area; its `key` (its centre, to 0.5 m)
keeps stored days and names attached across re-segmentation. Samples under
open sky read "Outdoors (terrace / garden)", samples off the plan "Overview
(outside the floor plan)". A scene without an interior plan reports no rooms
(`roomsSource: "none"`). The heatmap is framed to the plan; samples outside
it are listed in `heatmap.outside` with their edge position (`ex, ez`).

**Viewer report.** The page is `/studio/report?scene=<id>` for the owner and
`/r/<token>` for a shared link. A visit's *source* is one key: `embed` when
it ran in an iframe; else the in-app browser it opened in (`whatsapp`,
`instagram`, `facebook`, `linkedin`, `twitter`, `tiktok`, `snapchat`,
`telegram`, `wechat`, `line`); else the referring site's class (`google`,
`search`, `email`, `youtube`, `other`…); else `share` (a private share link)
or `direct` (typed, a QR code, an app that sends no referrer). A viewer is one
browser id; their `source` is how they first arrived, their `device` the one
they used last. A viewer's `id` in a report (`V-` + 6 hex) is a further keyed
hash of the stored pseudonym, scoped to the scene — it is stable within the
scene's reports and is never the stored value. *Hotspot opens* count every
opening of a hotspot (by its id); *questions* count questions asked in Ask
Verse while the scene was open — never their text. The viewer table keeps at
most 5000 viewers per scene-day.

**Storage.** Raw rows live in the telemetry log (rotated at ~32 MB, one
rotation kept). An hour after a UTC day ends it is rolled up per scene into
`ingest/.analytics/<id>/<day>.json` (counts and capped maps — no rows, no
raw ids) and kept for `VERSE_ANALYTICS_KEEP_DAYS` days (default 400; days
older than that are pruned and never reported). Deleting a scene deletes its
roll-ups.

**Privacy.** Analytics rows posted to `/v1/telemetry` are rebuilt from a
whitelist before they are stored (any other field is dropped); the browser id
is stored as a keyed HMAC (per-install salt in `ingest/.analytics/.salt`);
no IP is ever written. Requests with `DNT: 1` or `Sec-GPC: 1` are answered
`204` with `X-Verse-Analytics: off` and not stored.

### Guided tours: a scene's experiences (2.7)

An owner authors hotspots and a guided tour in the viewer (`?author=1`,
[docs/guides/author-a-guided-tour.md](guides/author-a-guided-tour.md)) and
saves them as a version-2 [experience manifest](experience-format.md).
These routes tie experiences to the scene they belong to and pick the one
the share link plays.

#### GET /v1/scenes/<id>/experiences

Owner-only → `{ "scene", "default", "experiences": [{ "id", "name", "created", "updated", "path", "url", "author" }] }`,
newest first. `url` is the `?experience=/v1/experience/<id>` link; `author`
the same link with `&author=1`. `default` names the experience the plain
share link (`/?vpk=ingest/<id>.vpk`) layers over the scene, or `null`.
Errors: `401` no auth · `404` not the owner's scene.

#### PUT /v1/scenes/<id>/experience

```sh
curl -sS -X PUT https://HOST/v1/scenes/SCENE/experience -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"experience":"exp-38fd878a72"}'
# {"scene":"SCENE","experience":"exp-38fd878a72"}
```

Owner-only. `experience` must name one of this scene's experiences (owned
by the same account, published for this scene), or `null` to clear.
Errors: `400` not one of the scene's experiences · `401` · `404`.

#### GET /v1/scenes/<id>/experience

Public, mirroring the scene's visibility (a private scene needs the owner's
auth or a share token; strangers get the same `404` as a missing scene) →
`{ "id", "path", "experience": <manifest> }`, `Cache-Control: no-store`.
`204 No Content` when none is set — the viewer and embeds probe this on
every ingest-scene open, and a 204 keeps the browser console quiet.

### Background (2.8)

#### GET · PUT /v1/scenes/<id>/background · PUT /v1/scenes/<id>/background/image

```sh
curl -sS -X PUT https://HOST/v1/scenes/SCENE/background -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"bg":"grad:2a2f45,0b0d12"}'
# {"scene":"SCENE","bg":"grad:2a2f45,0b0d12","image":null}
curl -sS -X PUT https://HOST/v1/scenes/SCENE/background/image -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: image/vnd.radiance" --data-binary @studio.hdr
# {"scene":"SCENE","bg":"hdr:ingest/SCENE.bg.hdr","image":"ingest/SCENE.bg.hdr","path":"ingest/SCENE.bg.hdr","url":"https://HOST/ingest/SCENE.bg.hdr","bytes":393258}
curl -sS https://HOST/v1/scenes/SCENE/background
# {"scene":"SCENE","bg":"hdr:ingest/SCENE.bg.hdr","image":"ingest/SCENE.bg.hdr","updated":1791753199560}
```

What sits behind the scene ([Fidelity mode guide → Background](guides/fidelity-mode.md#background)):
`bg` is one spec string — `rrggbb` (solid), `transparent`, `grad:rrggbb,rrggbb`
(top → bottom), `studio:neutral|warm|dark` (also the image-based lighting),
`image:ingest/<id>.bg.<jpg|png>` (picture, backdrop only),
`hdr:ingest/<id>.bg.hdr` (lights the model too), or `""` to clear. The PUT
is owner-only and stores the scene's `<id>.bg.json` sidecar; `/image`
takes raw JPEG, PNG or Radiance `.hdr` bytes (sniffed; ≤ 20 MB; EXR is not
read yet) as `<id>.bg.<ext>` and sets `bg` to it. GET is readable by
whoever may open the scene (private: owner or share token). The viewer
replays it on load; `?bg=` on a link wins; the embed SDK has
`setBackground` / `getBackground` and the `background` event. Same
visibility, version and delete rules as the other sidecars. Errors: `400`
bad spec / not an image · `401` · `404` not the owner's scene · `413`
over 20 MB.

### Camera paths (feature #5)

#### GET · POST · PUT /v1/scenes/<id>/paths · GET · PUT · DELETE /v1/scenes/<id>/paths/<pid>

```sh
curl -sS -X POST https://HOST/v1/scenes/SCENE/paths -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Walkthrough","mode":"walk","keys":[
    {"p":[0,1.6,0],"f":[0,0,-1],"label":"Entry"},
    {"p":[0,1.6,-4],"f":[1,0,0],"ease":"stop","hold":1.5,"label":"Living"},
    {"p":[3,1.6,-4],"f":[1,0,0],"fov":40,"look":[5,1,-4]}]}'
# {"scene":"SCENE","id":"p3f9a1c02de","default":true,"keys":3}
curl -sS https://HOST/v1/scenes/SCENE/paths
# {"scene":"SCENE","default":"p3f9a1c02de","paths":[{"id":"p3f9a1c02de","name":"Walkthrough","mode":"walk","keys":3,"labels":["Entry","Living",null],"updated":1792230000000}],"canEdit":false}
curl -sS https://HOST/v1/scenes/SCENE/paths/default
```

A camera path is the owner's authored walkthrough: keyframes recorded in
the viewer (Path → Record), stored beside the scene as `<id>.paths.json`.
Each key carries `p` (eye) and `f` (forward), and optionally `fov`
(vertical degrees, 5–150), `dur` (seconds to the next key; absent = auto
from distance and turn), `hold` (dwell seconds), `ease` (`smooth` —
default — · `stop` · `linear`), `look` (a look-at target: two consecutive
keys with one keep it framed) and `label` (the chapter name, ≤ 80
chars). `mode`: `walk` (eye height over the floor, collision-safe) or
`fly`; `speed` in m/s for auto timing. The viewer bakes it with a
centripetal Catmull-Rom spline, squad orientation and arc-length timing
(`verse_core::campath`). POST creates (the first path becomes the
default), PUT `/paths/<pid>` replaces (`"default": true` also makes it
the default), PUT `/paths` `{default: pid|null}` picks the share link's
default, DELETE removes. Writes are owner-only; GETs mirror the scene's
visibility, `Cache-Control: no-store`. A share link plays a path with
`?path=<pid>` (or `?path=default`). Limits: 24 paths per scene, 2–256
keys, 96 KB per body. Errors: `400` malformed key / bad id · `401` ·
`404` not the owner's scene or no such path · `409` too many paths ·
`413`.

#### Default paths — POST /v1/scenes/<id>/paths/auto

```sh
curl -sS https://HOST/v1/scenes/SCENE/paths
# {"scene":"SCENE","default":"p2fc0a3e33e","auto":{"id":"p2fc0a3e33e","kind":"drone","edited":false},
#  "paths":[{"id":"p2fc0a3e33e","name":"Fly-through","mode":"fly","kind":"drone","auto":true,"keys":11,…}],"canEdit":false}
curl -sS -X POST https://HOST/v1/scenes/SCENE/paths/auto -H "Authorization: Bearer $TOKEN"
# {"scene":"SCENE","default":true,"id":"p2fc0a3e33e","name":"Fly-through","mode":"fly","kind":"drone","auto":true,"keys":[…]}
```

Every scene gets a default camera path without anyone recording one: the
server plans it right after the compile (and, for a scene published
before, on the first read of its paths) with `autopath.js` and stores it
as an ordinary path tagged `auto: true` with a `kind`:

- `walk` — interiors and buildings: an eye-height walkthrough from the
  compile-time tour (tour.rs room targets, doors, gaze) refined until the
  baked spline never enters or brushes a wall voxel, every room of the
  walk grid visited, a chapter per room, 45–90 s;
- `drone` — exteriors, sites, cities, captures: establishing orbit →
  reveal → low pass along the most open corridor → rise and look back;
  altitude and speed scale with the site and every point stays a
  clearance above the tallest voxel under it (the walk grid's height
  field, else the bounds), framed for low sun (the pass runs across the
  sun), 40–80 s;
- `orbit` — products: a 360° hero orbit with a subtle push-in, 24 s.

The auto path becomes the scene's default unless the owner chose another.
An owner's PUT to it makes it theirs (`auto: false`, `from: "auto"`, and
the list's `auto.edited: true`); a re-upload re-plans an unedited auto path
and keeps an edited or deleted one. `POST /paths/auto` (owner) is "Reset
to auto": it re-plans the path in place and makes it the default
(`422` when the scene has nothing to plan from). `GET /paths/auto` reads
it. A share link or embed plays the default path on open with
`?autoplay=path`.

### Interactivity

#### GET · PUT /v1/scenes/<id>/interact

```sh
curl -sS -X PUT https://HOST/v1/scenes/SCENE/interact -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"hotspots":[{"id":"living","anchor":[1,1.5,2],"title":"Living room","price":"₹ 1.2 Cr","icon":"price","cta":{"label":"Book a visit","url":"https://wa.me/910000000000"}}],"toggles":{"daynight":true}}'
curl -sS https://HOST/v1/scenes/SCENE/interact
curl -sS -X PUT https://HOST/v1/scenes/SCENE/interact -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"clear":true}'
```

The owner's light interactivity for a scene, kept beside it as the
`<id>.interact.json` sidecar: **hotspots** (a pin on a surface with a card —
title, text, image, price tag, a call-to-action such as "Book a visit" or a
WhatsApp link, an optional "Fly there" camera), **interactive objects** (a
picked door, piece of furniture or lamp with an action: `door` open/close by
hinge or slide, `visibility`, `material` finish switch, `light` switch,
`clip` glTF animation) with their **triggers** (`click`, `near` with a
radius, a guided-tour `tour` stop) and the scene **toggles** (`daynight`,
`empty` — hides the furniture group, `measure`). The viewer authors it with
`?interact=edit` (signed in); every viewer of the scene gets it. The schema
and its limits (64 hotspots, 64 objects, 64 KB) live in
`web/playground/interact-core.js`, which both the server and the viewer run:
URLs must be `https:`/`http:`, `tel:`, `mailto:`, `whatsapp:` or a same-site
path, images `https:` or same-site. GET mirrors the scene's visibility
(private: owner or share token) and answers `204` when nothing is saved; PUT
is owner-only and returns the stored, sanitized document; `{"clear": true}`
removes it. Same delete rules as the other sidecars. Errors: `400` invalid
JSON · `401` · `404` not the owner's scene · `413` over 64 KB. Hotspot opens,
call-to-action clicks and object use reach the owner's analytics as `act`
rows (`hotspot`, `cta`, `object`; [telemetry](telemetry.md)).

### Ground heightfield (2.7, exterior kit)

#### PUT /v1/scenes/<id>/ground

```sh
curl -sS -X PUT https://HOST/v1/scenes/SCENE/ground -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: image/png" --data-binary @terrain.png
# {"scene":"SCENE","path":"ingest/SCENE.ground.png","url":"https://HOST/ingest/SCENE.ground.png","width":1024,"height":1024,"bytes":412233}
```

Owner-only. The body is a PNG (≤ 4096 × 4096, ≤ 8 MB; the red channel is
the height, 0–255 → 0–`amplitude` metres) stored as the scene's
`<id>.ground.png` sidecar — the same visibility, version and delete rules
as the poster (a private scene gates it; deleting the scene removes it).
The exterior kit displaces its ground
with it when `ground.kind` is `heightfield` and `ground.heightfield` points
at the path (the Exterior panel's **Upload** does both); the walker stands
on the displaced ground. Re-uploading replaces the file. Errors: `400`
not a PNG / over 4096² · `401` · `404` not the owner's scene · `413` over
8 MB.
### Configurator: a scene's configuration schema (2.7)

2.5 switched one `KHR_materials_variants` name from `?variant=`. The
configuration schema is the owner's layer on top: **option groups**
("Fabric", "Legs", "Size"), each option mapping to a material variant
and/or explicit material aliases (multi-material groups) and/or a
visibility set, with an optional SKU and a **display-only** price. The
viewer shows it as a panel, the embed SDK as `setConfiguration()` /
`getConfiguration()` / the `configuration` event, and the whole pick rides
the link as `?cfg=fabric:oak,legs:black` (only non-default picks). Guide:
[docs/guides/build-a-configurator.md](guides/build-a-configurator.md).

```json
{
  "title": "Configure",
  "currency": "USD",
  "base": 890,
  "groups": [
    { "id": "fabric", "name": "Fabric", "default": "oak",
      "options": [
        { "id": "oak",    "name": "Oak",    "variant": "Oak" },
        { "id": "walnut", "name": "Walnut", "variant": "Walnut", "price": 120, "sku": "SOFA-WAL" } ] },
    { "id": "legs", "name": "Legs",
      "options": [
        { "id": "steel", "name": "Steel", "materials": { "4": 7 }, "swatch": "#8a8f98" },
        { "id": "none",  "name": "No legs", "hide": [4], "price": -40 } ] }
  ]
}
```

Rules (`web/playground/config.js` `normalizeConfig`, the same code the
viewer renders with): ≤ 16 groups × 32 options; ids `[a-z0-9_-]{1,32}`
(slugged from the name when omitted); `variant` must name one of the
scene's variants; `materials` is `{dst: src}` glTF material indices
(`dst` draws as `src`); `hide` lists material indices the option blacks
out (the engine has no per-material hide lane yet — the IFC hidden mask
replaces this); `price` is a number ≥ 0 rounded to cents, `sku` ≤ 48
chars, `swatch` `#rrggbb`. Later groups win a material conflict.
**Nothing here bills**: the price total is a label.

#### GET /v1/scenes/<id>/config

Public, mirroring the scene's visibility (a private scene needs the
owner's auth or `?share=`; strangers get the same `404` as a missing
scene) → `{ "scene", "config", "updated" }`, `Cache-Control: no-store`.
`204 No Content` when the scene has no schema — the viewer probes this on
every streamed-scene open.

#### PUT /v1/scenes/<id>/config

```sh
curl -sS -X PUT https://HOST/v1/scenes/SCENE/config -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d @schema.json
# {"scene":"SCENE","config":{"version":1,"groups":[…]},"warnings":["option \"x\": unknown variant \"Teak\""]}
```

Owner-only (60/hour/IP). Body = the schema (or `{"config": <schema>}`);
`{"groups": []}` / `{"config": null}` clears it. The response carries the
canonical form (ids filled, defaults set) and `warnings` for anything
dropped. Fires the `config.changed` webhook. Errors: `400` nothing usable
(`errors` lists why) · `401` · `404` not the owner's scene · `413` over
64 KB.
### Media surfaces + spatial audio (2.7)

An owner puts a video on a surface and ambient sounds in the room
(`?author=1` → **Media**, [docs/guides/video-and-audio.md](guides/video-and-audio.md)).
The table lives in the scene's staging manifest (`<id>.stage.json`:
`media`, `audio`)
and follows the scene through versions; because that file is served
immutable, the viewer reads it through the no-store route below.

#### GET /v1/scenes/<id>/media

Public, mirroring the scene's visibility (a private scene needs the
owner's auth or a share token; strangers get a missing scene's `404`) →
`{ "scene", "media": [{ "material", "url", "loop", "emissive", "audio" }], "audio": [{ "pos", "url", "radius", "loop", "gain" }] }`,
`Cache-Control: no-store`. `204 No Content` when the scene has neither.

#### PUT /v1/scenes/<id>/media

```sh
curl -sS -X PUT https://HOST/v1/scenes/SCENE/media -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"media":[{"material":3,"url":"/ingest/SCENE.media/1.mp4","emissive":1.5,"audio":true}],
       "audio":[{"pos":[2,1.2,-1],"url":"/ingest/SCENE.media/2.mp3","radius":6,"gain":0.8}]}'
# {"scene":"SCENE","media":[...],"audio":[...]}   (normalized)
```

Owner-only; replaces the whole table (≤ 32 KB). `media`: at most **4**
surfaces (the renderer's media layers), each a distinct glTF `material`
index with a **same-origin** video `url` (`/ingest/<id>.media/<n>.mp4`
from the upload route, or any path on this host — cross-origin URLs are
refused: the frame is read back on the GPU and must not be tainted),
`loop` (default true), `emissive` glow 0–8 (default 1) and `audio`
(default false: play the video's own sound from the surface). `audio`:
at most **16** ambient emitters, `pos` `[x, y, z]`, same-origin `url`,
`radius` 0.5–200 m (linear rolloff to silence), `loop`, `gain` 0–2.
Errors: `400` validation (the message names the field) · `401` · `404`
not the owner's scene · `409` the scene has no staging manifest (a
classic GLB scene; media surfaces need a streamed scene).

#### POST /v1/scenes/<id>/media/upload

```sh
curl -sS -X POST https://HOST/v1/scenes/SCENE/media/upload -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: video/mp4" --data-binary @tv-loop.mp4
# {"path":"ingest/SCENE.media/1.mp4","url":"https://HOST/ingest/SCENE.media/1.mp4","bytes":4188212,"kind":"video","ext":"mp4"}
```

- **Body**: one raw media file, container-sniffed (the header's type is
  ignored): `mp4` (ISO BMFF; `M4A` brands count as audio) or `webm`
  (EBML; a video track makes it video) for **video, ≤ 200 MB**; `mp3`,
  `m4a`, `ogg`, `wav` or audio-only `webm` for **audio, ≤ 20 MB**. The cap
  is chosen from the sniff, so an over-cap body is refused as soon as it
  crosses its line.
- **Stored** as `ingest/<id>.media/<n>.<ext>` (`n` counts up per scene),
  served with the scene's visibility (a private scene's clip needs the
  owner's auth or `?share=`), Range-capable (so `<video>` seeks), deleted
  with the scene. Put the returned `path` (root-relative) in a surface's
  or emitter's `url`.
- **Errors**: `400` not a media file we serve · `401` / `404` as PUT ·
  `413` over the cap for its kind · `500`.

## Web games

Host an HTML5 game from a `.zip` and play it on its own origin, `play.ctruh.io`
([Host a web game](guides/host-a-web-game.md)). Owner routes need an account token.

| Route | Does |
| --- | --- |
| `POST /v1/games` | raw `.zip` body, `X-Verse-Name: <file name>`, optional `X-Verse-Title`; answers the game record (`id`, player and embed URLs, dropped-file count) |
| `POST /v1/ingest` with `X-Verse-Kind: game` | the same, through the upload road (also chosen when a zip has an `index.html` and scripts) |
| `POST /v1/games/<id>/replace` | a new build, same link |
| `PATCH /v1/games/<id>` | `{title, visibility, isolation, orientation}` |
| `PUT /v1/games/<id>/cover` | PNG, JPG or WebP up to 3 MB; `GET …/cover` (a Ctruh card when none) |
| `POST /v1/games/<id>/share` | a private share code |
| `DELETE /v1/games/<id>` | remove the game |
| `GET /v1/account/games` | the owner's library |

Limits come from the plan: zip size 100 MB Free, 500 MB Starter, 1 GB Pro, 2 GB Scale; three games on Free.
Zips are refused with a plain reason for more than 4,000 files, more than five times the plan size once
unpacked, symlinks, absolute or `..` paths, or a password.

## Embeds

Guide: [Embed anywhere](guides/embed-anywhere.md). Plug-ins: `integrations/embeds/` (WordPress, Shopify, Webflow). Product pages: [3D on product pages](guides/commerce.md), `integrations/commerce/` (WooCommerce, Magento, BigCommerce, Salesforce Commerce Cloud).

### oEmbed

`GET /oembed?url=<share link>&maxwidth=<px>&maxheight=<px>&format=json` (public, CORS `*`, rate-limited 1200/h per IP)

Answers for share links on this server's host and on `verse.ctruh.com` (more: `VERSE_OEMBED_HOSTS=a.example,b.example`).
A link is `/`, `/app`, `/view` or `/embed` with `vpk=`, `glb=`, `model=` or `scene=`;
look options on the link (`look`, `bg`, `env`, `variant`, `cfg`, `lights`, `view`,
`sky`, `weather`, `fog`, `ground`, `select`, `experience`, `tour`) and
`aspect=16:9|4:3|1:1|3:4|9:16|21:9`, `load=tap`, `analytics=0` carry into the embed.

```json
{
  "version": "1.0",
  "type": "rich",
  "provider_name": "Ctruh Verse",
  "provider_url": "https://verse.ctruh.com/",
  "title": "Palm villa",
  "html": "<div class=\"verse-embed\" style=\"position:relative;width:100%;max-width:640px;aspect-ratio:16/9;margin:0 auto\"><iframe src=\"https://verse.ctruh.com/embed?vpk=ingest/palm-villa-0a1b2c3d4e5f.vpk\" title=\"Palm villa — 3D view\" loading=\"lazy\" allow=\"fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; autoplay; clipboard-write\" allowfullscreen referrerpolicy=\"strict-origin-when-cross-origin\" style=\"…\"></iframe></div>",
  "width": 640,
  "height": 360,
  "cache_age": 3600,
  "thumbnail_url": "https://verse.ctruh.com/ingest/palm-villa-0a1b2c3d4e5f.poster.png",
  "thumbnail_width": 1200,
  "thumbnail_height": 630
}
```

- **Size.** `width` = `maxwidth` (default 640, at most 1920); `height` from the aspect
  ratio (16:9; Fidelity products 1:1; or the link's `aspect`), shrunk to `maxheight`.
  The `html` is responsive whatever the numbers: it fills its container up to `width`.
- **Title.** The scene's name from its id (`palm-villa-<12 hex>` → "Palm villa").
- **Thumbnail.** The owner's attached poster, else the auto poster (`<id>.poster.png`),
  with its real pixel size. Omitted when the scene has none.
- **Private scenes.** The link must carry a valid share token (`&share=<token>`), or the
  request the owner's auth. The `html` and `thumbnail_url` then carry the token, and the
  answer is `Cache-Control: private, no-store` with `cache_age: 0`. Without access the
  answer is exactly the unknown-scene answer: `404 {"error":"not found"}`, same headers.
- **Errors.** `400` no `url`; `404` not a Verse scene link, a foreign host, an unknown
  scene or a private one without access; `501` `format` other than `json`; `429` rate limit.

### Share-page tags

A share page that names a scene (`/?vpk=…`, `/view?glb=…`, `/app?…`) carries, right
after its `<title>`: `<link rel="alternate" type="application/json+oembed">` (oEmbed
discovery), Open Graph (`og:title`, `og:description`, `og:url`, `og:image` = the poster
or the site image, with `og:image:width/height`) and a Twitter `summary_large_image`
card. A private scene's page gets them only with a valid token (plus `robots: noindex`);
without one the page is the plain app page, the same as for an unknown scene.

### GET /embed

The lazy embed card that the oEmbed `html`, the plug-ins and Studio's embed code frame.
The same query as `embed.html` (`vpk` / `glb` / `model` / `scene`, look options,
`share`, `analytics=0`) plus:

| Parameter | Effect |
| --- | --- |
| `load=tap` | Load the 3D on tap only (also the default when the browser asks to save data) |
| `guard=0` | No scroll guard: the scene takes every gesture from the start (default: vertical swipes and the wheel scroll the host page until the visitor taps / clicks the scene) |
| `fs=0` | No fullscreen button (default: top-right; links out to `/view` where the frame cannot go fullscreen, as on iPhone) |
| `ar=0` | No "View in AR" control (default: shown where the device can place the scene — WebXR, or Quick Look on iOS) |

It is one small HTML page: the scene's poster and title inlined, no engine. When it
is 25 % visible (IntersectionObserver), or on tap, it replaces itself with
`embed.html` (the engine), keeping the poster behind the canvas until the first frame.
Headers: `Cross-Origin-Resource-Policy: cross-origin` and
`Cross-Origin-Embedder-Policy: require-corp` (on `/embed.html` too), so pages that are
themselves cross-origin isolated can frame it; no `X-Frame-Options`. A private scene
without a token gets the generic card (no title, no poster), identical to an unknown scene's.

## Review comments

Pinned comments in 3D space on a shared scene — the client-review
workflow. Access mirrors the scene: public and unlisted scenes are open to
anyone with the link; a private scene's comments need the owner's auth or
a share token (`?share=` / `X-Verse-Share`). Strangers see `404`.

Storage is a per-scene append-only JSONL under `ingest/.reviews/` (never
served, deleted with the scene).

### POST /v1/review/<sceneId>

No account required; 60/hour/IP.

```sh
curl -sS -X POST https://HOST/v1/review/docs-demo-718035483f84 -H "Content-Type: application/json" \
  -d '{"pos":[1.2,0.9,-0.4],"text":"Can we see this wall in the oak finish?","author":"Priya"}'
# {"id":"c76ae3e41a","t":1790833830642}
```

- **Body**: `{ pos: [x, y, z], text ≤ 500 chars (required), author? ≤ 40 }`. - **Errors**: `400` invalid shape · `404` no such scene, or private
  without access · `413` text over 500 chars or the scene already at
  **200** comments · `429`.

### GET /v1/review/<sceneId>

```sh
curl -sS https://HOST/v1/review/docs-demo-718035483f84
# {"scene":"docs-demo-718035483f84","comments":[{"id":"c76ae3e41a","t":1790833830642,
#   "pos":[1.2,0.9,-0.4],"text":"Can we see this wall in the oak finish?","author":"Priya","resolved":false}]}
```

Oldest first; resolved comments included. `404` for a private scene
without access.

### POST /v1/review/<sceneId>/<id>/resolve · DELETE /v1/review/<sceneId>/<id>

Owner-of-scene moderation (Bearer token or cookie).

```sh
curl -sS -X POST https://HOST/v1/review/docs-demo-718035483f84/c76ae3e41a/resolve -H "Authorization: Bearer <token>"
# {"id":"c76ae3e41a","resolved":true}
curl -sS -X DELETE https://HOST/v1/review/docs-demo-718035483f84/c76ae3e41a -H "Authorization: Bearer <token>"
# {"deleted":"c76ae3e41a"}
```

- **Errors**: `401` no account auth · `404` not the owner, or no such
  comment · `429` (shares the scene-management bucket).

`GET /v1/account/scenes` carries `reviews: { open, total }` per scene.
Guide: [Collect client review comments](guides/collect-review-comments.md).

## Publishing: experiences, tours, posters

No API key required; 30/hour/IP; account auth stamps an owner. All three
return `{ "path", "url" }` with a server-chosen random id.

### POST /v1/experience

```sh
curl -sS -X POST https://HOST/v1/experience -H "Content-Type: application/json" \
  -d '{"name":"Docs showroom","scene":"ingest/docs-demo-718035483f84.vpk",
       "hotspots":[{"id":"front","label":"Front","position":[0,1.2,3],"look":[0,0.5,0]}]}'
# {"path":"ingest/exp-38fd878a72.verse.json","url":"https://HOST/?experience=ingest/exp-38fd878a72.verse.json"}
```

- **Body**: a `.verse.json` manifest ([Experience manifests](experience-format.md)), max **128 KB**; `scene` (non-empty string) is required, everything else
  is validated by the runtime parser on load.
- **Errors**: `400` not JSON or `scene` missing · `500` could not store.
- With account auth the owner stamp also records the manifest's `scene`
  and `name`, which is what `GET /v1/scenes/<id>/experiences` lists.

### GET /v1/experience/<id> · PUT /v1/experience/<id> (2.7)

```sh
curl -sS https://HOST/v1/experience/exp-38fd878a72
# {"id":"exp-38fd878a72","path":"ingest/exp-38fd878a72.verse.json","experience":{...}}
curl -sS -X PUT https://HOST/v1/experience/exp-38fd878a72 -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d @manifest.json
# {"id":"exp-38fd878a72","path":"ingest/exp-38fd878a72.verse.json","url":"https://HOST/?experience=/v1/experience/exp-38fd878a72"}
```

- **GET** is public (mirrors the scene's visibility) and `no-store`: the
  static `ingest/exp-<id>.verse.json` copy is served immutable for a year,
  so anything that may have been edited — the Author bar, Studio, embeds —
  reads through here. `?experience=/v1/experience/<id>` is the share-link
  spelling the Author bar hands out.
- **PUT** is owner-only (`401` no auth, `404` not yours), same body rules
  as POST (`≤ 128 KB`, `scene` required), rewrites the manifest in place
  and refreshes the `scene`/`name` stamp.

### POST /v1/experience/<id>/media (2.7)

```sh
curl -sS -X POST https://HOST/v1/experience/exp-38fd878a72/media -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: audio/mpeg" --data-binary @kitchen.mp3
# {"path":"ingest/exp-38fd878a72-media-9a1b2c3d.mp3","url":"https://HOST/ingest/exp-38fd878a72-media-9a1b2c3d.mp3","bytes":381204}
```

- **Body**: a raw narration clip, max **2 MB**, container-sniffed — `mp3`
  (ID3 / frame sync), `m4a` (`ftyp`), `ogg`, `wav` (RIFF/WAVE) or `webm`
  (EBML); the stored extension follows the sniff, never the header. Put
  the returned `path` (root-relative) in a tour step's `audio`.
- **Errors**: `400` not an audio clip · `401` / `404` as PUT · `413` over
  2 MB · `500`. Clips are bounded as a set (`VERSE_MAX_MEDIA`, default
  2000 kept) like posters and tours.

### POST /v1/tour

```sh
curl -sS -X POST https://HOST/v1/tour -H "Content-Type: application/json" \
  -d '{"name":"docs tour","scene":"ingest/docs-demo-718035483f84.vpk",
       "samples":[[0,0,1.6,3,0,0,-1],[4,3,1.6,0,-1,0,0]]}'
# {"path":"ingest/tour-488fd5fe4b.tour.json","url":"https://HOST/?tour=ingest/tour-488fd5fe4b.tour.json"}
```

- **Body**: `{ name?, scene, samples }`, max **512 KB**; `samples` is
  2–6000 rows of `[t, x, y, z, fx, fy, fz]` (finite numbers); `name`
  truncated to 120 chars. The viewer lerps between rows and loops.
- **Errors**: `400` invalid shape (the body says what) · `500`.

### POST /v1/poster

```sh
curl -sS -X POST https://HOST/v1/poster -H "Content-Type: image/png" --data-binary @poster.png
# {"path":"ingest/poster-748cf2228b.png","url":"https://HOST/ingest/poster-748cf2228b.png"}
```

- **Body**: raw PNG, max **4 MB**, magic-checked. With account auth,
  `X-Verse-Scene: <owned scene id>` attaches it as that scene's dashboard
  thumbnail; `?scene=<id>` (used by the viewer's automatic first-visit
  capture) stores it idempotently as `ingest/<id>.poster.png`.
- **Errors**: `400` not a PNG · `500`.

## Presence rooms

Live-tour presence: a room is a named set of viewers who see each other's
camera pose. HTTP only (SSE out, tiny POSTs in); poses are **memory-only, 10 s TTL** — nothing is recorded and a restart empties every room.
`<room>` is 1–64 chars of `[A-Za-z0-9_-]`; treat room ids as capability
URLs.

### GET /v1/room/<room>/events

`text/event-stream`, `Access-Control-Allow-Origin: *`. The roster arrives
on connect and then on change, coalesced to ≤ ~10 frames/s:

```
data: {"peers":[{"id":"docs-viewer-1","name":"Docs","color":"#78aaff","pose":[0,1.6,3,0,0,-1],"flags":{}}]}
```

**2.7 (voice + presenter):** open the stream as `?id=<your peer id>` and
it is *tagged* — signals addressed to that id arrive on it as named
events. The first frame on a tagged or untagged stream is the config:

```
event: config
data: {"ice":[{"urls":["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302"]}],"mesh":6}

event: signal
data: {"from":"docs-viewer-2","to":"docs-viewer-1","kind":"offer","data":{"type":"offer","sdp":"..."},"t":1760000000000}
```

`ice` is the STUN list from `VERSE_STUN` (comma-separated `stun:` URLs;
`none` → `[]`); `mesh` is the voice mesh cap (6 talkers per room). Each
peer's `flags` object carries whichever of `presenter`, `hand`, `muted`,
`voice`, `ptt`, `host` (the live tour's host) are set and the
presenter's `laser` point `[x, y, z]`. The stream carries a comment line
(`: hb <ms>`) every 5 s as a heartbeat: a client that sees 15 s of
silence should reopen it.
Older clients that ignore named events keep working unchanged.

### POST /v1/room/<room>/pose

```sh
curl -sS -X POST https://HOST/v1/room/docs-room/pose -H "Content-Type: application/json" \
  -d '{"id":"docs-viewer-1","name":"Docs","color":"#78aaff","pose":[0,1.6,3,0,0,-1]}'
# HTTP/1.1 204 No Content
```

- **Body** ≤ 2 KB: `id` 4–32 chars `[A-Za-z0-9_-]` (client-invented),
  `name` ≤ 24, `color` `#rrggbb`, `pose` up to 6 numbers, optional
  `flags` `{presenter?, hand?, muted?, voice?, ptt?, host?, laser?: [x, y, z]}`
  (2.7; booleans are kept only when true, anything else is dropped).
  Post at ~8 Hz; peers expire after 10 s of silence.
- **Errors**: `400` bad id or room full (32 peers).

### POST /v1/room/<room>/signal

Relay for voice signalling and presenter events (2.7). The server
forwards the body **verbatim and at once** to the SSE stream(s) opened
with `?id=<to>` — or, for `to: "*"`, to every tagged stream in the room
except the sender's — and keeps nothing. No audio ever passes through
here: voice is WebRTC peer-to-peer and only the SDP / ICE text is
relayed.

```sh
curl -sS -X POST https://HOST/v1/room/docs-room/signal -H "Content-Type: application/json" \
  -d '{"from":"docs-viewer-2","to":"docs-viewer-1","kind":"offer","data":{"type":"offer","sdp":"..."}}'
# HTTP/1.1 204 No Content
# X-Verse-Delivered: 1
```

- **Body** ≤ 16 KB: `from` and `to` peer ids (4–32 chars `[A-Za-z0-9_-]`;
  `to` may be `"*"`), `kind` one of `offer` `answer` `ice` `bye` `mute`
  (voice), `present` `action` `laser` `hand` `handover` (presenter), `chat`,
  `ping` `end` (live tour, below); `data` any JSON.
- **Reply**: `204` with `X-Verse-Delivered: <n>` — the number of streams
  the frame was written to (`0` = that peer is not listening; nothing is
  queued).
- **Errors**: `400` bad id / kind, `413` over 16 KB, `429` over 400
  signals per second per room (ICE bursts are ~30 per peer), `429`
  `too many rooms`.
- **Presenter event schema** (`kind: "action"`, `to: "*"`), applied by
  followers through the same setters the UI uses:
  `{name: "tour", detail: {playing}}` · `{name: "hotspot", detail: {id}}` ·
  `{name: "variant", detail: {name}}` · `{name: "lights", detail: {query}}`
  (a `?lights=` string) · `{name: "clip", detail: {encoded}}` (a `?clip=`
  string; the embed may send `{planes: [[nx,ny,nz,d]…], cap}` instead) ·
  `{name: "style", detail: {name}}` (the restyle agent's `?style=` look).
  `present {on}` announces / gives up the floor, `handover {}` (addressed)
  makes the recipient present, `hand {}` is a raised hand, `mute {muted}`
  mirrors the roster flag so a mute shows before the next pose post.
- **Privacy**: the room id is the capability, exactly as for the roster.
  There is no TURN relay: two peers that both sit behind symmetric NAT
  never connect and the viewer says so ("no audio with …") rather than
  failing silently.

### Tour together, live

An agent's one tap mints a **short invite link**; a buyer opens it on any
phone (WhatsApp / Instagram in-app browsers included) and lands in the
agent's room as a guest who follows the host's camera. Three routes on
top of the presence room, all **memory only** — an invite is
`{scene, room, created, expires}`, no account, no name, no address; the
room name is the capability and the code only shortens it. Guide:
[Tour together](guides/tour-together.md).

#### POST /v1/tour/invite

```sh
curl -sS -X POST https://HOST/v1/tour/invite -H "Content-Type: application/json" \
  -d '{"scene":"ingest/5f2c…e1.vpk"}'
# {"code":"k7m2xq4","url":"https://HOST/t/k7m2xq4","room":"tour-m8w3q2vk7p","scene":"ingest/5f2c…e1.vpk",
#  "expiresAt":1760100000000,"landing":"/view?vpk=ingest%2F5f2c…e1.vpk&room=tour-m8w3q2vk7p&live=1"}
```

- **Body** ≤ 2 KB: `scene` — a published scene path
  (`ingest/<id>.vpk|.vsp|.classic.glb|.fidelity.glb`; a bare
  `<id>.vpk` is normalised to `ingest/`), optional `room` (1–64 chars of
  `[A-Za-z0-9_-]`; omitted → a fresh `tour-<10 random>` nobody guesses).
- **Reply**: `code` (7 chars, no 0/o/1/l/i), the absolute `url`
  (`/t/<code>` on the request's origin — `X-Forwarded-Proto/Host` are
  honoured), `room`, `scene`, `expiresAt` (ms; `VERSE_TOUR_INVITE_TTL_H`,
  default 24 h) and the `landing` path. `Cache-Control: no-store`.
- **Errors**: `400` not an ingest scene / bad room / torn body; `429`
  over `VERSE_TOUR_INVITES_PER_HOUR` (default 60) per address per hour
  (loopback exempt in development).
- The table holds 5 000 invites; past that the oldest tenth is dropped.

#### GET /v1/tour/invite/<code>

`{code, room, scene, expiresAt, landing}` for a live invite, `404` for an
unknown or expired code. `no-store`.

#### GET /t/<code>

The link people open. `302` to
`/view?vpk=<scene>&room=<room>&live=1` (`no-store`); an unknown or
expired code answers a small `404` HTML page ("This tour link has
expired"). `live=1` makes the viewer join as a **guest**: the Enter gate
on phones, then the optional name chip, then following the host.
`?room=<room>&host=1` hosts a room at once; a plain `?room=` is the 2.7
viewer with the tour bar.

#### POST /v1/room/<room>/leave

```sh
curl -sS -X POST https://HOST/v1/room/docs-room/leave -H "Content-Type: application/json" -d '{"id":"docs-viewer-1"}'
# HTTP/1.1 204 No Content
```

A page that closes says so (the viewer sends it with `sendBeacon` on
`pagehide`), and the peer is dropped from the roster and rebroadcast at
once instead of lingering for the 10 s TTL — the guests' "the agent left"
chip must not wait on a sweep. Body ≤ 256 B, `{id}` (4–32 chars
`[A-Za-z0-9_-]`); `400` bad id. Optional: a client that never sends it
(the embed's own room join, older viewers) is swept after 10 s as before.

#### Live-tour signals and flags

- `flags.host` on the pose record marks the tour's host (the host also
  carries `presenter`: guests follow the presenter mechanics).
- `kind: "ping"`, `to: "*"`, `data: {pos: [x, y, z], name}` — "look here":
  every screen draws a pulsing ring at that world point for a few seconds.
- `kind: "end"`, `to: "*"`, `data: {by}` — the host ended the tour;
  guests release their cameras.
- `kind: "handover"` (addressed) makes the recipient the host as well as
  the presenter.
- Guests count in analytics as one `act: "livetour"` row per session
  (`liveTours` / `live_tour_sessions` in the scene report).

## Signing

### GET /v1/pubkey

The deployment's Ed25519 public key. No auth; `Cache-Control: public,
max-age=300`.

```sh
curl -sS https://HOST/v1/pubkey
# {"alg":"Ed25519","spki":"MCowBQYDK2VwAyEABHN2qIj3nOB4cvTPeA0erREzZQC1G4kpkunME6GA0B8="}
```

`spki` is base64 SubjectPublicKeyInfo DER, importable as-is with
`crypto.subtle.importKey("spki", der, { name: "Ed25519" }, false, ["verify"])`.
The viewer fetches it from the **host page's origin** — the page embedding
a scene is the trust anchor — and reports `signed: true | false |
"unverified"`. It must be identical across deploys; a changed `spki` means
the key was not persisted and earlier scenes now read `signed: false`
(they still load).

## Operations

Two more operations routes are not a developer surface: `GET /v1/status`
feeds the public status page, and `GET /v1/ops/errors` is the
operator-only error ring.

### GET /v1/health/deep

No auth, rate-limited, cheap by contract (in-memory counters plus a
touch/unlink probe on the volume — never a compile). `200` when every check
passes, `503` otherwise.

```sh
curl -sS https://HOST/v1/health/deep
```

```json
{
  "ok": true,
  "version": "4.0.0",
  "checks": {
    "volumeWritable": true,
    "compilerPresent": true,
    "signingKey": true,
    "disk": { "freeMB": 491739, "totalMB": 948534, "usedPct": 48 },
    "lastIngest": { "t": 1790833829990, "ok": true },
    "ingestLastHour": { "attempts": 18, "done": 16, "failed": 2 },
    "telemetryWritable": true
  }
}
```

`disk.ok` turns false below 512 MB free; `lastIngest` is `null` before the
first upload and carries `error` on a failure. A server storing scenes in a
bucket (`VERSE_STORAGE=s3`) adds `storage: { backend: "s3", bucket,
reachable }`, and an unreachable bucket fails the check.

### GET /v1/ops/ingest-stats

Account auth required (any valid account); `401` otherwise. The last 24 h
from the persisted ring of the last 200 ingest outcomes
(`ingest/.ingest-log.jsonl`), plus the client-side failure beacons:

```sh
curl -sS https://HOST/v1/ops/ingest-stats -H "Authorization: Bearer <token>"
```

```json
{
  "last24h": { "attempts": 68, "done": 61, "failed": 7, "byReason": { "failed": 7, "evicted": 46 }, "p50s": 5, "p95s": 19 },
  "recent": [ { "t": 1790831611415, "idHash": "ace65061d8ab", "sizeMB": 77.32, "outcome": "done", "seconds": 613 } ],
  "telemetry24h": { "canaryFails": 0, "uploadFails": 1, "loadErrors": 0, "lastCanaryFail": null,
                    "lastUploadFail": { "t": 1790832030821, "detail": "HTTP 400: …", "phase": "upload" } }
}
```

Rows also carry `attempts`, `healed`, `repaired` (verification repairs),
`fallback` and the taxonomy `code` when they apply.
Outcomes: `done` · `safe-mode-used` (landed only on a lighter rung of the
self-healing ladder — the early warning before hard OOMs) ·
`classic-fallback` (delivered through the lossless fallback) · `timeout` ·
`oom` · `failed` (application error: bad input, ENOSPC…) · `storage-full`
(`507` at preflight) · `evicted` (disk-budget reclaim; not an attempt).
Scene ids are hashed. Guide: [Monitor production](guides/monitor-production.md).

### GET /v1/ops/leads

The contacts uploaders attached (name, phone, email, job, whether the email
went out), newest first, max 500. This is personal data, so it is gated
harder than `ingest-stats`: `Authorization: Bearer <VERSE_ADMIN_TOKEN>`, or
an account whose id is listed in `VERSE_OPS_ACCOUNTS` (comma-separated).
`401` without auth, `403` for any other account.

```sh
curl -sS https://HOST/v1/ops/leads -H "Authorization: Bearer $VERSE_ADMIN_TOKEN"
# {"count":1,"emailConfigured":true,"slackConfigured":true,
#  "leads":[{"job":"villa-3b0cc31202bd","name":"Asha Rao","email":"asha@example.com","phone":"+919876543210",
#            "consent":true,"at":1790873084372,"emailed":true,"emailKind":"live","status":"done","url":"https://HOST/?vpk=ingest/villa-3b0cc31202bd.vpk"}]}
```

### GET /v1/status

Public, rate-limited with the health bucket: the JSON behind the
[status page](/status) — health, the self-canary's last 24 h and a
client-error count. No customer data.

### GET /v1/ops/errors

Account auth (any valid account), as `/v1/ops/ingest-stats`: the operator
dashboard's grouped errors `{ groups, status }` — client beacons, failed
ingests, server crashes. Samples can name scenes, hence the auth.

### GET /v1/config

Public client knobs, read once per page by the viewer: `{ "cdnBase": "",
"interior": "ingest/<id>.vpk" | null, "version": "4.0.0" }` — `cdnBase` is
the CDN origin the client should range public scenes against, or empty for
"everything on this origin"; `interior` is the deployment's public show
flat when it has one (the guided tour uses it to teach Walk and the floor
plan); `version` is the release this server runs (also in
`/v1/health/deep`).

## Floor plan to 3D home

Turn a brochure floor plan into a furnished, walkable scene. Guide:
[Floor plan to 3D home](guides/floor-plan-to-3d.md). Both POSTs go through
the same gates as `POST /v1/ingest`: the per-account/per-IP rate bucket, the
key pre-check before the body, and the key and daily quota after it. A build
counts as an upload of the generated GLB.

**Privacy:** the image goes to the Anthropic API only when the server has
`ANTHROPIC_API_KEY` set. Without it, only the built-in plan reader runs, and
nothing leaves the server.

### GET /v1/plan2home/status

`200 { "enabled": true, "ai": false, "model": "claude-sonnet-5-5", "styles": [{ "id": "modern-indian", "label": "Modern Indian", "blurb": "…" }, …], "defaultStyle": "modern-indian", "maxImageBytes": 25165824 }`.
`ai` is true when the AI reader is on.

### POST /v1/plan2home/analyze

- **Body:** the raw image (PNG, JPEG, WebP or PDF), at most 24 MB. For a
  PDF, the first JPEG page image is read.
- **`X-Verse-Hints`** (optional): JSON, plain or URI-encoded. All fields are
  optional:
  - `areaSqft` or `areaSqm`, with `areaKind` set to `carpet` (the default),
    `builtup` or `super`;
  - `widthM`, the outside width in metres (beats the area);
  - `bhk`, `style`, `city` and `name`.
- **200:** `{ plan, stats, svg, ai: { used, model?, error?, tries? }, repair, validation, frame, timings }`.
  - `plan` is the plan document. It is in metres, with x to the right and y
    down, and holds `walls`, `openings` and `rooms` (`id`, `name`, `type`,
    `rects`, `area`, `center`). Each opening has `kind`, `at`, `width`,
    `dir`, `rooms`, `entrance` and `added`:
    - `kind` is `door`, `window` or `open`. An open gap is an archway or a
      kitchen open to the living room: no leaf, and you walk through it.
    - `added: true` marks a door the reader put in because the drawing
      didn't show one.
  - `repair` is `{ added, entrance, unreachable }`:
    - `added` is how many doors were added;
    - `entrance` is `"moved"` or `"added"` when the entrance was put
      right, else `null`;
    - `unreachable` lists the rooms that no legal door can reach (never
      through a bathroom, never in an outside wall). Normally it is empty.
  - `validation` is `{ ok, problems: [{ code, message, rooms? }] }`: what
    still looks off after the readers and the repair. `code` is
    `unreachable`, `overlapping_openings`, `overlapping_rooms`, `tiny_room`
    (under 1.5 m² and not a toilet, store, utility or pooja),
    `area_mismatch` (the rooms' total more than 15 % off the printed total
    or the `areaSqft` / `areaSqm` hint; 25 % against a built-up or super
    area) or `room_area_mismatch` (a room more than 25 % off its printed
    area or dimensions). Check rooms lists them; the build does not refuse
    them (only unreachable rooms do).
  - `ai.tries` (only when the plan was read more than once) lists each
    reading: `{ model, problems? | error? }`. A reading that fails
    validation is read again by a stronger model (see
    `VERSE_PLAN_ESCALATE`), and the reading with the fewest problems wins.
  - `frame` is `{ imageW, imageH, pxPerM, origin, deskew? }`: image pixel
    = (plan metres + `origin`) × `pxPerM`, before the `deskew` rotation
    (radians, about the image centre) is undone. Use it to draw the plan
    over the upload.
  - `stats` gives the rooms by type, the carpet area and the BHK.
  - `svg` is the plan drawn for display.
  - `ai.error` is set when the AI reader was on but failed. In that case the
    built-in reader's plan is returned.
- **Errors:**
  - 413: over the size limit.
  - 415: not a PNG, JPEG, WebP or PDF.
  - 422: no plan could be read, or the image is not a floor plan (a photo
    of a room, a render). The `error` field says why, in words meant for
    the user.
  - 503: two plans are already being read; retry after `Retry-After`.

### POST /v1/plan2home/build

- **Body** (JSON, ≤ 1 MB): `{ "plan": <plan from analyze, edited>, "style": "modern-indian" | "scandinavian" | "luxury" | "minimal", "name": "Sunrise 2BHK" }`.
- **What it does:** generates the furnished GLB. Before publishing, it walks
  the home from the entrance on a 10 cm grid.
- **202:** `{ job, id, statusUrl, experienceUrl, checks, stats }`.
  - Follow `statusUrl` (`GET /v1/ingest/<job>`) exactly as for an upload.
  - When the job is done, `<id>.stage.json` holds the spawn at the
    living-room entrance, with a walk view. `ingest/exp-<hex>.verse.json`
    holds one hotspot per room and a guided tour, and it is the scene's
    default experience when an account owns the scene.
  - `experienceUrl` opens the scene with the room hotspots.
- **Errors:**
  - 400: the plan is malformed.
  - 422 `{ "code": "unreachable_rooms", "unreachable": [{ "id", "name" }] }`:
    a room cannot be reached from the entrance (usually a missing door).
    Nothing is published. The plan is built exactly as sent, so the build
    adds no doors. Add one in the plan (Check rooms: **Edit doors**), or
    send the plan that `analyze` returned, which is already repaired.
  - 503 `server_busy`: the compile queue is full.

## Assistant

The endpoint behind **Ask Verse**, the site assistant. Guide: [Ask Verse](guides/ask-verse.md).
It has no server-side side effects and no access to accounts, tokens,
scenes or files: it returns text plus UI actions from a fixed whitelist,
which the page validates again and runs itself.

### POST /v1/assist

- **Body** (JSON, ≤ 48 KB): `{ "messages": [{ "role": "user" | "assistant", "content": "…" }], "context": { "surface": "landing" | "app" | "studio" | "docs", "path": "/app", "sceneLoaded": true } }`.
  The first and last message must be from the user. At most **20 messages**, **1,000 characters** in the newest one.
- **Response**: `200 text/event-stream`. Each `data:` line is one JSON event:

```
data: {"type":"text","delta":"Opening the upload panel."}
data: {"type":"action","action":{"type":"open_upload"}}
data: {"type":"done","mode":"ai"}
```

`text` events are appended in order; `action` events arrive after the
text; `done` carries the mode that answered (`ai` or `basic`); an `error`
event means the reply was cut short and no action should run.

- **Actions** (the whole list): `navigate {path}` (only `/`, `/app`, `/studio`, `/docs/` and product-page sections), `open_upload`, `load_demo {name}`, `start_tour {surface, chapter?}`, `set_view {mode}` (`walk`, `orbit`, `tour`, `stop_tour`, `minimap`, `measure`), `export_video`, `open_review`, `share_link`, `open_docs {page, section?}` (public docs pages only), `show_limits {limits}`. At most **3** per reply.
- **Errors** carry `{ "error": "…", "message": "…" }`, where `message` is written for the visitor: `400` (malformed or too long), `403` (cross-site request), `429` (per-IP bucket), `503` (daily cap reached, busy, or unavailable).

```bash
curl -N -X POST "$VERSE/v1/assist" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"how big can my file be?"}],"context":{"surface":"landing"}}'
```

### GET /v1/assist/status

`{ "mode": "ai" }` when the server has `ANTHROPIC_API_KEY` set,
`{ "mode": "basic" }` otherwise (a deterministic local responder: curated
intents plus a search over the public docs headings).

### POST /v1/telemetry

Client telemetry sink. Body ≤ **1 MB**, one batch per POST → one line of
`ingest/.telemetry.jsonl` (rotated at ~32 MB, one rotation kept), forwarded
as ndjson when `VERSE_TELEMETRY_URL` is set. Always `204`.

Failure-beacon rows — the only record of failures the app never saw —
carry a top-level `kind`:

| `kind` | Sent by | When | Fields |
| --- | --- | --- | --- |
| `upload-fail` | the playground | an upload failed client-side: HTTP error, network error, or the job polled to `error` | `detail` (`HTTP <status>: <message>`), `phase` (`upload` = the POST itself failed, incl. edge failures; `compile` = server-side) |
| `load-error` | the playground | a share link failed to load in the viewer | `detail`, `phase: "load"` |
| `canary-fail` | the external hourly canary | its end-to-end upload probe failed | `detail` |
| `look` | the viewer (2.5.0) | every 2 s while a scene is live and visible (batched, one POST per ~10 s) | `pos` `[x,y,z]`, `yaw` (degrees), `streaming`, `stalled`, `walking`, `scene`, `session`, `vid`, `t` — folded by `GET /v1/scenes/<id>/heatmap` and `/analytics` |
| `view` | the viewer | once per scene per page | `dev` (`phone`/`tablet`/`desktop`), `os`, `app` (in-app browser or `none`), `via` (`direct`/`share`/`embed`), `ref` (referring site's class: `whatsapp`, `instagram`, `facebook`, `linkedin`, `twitter`, `youtube`, `google`, `search`, `email`, `other`, `none`), `scene`, `session`, `vid`, `t` |
| `act` | the viewer | first input on the scene; enquiry clicks; hotspot opens and card links; Ask Verse questions | `act`: `interact`, `enquiry`, `hotspot`, `link` or `question`; `target` (the hotspot id) on `hotspot` / `link` |
| `batch` | the viewer | wraps up to 60 of the rows above | `rows: [...]`; stored as one line per row |

`view`, `look`, `act` and `batch` rows have their own rate bucket and are
rebuilt from a whitelist before they are stored (see [Analytics](#analytics)).

Schema: [Telemetry](telemetry.md).

## Compile fleet: /v1/work/*

Pull API for external compile workers (`tools/verse-worker`). **Every route requires `Authorization: Bearer $VERSE_WORKER_TOKEN`**; while the variable
is unset the routes answer `404`, a wrong token `401`. Jobs unclaimed for
10 s, or claimed but silent for 20 min, fall back to the origin's local
compiler, so zero workers is exactly the single-box behaviour.

| Route | What |
| --- | --- |
| `GET /v1/work/claim` | Claim the oldest unclaimed job. `204` = nothing to do; `200` = `{ "id", "images": bool, "source": "/v1/work/<id>/source" }`. `X-Verse-Worker: <name>` is credited as `workedBy`. |
| `GET /v1/work/<id>/source` | The uploaded GLB bytes. |
| `GET /v1/work/<id>/images` | The KTX2 RGBA sidecar for `--images`, or `404`. |
| `POST /v1/work/<id>/stage` | `{ "stage": "<a-z->" }` progress shown live to the uploader; `204`. `"worker-failed"` hands the job back to the origin immediately. |
| `POST /v1/work/<id>/result` | The finished `.vpk` bytes; stats in `X-Verse-Tris` / `X-Verse-Clusters`. `204`; `410` = the job already finished elsewhere. |

The origin signs delivered files itself; workers never hold the key. Splat
jobs are never offered to the fleet.

**Fleet bake.** A worker that sends `X-Verse-Caps: bake` on its
claims is counted for "Bake for me" splits (seen in the last 15 s) and is
offered bake parts before compile jobs; workers without the header never
see them. A bake is split into 1 + (such workers), at most 8, parts
(`VERSE_BAKE_PARTS` on the origin forces a count); part 0 runs on the
origin. A bake-part claim answers:

```json
{ "id": "villa-9f3a01b2c4d5~bake2", "kind": "bake-part", "quality": "final",
  "part": 2, "parts": 3, "deadlineS": 1041, "source": "/v1/work/villa-9f3a01b2c4d5~bake2/source" }
```

The worker downloads `source` (the prepared GLB the origin is baking),
runs `verse-compile --bake <quality> in.glb --part <part>/<parts>
--deadline-s <deadlineS> -o part.vbp`, heartbeats `POST …/stage`
(`{"stage":"baking"}`), and posts the part file to `POST …/result`
(`204`; `410`/`404` = the bake already finished without it). The origin
drops it into its coordinator's part directory; a part with a different
plan fingerprint is ignored, and a part that does not arrive in time is
baked on the origin — a slow or vanished worker costs time, never the
bake. `deadlineS` is what is left of the origin's own deadline.

## JS SDK

**`@ctruhtech/verse-sdk`** (since 2.6.0; 4.0.0 today) is the typed, dependency-free client for every
route on this page — upload (one-shot and resumable, progress, cancel),
job polling with stage callbacks, scenes, share tokens, versions and
diffs, review comments, heatmap, publishing, presence, operations, and
`embedViewer()` over the embed SDK. ESM + CJS + full typings; Node 18+
and browsers. Full reference with a runnable example per method:
[docs/sdk.md](sdk.md). Served without a package manager at
`/sdk/verse-sdk.js` (same headers as `embed.js`):

```js
import { VerseClient } from "https://HOST/sdk/verse-sdk.js"; // or the package, once it is on npm
const verse = new VerseClient({ baseUrl: "https://HOST", token: "<account token>" });
const done = await verse.publish(bytes, { name: "chair", onStage: (s) => console.log(s) });
console.log(verse.shareLink(done));
```

The route table behind this page, the Postman collection and the SDK is
`scripts/api-routes.mjs`; `scripts/api-parity.mjs` fails when any of the
three drifts from the server's dispatch.

**4.0 developer kit:** the `<verse-viewer>` element, React and Vue
wrappers, `analytics.*`, `embedCode()`, `scenes.shares.link()`,
`webhooks.test()` and `verifyWebhook()` — one page of copy-paste
examples in [developers.md](developers.md).

The original single-file `verse-sdk.js` (v0: `VerseClient({ endpoint,
apiKey })`, `ingest()`, `mount()`) stays served at `/verse-sdk.js` for
existing pages; new code should use `@ctruhtech/verse-sdk`.

## Embed SDK

One script, `embed.js`, mounts the engine in an iframe from the Verse
origin — full reference in [embed-sdk.md](embed-sdk.md), guide in
[Embed the viewer](guides/embed-the-viewer.md). What ships in embeds versus
the playground:

### Playground ↔ embed parity

| Feature | Playground | Embed SDK | Notes |
| --- | --- | --- | --- |
| Streamed `.vpk` / `.vsp` / GLB / splat loading | ✔ | ✔ | same engine, same routes (same-origin only) |
| Orbit / pinch / wheel camera | ✔ | ✔ | shared `camera-controls.js` |
| Walk mode + analog move | ✔ | ✔ `walk()` / `move()` | no on-screen joystick in embeds; feed `move()` from your UI |
| Animations, picking, materials, sun, exposure, DoF, emitters, props, sounds, rooms, tours, experiences | ✔ | ✔ | see [embed-sdk.md](embed-sdk.md) |
| Voice + presenter mode (2.7) | ✔ viewers panel | ✔ `joinRoom(id, { voice })`, `present()`, `setVoice()`, `room` / `peer` / `speaking` events | same `voice.js` / `presenter.js` inside the iframe; the follower veil renders in-frame |
| Video export | ✔ chip + `__verseExportVideo` | ✔ `exportVideo()` / `cancelExport()` | embeds hand the bytes to the host page instead of auto-downloading — [guide](guides/export-video.md) |
| Review pins | ✔ Review chip | ✔ opt-in `review: true`, `setReviewMode()` / `getComments()` | same `review.js` inside the iframe; owner moderation stays playground/studio-only |
| Private scenes | ✔ `?share=` | ✔ `share` option | the token covers bytes and review calls |
| HDR display output | ✔ `?hdr=auto` default | opt-in `hdr: "auto" \| 1` (default SDR) | embeds never shift a host page's colours uninvited |
| On-demand rendering | opt-in `?render=demand` (default on battery) | ✔ default | embeds park when nothing changes |
| Upload / ingest UI | ✔ | ✘ | use `verse-sdk.js` from your own page |
| Stats HUD / inspector / editor / minimap | ✔ | ✘ | playground chrome; embeds expose `progress` events instead |

### Video export in embeds

`viewer.exportVideo({ duration, fps, height, format, bitrate })` records
the scene's tour inside the iframe and resolves `{ blob, mimeType, name,
width, height, frames, cancelled }`; `export-progress` events stream
meanwhile; `cancelExport()` resolves `{ cancelled: true }`. Message
protocol for non-SDK hosts: `verse:export-video` down,
`verse:event {name:"export-progress"}` up, `verse:export-video-done` with
the transferred `ArrayBuffer` (or `{ id, error }`),
`verse:export-video-cancel`. Details and a copy-paste page:
[Export a flythrough video](guides/export-video.md).

## Exporters

All three speak this API — `POST /v1/ingest` (resumable above 100 MB where
implemented) → poll → hand the user `url` — and all three honour the error
contract (verbatim app errors, one retry on edge failures only, 30-minute
budget).

- **Blender** — `integrations/blender/verse_publish`, the **Verse Publish**
  extension (Blender 4.2+, stdlib-only): N-panel "Verse" tab, export →
  upload → live link with progress, cancel, copy/open. Machine-tested end
  to end (`web/test/fix-verify-blender.mjs`). Guide:
  [Publish from Blender](guides/publish-from-blender.md).
- **Unity** — `integrations/unity/com.ctruh.verse-publish`, a UPM
  package (Unity 2021.3+, glTFast): **Tools ▸ Verse ▸ Publish Scene** window. The
  protocol layer is UnityEngine-free C#, replayed live by
  `web/test/fix-verify-unity.mjs`; verified in Unity 6000.6 on URP
  (Boat Attack) and HDRP scenes ([smoke test](exporter-smoke-tests.md)). Guide:
  [Publish from Unity](guides/publish-from-unity.md).
- **Unreal** — `integrations/unreal/VersePublish`, an editor
  plugin (UE 5.3+): **Tools ▸ Verse ▸ Publish to Verse**. HTTP protocol
  verified by `integrations/unreal/protocol-reference.mjs` +
  `web/test/fix-verify-unreal.mjs`; compiled and clicked through in
  Unreal Engine 5.8.3 by the editor automation test that ships with it
  ([smoke test](exporter-smoke-tests.md)). Guide:
  [Publish from Unreal](guides/publish-from-unreal.md).

The original single-file `tools/verselink-*` references remain as minimal
protocol examples.

## Changelog

Moved to its own page: [API changelog](api-changelog.md) — every entry
since v1, newest first.
