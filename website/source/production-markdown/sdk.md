# @ctruhtech/verse-sdk — JavaScript / TypeScript client

The typed, dependency-free client for everything in the
[API reference](api.md): upload a model (one-shot or resumable, with
progress and cancel), follow the compile with stage callbacks, own, share,
version, review and measure the scene, and mount the viewer on your page.
Works in Node 18+ and every modern browser; ESM and CommonJS; full
TypeScript typings; nothing but `fetch`.

```
sdk/                      the package (source, tests, examples)
  src/index.ts            one file — the whole client
  src/embed-types.d.ts    copied from web/playground/verse-embed.d.ts at build
  dist/esm, dist/cjs      `npm run build` (plain tsc, no bundler)
  examples/               Node CLI, HTML embed page, GitHub Actions
web/playground/sdk/       the served copy: /sdk/verse-sdk.js (+ .d.ts)
```

## Install

From npm (when published) or straight from the repo:

```sh
npm install @ctruhtech/verse-sdk          # ESM + CJS + types
# or, in this repository:
cd sdk && npm install && npm run build
```

```js
import { VerseClient } from "@ctruhtech/verse-sdk";              // ESM / TypeScript
// CommonJS: const { VerseClient } = require("@ctruhtech/verse-sdk");
```

Or with no package manager at all — the Verse origin serves the ESM build
exactly like `embed.js`, with the same `Cache-Control: no-cache` + ETag
headers (the browser revalidates; a deploy is picked up on the next load):

```html
<script type="module">
  import { VerseClient } from "/sdk/verse-sdk.js";   // a page on the Verse origin
</script>
```

Typings for that copy: `https://HOST/sdk/verse-sdk.d.ts` (+ `embed-types.d.ts`).

> **Where the browser build runs.** Since 4.0 `/sdk/verse-sdk.js` (like
> `embed.js` and `/sdk/verse-viewer.js`) is served with
> `Access-Control-Allow-Origin: *` and `Cross-Origin-Resource-Policy:
> cross-origin`, so a page on *another* origin can `import` it. The API
> itself sends no CORS headers on `/v1/*` — a server policy the SDK does
> not change (see [Warts](#warts)) — so from a third-party page
> `embedViewer()` works everywhere (the engine runs in an iframe from the
> Verse origin), while API calls go through your own backend with the
> package (Node 18+), or from pages you host on the Verse origin itself.

## Auth

```js
const verse = new VerseClient({
  baseUrl: "https://verse.ctruh.com", // or your own origin
  token: process.env.VERSE_TOKEN,   // account token (64 hex) → Authorization: Bearer — owns what you upload
  apiKey: process.env.VERSE_API_KEY, // vk_… → X-API-Key — only on keyed-mode servers
  share: null,                       // a share token for ONE private scene → X-Verse-Share
});
```

All three are optional ([Authentication](api.md#authentication)). Get an
account token once with `createAccount()` (it is shown once — store it like
an API key). Other options: `source` (tool attribution, default
`verse-sdk/<version>`), `retries` (transient retries, default 1),
`telemetry` (see [Telemetry opt-out](#telemetry-opt-out)), `pollIntervalMs`
(default 3000), `fetch` (custom implementation).

## Three calls: file in, link out

```js
import { readFileSync } from "node:fs";
import { VerseClient } from "@ctruhtech/verse-sdk";

const verse = new VerseClient({ baseUrl: "https://HOST", token: process.env.VERSE_TOKEN });
const scene = await verse.publish(readFileSync("flat.glb"), {
  name: "flat",
  onProgress: (p) => p.fraction !== undefined && console.log(`upload ${(p.fraction * 100) | 0}%`),
  onStage: (stage, rec) => console.log(stage, rec.etaText ?? ""),
});
console.log(scene.url);                  // https://HOST/?vpk=ingest/flat-….vpk
console.log(verse.shareLink(scene));     // https://HOST/view?vpk=ingest/flat-….vpk
```

`publish()` is `upload()` + `waitForJob()`; use them separately to store
the job id across process restarts.

## Errors

Every failure is a `VerseError` with the API's
[error contract](api.md#error-contract) decoded:

| Field | Meaning |
| --- | --- |
| `message` | the server's `error` sentence, verbatim — safe to show |
| `status` | HTTP status; `0` for a network error, cancel or timeout |
| `code` | the [friendly-error](api.md#friendly-errors) code when the server gave one (`no_meshes`, `file_too_large`, …), else `auth_required` / `not_found` / `rate_limited` / `server_busy` / `storage_full` / `network` / `edge` / `cancelled` / `timeout` / `unknown_job` / `job_failed` |
| `fromApp` | `true` = the Verse server spoke (`X-Verse-Error: 1`): authoritative, do not blind-retry. `false` = the network edge or the network itself |
| `retryable` | is trying again worthwhile? |
| `errorInfo` | `{ code, title, message, fix, retryable }` from an ingest failure |
| `body` | the parsed JSON body (e.g. `received` on a `409`) |

Transient failures (`fromApp: false`) are retried once by every call
(`retries` option); app errors never are.

```js
import { VerseError } from "@ctruhtech/verse-sdk";
try {
  await verse.publish(bytes);
} catch (e) {
  if (e instanceof VerseError && e.code === "no_meshes") console.log(e.errorInfo.fix);
  else throw e;
}
```

## Reference

Every method, the route it calls ([API reference](api.md)), and a runnable
example. `verse` is a `VerseClient`.

### Ingest

#### `limits()` — `GET /v1/limits`

What to know before choosing a file: enforced limits, recommendations, the
texture budget, timing, the live queue.

```js
const { limits, recommended } = await verse.limits();
if (file.size > limits.maxUploadBytes) throw new Error("too big");
```

#### `upload(file, options?)` — `POST /v1/ingest`, or the resumable trio

Upload bytes (`Blob`/`File`, `Buffer`, `Uint8Array`, `ArrayBuffer`);
resolves `{ job }` once the server accepted them. Options:

| Option | Meaning |
| --- | --- |
| `name` | slug prefix for the scene id (`X-Verse-Name`) |
| `kind: "splat"` \| `"cloud"` \| `"ifc"` \| `"usd"` \| `"fbx"` \| `"obj"` | a `.splat`/`.ply` capture, a point cloud (`.ply`/`.las`/`.laz`/`.e57` → streamed `.vpc`), an IFC building model or a single-file USD scene (both converted on the server; the record then carries `propsUrl` and `convert`), or (3.0) an FBX / OBJ model, alone or zipped with its textures (converted on the server, then published like a GLB; the record carries `convert`) (`X-Verse-Kind`; the bytes are sniffed anyway) |
| `units: "m"` \| `"cm"` \| `"mm"` \| `"in"` \| `"ft"` | (3.0) OBJ only — the unit the file was authored in (`X-Verse-Units`); by default a model wider than 1,000 units is read as centimetres. FBX declares its own |
| `resumable` | `"auto"` (default: resumable at ≥ 100 MB, like the exporters), `true`, `false` |
| `resumableFromBytes`, `partBytes` | the auto threshold (100 MB) and part size (8 MB) |
| `prepared: true` | the file went through [verse-prepare](guides/verse-prepare.md); lifts the resumable cap to 20 GB (checked at commit) |
| `bake: true \| "preview" \| "final"` | (2.7) [Bake for me](guides/bake-for-me.md): lightmap a live-lit GLB on the server before compiling (`X-Verse-Bake`; `true` = `"preview"`). The job record's `bake` carries the report, or `bake.skipped` when the scene was compiled live-lit instead |
| `path: "fidelity" \| "streamed"` | (2.8) [Fidelity mode](guides/fidelity-mode.md): publish the file itself as `ingest/<id>.fidelity.glb` (`X-Verse-Path`) — the record then carries `path`, `glbUrl`, `classification`, `digest`/`signature`. Omitted = streamed, with the classifier's verdict in `classification` |
| `look: "studio:warm,bg:ffffff"` | (2.8) with `path: "fidelity"`: the studio preset (`neutral` / `warm` / `dark`) and backdrop the share link opens with (`X-Verse-Look`) |
| `onProgress(p)` | `{ sent, total, fraction, part?, resumedFrom? }` — per part when resumable; `0` and `1` for a one-shot upload in Node, live in browsers (XHR) |
| `signal` | an `AbortSignal` — cancel; rejects with `code: "cancelled"` |

```js
const ctl = new AbortController();
cancelButton.onclick = () => ctl.abort();
const { job } = await verse.upload(fileInput.files[0], {
  name: "showroom",
  onProgress: (p) => (bar.value = p.fraction),
  signal: ctl.signal,
});
```

#### `uploadResumable(file, options?)` — `POST /v1/ingest/begin` · `PUT /v1/ingest/part/<uploadId>` · `GET /v1/ingest/part/<uploadId>` · `POST /v1/ingest/commit/<uploadId>`

The [resumable flow](api.md#resumable-uploads) explicitly: strictly ordered
parts; a dropped connection waits, reads the server's `received` and
carries on; an out-of-order `409` moves the cursor to the server's offset,
a `409` at the client's own offset ("another part is already uploading")
backs off and retries; up to 8 misses in a row (~1 min) before it gives up,
and a resync that itself fails at the network counts as one more miss.
Network errors name the socket error Node's `fetch` hides in `cause`
(`network error: fetch failed (ECONNRESET: …)`). `commit` answers the same `202 { job }` as a one-shot upload. Resolves
`{ job, uploadId }`.

```js
const { job, uploadId } = await verse.uploadResumable(bigBuffer, { name: "scan", partBytes: 16 * 1024 * 1024,
  onProgress: (p) => console.log(`part ${p.part ?? "-"} ${(p.fraction * 100).toFixed(0)}%`) });
```

#### `uploadFromUrl(url, options?)` — `POST /v1/ingest/url` · `publishFromUrl(url, options?)`

4.0: the server fetches a public http(s) URL (Dropbox `dl=1`, a presigned
S3 link, a CMS media URL) and compiles it like an upload — the file never
passes through your process. `uploadFromUrl` resolves `{ job, sizeBytes,
source }`; `publishFromUrl` waits for the compile and resolves the finished
record. Options: `name`, `kind`, `bake`, `path`, `look`, `signal` (+ the
wait options). Private / local addresses fail with code `url_blocked`; a
link that does not hand over a file with `url_fetch_failed`.

```js
const rec = await verse.publishFromUrl("https://www.dropbox.com/scl/fi/…/villa.glb?dl=1", { name: "villa" });
console.log(rec.url);
```

#### `job(jobId)` — `GET /v1/ingest/<job>`

One poll. The record's shape is documented at
[GET /v1/ingest/<job>](api.md#get-v1-ingest-job); `unknown_job` after the
two-hour record retention.

```js
const rec = await verse.job(job);
console.log(rec.status, rec.stage, rec.etaText);
```

#### `waitForJob(jobId, options?)`

Poll until the job leaves `compiling`. Resolves the `done` record; rejects
with a `VerseError` carrying the taxonomy `code` when it ends in `error`.
Options: `onStage(stage, record)` (fires on every `stage`/`status`
change), `onProgress(record)` (every poll), `intervalMs`, `timeoutMs`
(default 45 min), `missTolerance` (default 8 missed polls — rides out a
server restart), `signal`.

```js
const done = await verse.waitForJob(job, { onStage: (s) => console.log("→", s) });
// → preparing → queued → textures → geometry → packing → signing → verifying → done
```

#### `publish(file, options?)`

`upload()` then `waitForJob()` with one options object; resolves the done
record plus `job`. Byte progress is `onUploadProgress`; `onProgress`
and `onStage` are the job poll's — before 4.0 `onProgress` received both
shapes.

#### `attachContact(jobId, contact)` — `POST /v1/ingest/<job>/contact`

"Email me when it's live." `{ name, email, phone, consent: true }` → `{ ok, emailed, notify }`.

```js
await verse.attachContact(job, { name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210", consent: true });
```

#### `shareLink(sceneOrRecord, options?)`

The viewer link for a scene id, a finished job record or a scene summary:
`https://HOST/view?vpk=ingest/<id>.vpk` (a classic-fallback record keeps its
own `?model=` link). Knobs: `share` (a share token → `?share=`, the
[private-scene gate](api.md#visibility-share-tokens) that also unlocks
`GET /ingest/<id>.vpk?share=<shareToken>`), `variant` (open on a material
variant), `view: "overview"`.

```js
verse.shareLink(done, { variant: "Oak", share: token.shareToken });
```

### Accounts

#### `createAccount(name)` — `POST /v1/account`

Token-only accounts; the `token` is returned **once** (3 per day per IP).
Does not set `verse.token` — you decide where it is stored.

```js
const { accountId, token } = await verse.createAccount("Acme Realty");
```

#### `account()` — `GET /v1/account` · `accountStats()` — `GET /v1/account/stats`

```js
const me = await verse.account();                // { accountId, name, createdAt }
const { opens, last7d } = await verse.accountStats();
```

#### `accountAnalytics({ days? })` — `GET /v1/account/analytics` · `accountAnalyticsCsv({ days? })` — `GET /v1/account/analytics.csv`

4.0: every owned scene added up over the last 7, 30 (default) or 90 days,
plus a row per scene; the CSV variant returns the text of the attachment.

```js
const a = await verse.accountAnalytics({ days: 30 });   // { views, uniqueViewers, scenes: [{ id, views, … }] }
```

#### `login(token?)` — `POST /v1/account/login` · `logout()` — `POST /v1/account/logout`

Browser sign-in for `/studio` (sets / clears the `verse_session` cookie).
API clients just pass `token` to the constructor.

```js
await verse.login(token);
```

#### `webhooks.list()` — `GET /v1/account/webhooks` · `webhooks.create({ url, events?, secret? })` — `POST /v1/account/webhooks` · `webhooks.delete(id)` — `DELETE /v1/account/webhooks/<id>` · `webhooks.deliveries(id)` — `GET /v1/account/webhooks/<id>/deliveries`

Webhooks (2.7): signed, retried receivers for `scene.ready`,
`scene.failed`, `comment.added`, `version.promoted` and `config.changed`
([docs/api.md § Webhooks](api.md#webhooks-2-7)). The `secret` is on the
create response **once**; `list()` only ever shows a hint.

```js
const hook = await verse.webhooks.create({ url: "https://example.com/verse-hook", events: ["scene.ready"] });
saveSomewhereSafe(hook.secret);
const { deliveries } = await verse.webhooks.deliveries(hook.id); // last 50, newest first
await verse.webhooks.delete(hook.id);
```

#### `webhooks.test(id)` — `POST /v1/account/webhooks/<id>/test`

One signed `ping` delivery now, no retries → `{ id, delivery, ok,
status, ms, error? }`.

```js
const r = await verse.webhooks.test(hook.id);
if (!r.ok) console.warn(`receiver answered ${r.status || r.error}`);
```

#### `verifyWebhook({ secret, body, signature, timestamp, toleranceSec? })`

For your receiver: recomputes `X-Verse-Signature` over the **raw**
body in constant time and rejects timestamps more than `toleranceSec`
(default 300) off. WebCrypto — Node 18+, Workers, Deno, Bun.

```js
import { verifyWebhook } from "@ctruhtech/verse-sdk";
const ok = await verifyWebhook({ secret, body: rawBody, signature: req.headers["x-verse-signature"], timestamp: req.headers["x-verse-timestamp"] });
```

### Analytics

#### `analytics.scene(id, { days?, fresh? })` — `GET /v1/scenes/<id>/analytics` · `analytics.sceneCsv(id, { days? })` — `GET /v1/scenes/<id>/analytics.csv`

#### `analytics.account({ days? })` — `GET /v1/account/analytics` · `analytics.accountCsv({ days? })` — `GET /v1/account/analytics.csv`

What Studio's Analytics page shows, for your own dashboards: views,
unique and returning viewers, time spent, the funnel, devices, rooms,
heatmap, daily series (`days`: 7, 30 — the default — or 90). The `Csv`
variants resolve the CSV text. Owner token required.

```js
const a = await verse.analytics.scene(sceneId, { days: 7 });
console.log(`${a.views} views · ${a.uniqueViewers} people · median ${a.time.medianSeconds}s`);
const csv = await verse.analytics.accountCsv({ days: 90 });
```

### Embed code

#### `embedCode(scene, { share?, poster?, background?, look?, aspect?, load?, autoplayTour?, title? })`

Pure (no request): `{ element, iframe, url, script }` — the
`<verse-viewer>` tag with its script, the lazy `/embed` iframe (what the
oEmbed endpoint returns) and the URL behind it. Pass `share` for a
private scene.

#### `oembed(link, { maxwidth?, maxheight? })` — `GET /oembed`

The oEmbed JSON a CMS fetches for a share link.

#### `defineViewer(baseUrl)`

Loads `embed.js` once so `<verse-viewer>` is defined on the page.

```js
const { element } = verse.embedCode(sceneId, { poster: posterUrl, autoplayTour: true });
document.querySelector("#listing").innerHTML = element; // or paste it into your CMS
```

### Scenes

Owner-only unless noted (`401` without a token, `404` for a stranger).

#### `scenes.list()` — `GET /v1/account/scenes` · `scenes.get(id)`

Every scene the token owns, newest first; `get(id)` is the one entry
(there is no per-scene GET route — see [Warts](#warts)).

```js
for (const s of await verse.scenes.list()) console.log(s.id, s.visibility, s.stats.opens);
```

Each entry (2.8) also says `path` (`"fidelity"` | `"streamed"`), `glbUrl`
for a Fidelity scene and, for a streamed one, `engine { version, current,
older }` — `older` means a newer compiler is on this server (Studio's
"re-upload to get the latest look" badge).

#### `scenes.current(id)` — `GET /v1/scenes/<id>/current`

Public (private scenes: owner or share token): which version the link
serves and the viewer's cache key.

```js
const { version, file } = await verse.scenes.current(id); // { version: 2, file: "ingest/<id>.vpk?v=2" }
```

#### `scenes.analytics(id, { days?, fresh? })` — `GET /v1/scenes/<id>/analytics` · `scenes.analyticsCsv(id, { days? })` — `GET /v1/scenes/<id>/analytics.csv`

4.0, owner-only: the Studio dashboard's numbers for one scene — views,
unique and returning viewers, time, funnel, devices, rooms, viewpoints,
heatmap, daily series ([docs/api.md § Analytics](api.md#analytics)).

```js
const a = await verse.scenes.analytics(rec.job, { days: 7 });
console.log(a.views, a.uniqueViewers, a.funnel.map((f) => `${f.label}: ${f.n}`));
```

#### `scenes.claim(id)` — `POST /v1/scenes/<id>/claim`

Take ownership of an anonymous scene (`409` if someone else owns it).

#### `scenes.setVisibility(id, visibility)` — `PATCH /v1/scenes/<id>`

`"public"` · `"unlisted"` (default) · `"private"`.

```js
await verse.scenes.setVisibility(id, "private");
```

#### `scenes.shares.create(id)` — `POST /v1/scenes/<id>/share` · `scenes.shares.list(id)` — `GET /v1/scenes/<id>/share` · `scenes.shares.revoke(id, shareId)` — `DELETE /v1/scenes/<id>/share/<shareId>`

Per-recipient share tokens for a private scene. The token is shown once.

```js
const link = await verse.scenes.shares.create(id);
send(verse.shareLink(id, { share: link.shareToken }));
await verse.scenes.shares.revoke(id, link.id);
```

#### `scenes.shares.link(id, { variant?, cfg?, view? })`

Mint a token and build the private link in one call →
`{ id, suffix, created, shareToken, url }`; revoke with
`scenes.shares.revoke(id, link.id)`.

#### `scenes.stats(id)` — `GET /v1/scenes/<id>/stats`

`{ opens, uniqueSessions, totalMinutes, last7d }`.

#### `scenes.heatmap(id, { fresh? })` — `GET /v1/scenes/<id>/heatmap`

Where visitors stood and where they waited for bytes, as a grid over the
floor plan, plus the funnel. `fresh: true` refolds the telemetry log.

```js
const heat = await verse.scenes.heatmap(id);
console.log(heat.funnel, heat.grid.nx, heat.grid.nz, heat.grid.stood.length);
```

#### `scenes.config(id, { share? })` — `GET /v1/scenes/<id>/config` · `scenes.setConfig(id, schema | null)` — `PUT /v1/scenes/<id>/config`

Configurator depth (2.7): the owner's option-group schema (variants,
material aliases, visibility sets, SKU + display price — see
[docs/api.md § Configurator](api.md#configurator-a-scene-s-configuration-schema-2-7)).
`config()` is public (mirrors visibility) and resolves `null` when the
scene has none; `setConfig(id, null)` clears. `shareLink()` takes a
`cfg` knob for a pre-picked configuration.

```js
await verse.scenes.setConfig(id, { currency: "USD", groups: [{ id: "fabric", name: "Fabric", options: [{ id: "oak", name: "Oak", variant: "Oak" }, { id: "walnut", name: "Walnut", variant: "Walnut", price: 120 }] }] });
const rec = await verse.scenes.config(id); // { scene, config, updated } | null
verse.shareLink(id, { cfg: { fabric: "walnut" } }); // …&cfg=fabric:walnut
```

#### `scenes.delete(id)` — `DELETE /v1/scenes/<id>`

Removes the artifact, sidecars, poster, review comments and versions;
every share link stops working.

#### `scenes.arUrl(id, { share?, version? })` — `GET /ingest/<id>.usdz`

(2.7) The iOS AR Quick Look package of a product-scale scene
([See it in your room](guides/view-in-ar.md)) — a URL, no request. It
exists only when the finished job record carries `arUrl` (under the AR
caps, not an interior; `job.ar.skipped` says why otherwise). Same
visibility as the scene (`share` for a private one), `version` pins a
scene version. Put it in Safari's AR link shape — an `<a rel="ar">` with
an `<img>` as its first child — and iPhones open it in AR:

```js
const done = await verse.waitForJob(job);
if (done.arUrl) {
  link.rel = "ar";
  link.href = verse.scenes.arUrl(sceneId, { share: token?.shareToken });
  link.innerHTML = `<img src="${done.poster ?? "poster.png"}" alt="">View in AR`;
}
```

### Versions

An owned streamed (`.vpk`) scene takes a new upload as a version; the share
link never changes ([Scene versions](api.md#scene-versions-2-5-0)).

#### `versions.upload(id, file, { name? })` — `POST /v1/scenes/<id>/versions` (GLB body)

Compiles the upload as an ordinary job; resolves `{ id, job, pending: true, url }`.

#### `versions.publish(id, file, options?)`

`versions.upload()` + `waitForJob()`, resolving the **promoted** record
(`sceneId`, `version`, `diffSummary`).

```js
const v2 = await verse.versions.publish(id, readFileSync("flat-v2.glb"), { name: "flat-v2" });
console.log(`now version ${v2.version}: ${v2.diffSummary}`);
```

#### `versions.attach(id, job)` — `POST /v1/scenes/<id>/versions` (JSON `{ job }`)

Attach a job this account uploaded through `/v1/ingest`.

#### `versions.list(id)` — `GET /v1/scenes/<id>/versions`

```js
const { current, versions } = await verse.versions.list(id);
versions.forEach((v) => console.log(v.n, v.current ? "*" : " ", v.tris, v.diffSummary));
```

#### `versions.diff(id, n)` — `GET /v1/scenes/<id>/versions/<n>/diff`

Version `n` against the version before it: triangles, clusters, size,
bounds, materials added/removed/changed, texture resolution changes, `summary`.

#### `versions.activate(id, n)` — `POST /v1/scenes/<id>/versions/<n>/activate`

Rollback or forward; the link now serves version `n`.

```js
await verse.versions.activate(id, 1); // roll back
```

#### `versions.fileUrl(id, n)` — `GET /v1/scenes/<id>/versions/<n>/file` · `versions.stageUrl(id, n)` — `GET /v1/scenes/<id>/versions/<n>/stage`

Owner-only URLs of an archived version's `.vpk` (Range supported) and its
staging manifest, for your own `fetch` with `verse.authHeaders()`.

#### `versions.delete(id, n)` — `DELETE /v1/scenes/<id>/versions/<n>`

Never the current one (`409`).

### Review comments

Pinned comments in 3D on a shared scene
([Review comments](api.md#review-comments)). A private scene needs the
owner's token or a share token (`share` option here, or the client's `share`).

#### `review.post(scene, { pos, text, author? }, { share? })` — `POST /v1/review/<sceneId>`

No account needed (60/hour/IP). `pos` is a world position — the embed's
`pick()` gives you one.

```js
const hit = await viewer.pick(0.5, 0.5);
await verse.review.post(id, { pos: hit.position, text: "Oak finish here?", author: "Priya" });
```

#### `review.list(scene, { share? })` — `GET /v1/review/<sceneId>`

#### `review.resolve(scene, commentId)` — `POST /v1/review/<sceneId>/<id>/resolve` · `review.delete(scene, commentId)` — `DELETE /v1/review/<sceneId>/<id>`

Owner moderation.

```js
for (const c of await verse.review.list(id)) if (!c.resolved) await verse.review.resolve(id, c.id);
```

#### `scenes.experiences(id)` — `GET /v1/scenes/<id>/experiences` · `scenes.setDefaultExperience(id, exp)` — `PUT /v1/scenes/<id>/experience` · `scenes.defaultExperience(id)` — `GET /v1/scenes/<id>/experience`

Guided tours (2.7): the experiences an owner authored for a scene, which
one the plain share link plays (`default`), and — public — that manifest.

```js
const { experiences, default: current } = await verse.scenes.experiences(id);
await verse.scenes.setDefaultExperience(id, experiences[0].id); // null clears
const rec = await verse.scenes.defaultExperience(id); // null when none is set
```

#### `scenes.setGround(id, png)` — `PUT /v1/scenes/<id>/ground`

Exterior kit (2.7): upload the scene's ground heightfield (a PNG ≤ 4096²,
red = height) → `{ scene, path, url, width, height, bytes }`. The viewer's
`ground.heightfield` points at `path`.

```js
const { path } = await verse.scenes.setGround(id, await fs.promises.readFile("terrain.png"));
viewer.setExterior({ ground: { kind: "heightfield", heightfield: `/${path}`, amplitude: 8, material: "grass" } });
```

#### `scenes.background(id)` — `GET /v1/scenes/<id>/background` · `scenes.setBackground(id, bg)` — `PUT /v1/scenes/<id>/background` · `scenes.setBackgroundImage(id, file, type)` — `PUT /v1/scenes/<id>/background/image`

Background (2.8): what sits behind the scene, one spec string (`rrggbb`,
`transparent`, `grad:a,b`, `studio:neutral|warm|dark`, `image:…`, `hdr:…`;
`""` clears). `background()` is readable by whoever may open the scene
(`null` when none is set); the setters are owner-only.

```js
await verse.scenes.setBackground(id, "grad:2a2f45,0b0d12");
await verse.scenes.setBackgroundImage(id, await fs.promises.readFile("studio.hdr"), "image/vnd.radiance");
const { bg } = (await verse.scenes.background(id)) ?? {};
```

#### `scenes.media(id)` — `GET /v1/scenes/<id>/media` · `scenes.setMedia(id, table)` — `PUT /v1/scenes/<id>/media` · `scenes.uploadMedia(id, file)` — `POST /v1/scenes/<id>/media/upload`

Media surfaces + spatial audio (2.7): videos on surfaces and ambient
sounds, stored with the scene. `media()` is public (mirrors the scene's
visibility; `null` when none), the other two owner-only. `uploadMedia`
takes one raw file (mp4 / webm video ≤ 200 MB, mp3 / m4a / ogg / wav /
webm audio ≤ 20 MB, sniffed) and answers `{ path, url, bytes, kind, ext }`;
put the `path` in a surface's or emitter's `url` (same-origin only).

```js
const clip = await verse.scenes.uploadMedia(id, fs.readFileSync("tv-loop.mp4"), "video/mp4");
const bed = await verse.scenes.uploadMedia(id, fs.readFileSync("lobby.mp3"), "audio/mpeg");
await verse.scenes.setMedia(id, {
  media: [{ material: 3, url: `/${clip.path}`, emissive: 1.5, audio: true }],
  audio: [{ pos: [2, 1.2, -1], url: `/${bed.path}`, radius: 6, gain: 0.8 }],
});
const table = await verse.scenes.media(id); // { scene, media, audio } | null
```

### Publishing

#### `publishExperience(manifest)` — `POST /v1/experience`

A [`.verse.json` manifest](experience-format.md) → `{ path, url }`.

```js
const { url } = await verse.publishExperience({ name: "Showroom", scene: `ingest/${id}.vpk`,
  hotspots: [{ id: "front", label: "Front", position: [0, 1.2, 3], look: [0, 0.5, 0] }] });
```

#### `experience.get(id)` — `GET /v1/experience/<id>` · `experience.update(id, manifest)` — `PUT /v1/experience/<id>` · `experience.uploadMedia(id, clip, contentType?)` — `POST /v1/experience/<id>/media`

A version-2 manifest (`ExperienceManifest`: hotspots with `anchor` pins and
cards, `tour.steps` with poses + narration, `sun`) read fresh (`no-store`),
rewritten in place (owner-only), and narration clips (≤ 2 MB, mp3/m4a/ogg/
wav/webm) whose `path` a step's `audio` references.

```js
const { experience } = await verse.experience.get("exp-38fd878a72");
const clip = await verse.experience.uploadMedia("exp-38fd878a72", mp3Bytes, "audio/mpeg");
experience.tour.steps[0].audio = `/${clip.path}`;
await verse.experience.update("exp-38fd878a72", experience);
```

#### `publishTour(tour)` — `POST /v1/tour`

`{ name?, scene, samples: [[t, x, y, z, fx, fy, fz], …] }` → a `?tour=` link.

#### `uploadPoster(png, { scene? })` — `POST /v1/poster`

Raw PNG ≤ 4 MB; with a token and `scene`, attached as that scene's thumbnail.

### Presence rooms

#### `rooms.eventsUrl(room)` — `GET /v1/room/<room>/events` · `rooms.pose(room, pose)` — `POST /v1/room/<room>/pose` · `rooms.signal(room, msg)` — `POST /v1/room/<room>/signal`

```js
const es = new EventSource(verse.rooms.eventsUrl("demo-room") + "?id=viewer-1"); // ?id= tags the stream (2.7)
es.onmessage = (e) => console.log(JSON.parse(e.data).peers);
es.addEventListener("signal", (e) => console.log("signal", JSON.parse(e.data)));
setInterval(() => verse.rooms.pose("demo-room", { id: "viewer-1", name: "Me", color: "#78aaff", pose: cam, flags: { hand: true } }), 125);
await verse.rooms.signal("demo-room", { from: "viewer-1", to: "*", kind: "present", data: { on: true } });
```

`rooms.signal` is the relay the viewer's voice (WebRTC offers / answers /
ICE) and presenter mode (`present`, `action`, `hand`, `handover`) use;
the server forwards it and stores nothing. Kinds and the action schema:
[api.md § Presence rooms](api.md#presence-rooms).

### Signing and operations

#### `pubkey()` — `GET /v1/pubkey` · `config()` — `GET /v1/config` · `health()` — `GET /v1/health/deep` · `ingestStats()` — `GET /v1/ops/ingest-stats`

```js
const { spki } = await verse.pubkey();             // Ed25519 SPKI, base64
const h = await verse.health().catch((e) => e.body); // 503 → VerseError; its body still carries `checks`
const { last24h } = await verse.ingestStats();      // any account
```

#### `sendTelemetry(batch)` — `POST /v1/telemetry`

One batch → `204`. Returns `false` without a request when the client opted out.

### Low level

#### `request(path, { method?, body?, headers?, query?, signal?, retries?, parse? })`

Any route with the SDK's auth, error contract and retry. Plain objects are
sent as JSON; bytes as-is; `parse: "response"` returns the raw `Response`.

```js
const leads = await verse.request("/v1/ops/leads"); // operator-only; needs the admin token
const vpk = await verse.request(`/v1/scenes/${id}/versions/2/file`, { parse: "response", headers: { Range: "bytes=0-1023" } });
```

#### `url(path, query?)` · `authHeaders()`

The absolute URL for a path, and the headers to use with your own `fetch`.

### Embed

#### `embedViewer(target, options)` · `verse.embed(target, options)`

Loads `embed.js` from the Verse origin once and mounts the engine in an
iframe from that origin (your page needs no COOP/COEP headers). Resolves
the [`VerseViewer`](embed-sdk.md) — every verb and event of the embed SDK,
fully typed. Options: every [`VerseEmbedOptions`](embed-sdk.md#verseembedoptions)
(`scene`, `vpk`, `model`, `poster`, `variant`, `lights`, `cinematic`,
`share`, `review`, `analytics`, `quality`, `render`, `hdr`, `bg`) plus
`baseUrl` (the Verse origin; `verse.embed()` fills it in), `scriptUrl`,
`waitForReady`, `timeoutMs`. 2.7 adds the light studio
(`viewer.setLights({...})`, `lights` event, `VerseLightsState`) and
Cinematic stills (`viewer.setCinematic(true)`, `cinematic` event,
`viewer.saveStill({ preset: "1080p" })` → `VerseStillResult`) — see
[embed-sdk.md](embed-sdk.md#setlights-state). 2.7.2 adds Auto look
(`viewer.autoLook()` → `VerseAutoLookResult`, `auto-look` events,
`undoAutoLook()`): one call for the best view, exposure, sun, fill,
shadows, sky, the quality knobs and the walkthrough — see
[embed-sdk.md](embed-sdk.md#autolook-opts-undoautolook).

```js
import { embedViewer } from "https://HOST/sdk/verse-sdk.js";
const viewer = await embedViewer(document.getElementById("stage"), { baseUrl: "https://HOST", scene: SCENE_ID, variant: "Oak" });
viewer.on("variant", ({ names }) => renderPicker(names));   // KHR_materials_variants in the scene
picker.onchange = () => viewer.setVariant(picker.value);     // or null for the file's defaults
viewer.on("loaded", (d) => console.log(d.clusters, "clusters"));
viewer.setClipPlanes([[0, -1, 0, 1.2]]);                    // 2.7: section cut (keep y ≤ 1.2)
viewer.measure("distance");                                 // 2.7: taps → `measure` events
```

A complete page with a variant picker: `sdk/examples/embed-variants.html`,
served live at `https://HOST/sdk/embed-variants.html?scene=<id>`.

## Telemetry opt-out

The SDK sends exactly one kind of row on its own: an `upload-fail` beacon
to `POST /v1/telemetry` when an upload fails client-side or a job ends in
`error` — the same row the web app sends, so the operator's 24 h scan
counts failures the server never logged. It carries the error text, the
phase and the taxonomy code; never the file, the token or an IP.

```js
new VerseClient({ baseUrl, telemetry: false }); // the SDK never calls /v1/telemetry on its own
```

The viewer's own analytics (the look-and-stall feed behind the heatmap) are
a separate opt-out: `embedViewer(el, { analytics: false })`, exactly like
the embed option.

## Examples

| File | What |
| --- | --- |
| `sdk/examples/upload-and-link.mjs` | Node CLI: `node upload-and-link.mjs scene.glb --server https://HOST [--token …] [--name …] [--private]` — prints the share link (and a share token for a private scene) |
| `sdk/examples/embed-variants.html` | plain HTML: SDK from `/sdk/verse-sdk.js`, viewer + a material-variant picker built from the `variant` event (served at `/sdk/embed-variants.html`) |
| `sdk/examples/publish.yml` | GitHub Actions: publish `assets/*.glb` on every push to `main`, write the links to the job summary |

## Tests and gates

- `cd sdk && npm test` — unit tests (`node:test`) against a scripted mock
  origin: headers, error contract, retry rules, resumable parts/resync/409,
  cancel, progress, every route's method + path, telemetry opt-out.
- `npm run test:integration` — the SDK against a real `serve.mjs` (ports
  8750–8759): upload → poll → done → link → own → share → review → heatmap
  → version → diff → activate → delete.
- `node web/test/fix-verify-sdk.mjs` — both of the above, plus: the build
  is current (served copy and embed typings in sync), `/sdk/verse-sdk.js`
  is served with embed.js's headers and loads in a browser, the Postman
  collection is byte-identical to `scripts/gen-postman.mjs`'s output, and
  `scripts/api-parity.mjs` reports zero drift between the server's
  dispatch, `docs/api.md`, this page and the SDK.

## Warts

API shapes the SDK papers over rather than changes:

- **No per-scene GET.** `scenes.get(id)` filters `GET /v1/account/scenes`;
  a single-scene read for a non-owner does not exist (use `scenes.current`
  for the version facts).
- **Promotion lags `done`.** A new version's job answers `status: "done"`
  a beat before it is archived and diffed; `versions.publish()` keeps
  polling until `version` is on the record.
- **One-shot upload progress** is only available in browsers (XHR); Node's
  `fetch` has no upload progress — use the resumable flow for a bar.
- **`.d.ts` MIME.** The server has no MIME entry for `.ts`, so
  `/sdk/verse-sdk.d.ts` (like `/verse-embed.d.ts`) is served as
  `application/octet-stream`; editors fetching it directly see a download.
- **No CORS on `/v1/*`.** Browser pages on a foreign origin cannot call
  the API; only the presence SSE stream, `/ingest/*` artifacts, `/oembed`
  and the three third-party scripts (`embed.js`, `/sdk/verse-viewer.js`,
  `/sdk/verse-sdk.js`) carry `Access-Control-Allow-Origin`. Use the package
  server-side, or host the page on the Verse origin. The embed path is
  unaffected.
