# The REST client round trip: file in, link out, numbers back

Everything an integration does with Verse is five calls: get a token, hand over a file (or a URL the server fetches), wait for the compile, make a share link, read the analytics. A webhook replaces the waiting. This guide walks the round trip with `@ctruhtech/verse-sdk` and with plain `curl`, so it maps onto any language.

**Status:** tested. The whole round trip runs against a real server in `web/test/fix-verify-integrations.mjs`: account → `publishFromUrl` (through a redirect) → done → share link → analytics (JSON and CSV, per scene and per account) → a stranger is refused → webhook created → a real signed `scene.ready` delivery to a local receiver → the delivery log. The upload-from-URL guard is tested on 13 reserved address families and 14 hostile URLs. The SDK's own tests: `sdk`, `npm test`.

## 0. Pick a client

- **JavaScript / TypeScript:** `npm install @ctruhtech/verse-sdk` — typed, dependency-free, Node 18+ and browsers. Reference: [JS / TS SDK](../sdk.md).
- **Anything else:** the API is plain JSON over HTTPS ([API reference](../api.md)); the `curl` lines below are the whole contract. A Postman collection is linked from the API reference.

```js
import { VerseClient, VerseError } from "@ctruhtech/verse-sdk";
const verse = new VerseClient({ baseUrl: "https://verse.ctruh.com", token: process.env.VERSE_TOKEN });
```

## 1. A token

An account is a token. Create one once, store it like an API key; it is shown once.

```js
const { accountId, token } = await new VerseClient({ baseUrl }).createAccount("Acme Realty");
```

```sh
curl -sS -X POST https://verse.ctruh.com/v1/account -H "Content-Type: application/json" -d '{"name":"Acme Realty"}'
# {"accountId":"…","token":"<64 hex, shown once>"}
```

Every call below sends it as `Authorization: Bearer $TOKEN`. Whatever you upload with it, the account owns. Self-hosted servers in keyed mode take `X-API-Key` instead ([Authentication](../api.md#authentication)).

## 2. The file in

Two ways. A **body upload** when the bytes are with you:

```js
const { job } = await verse.upload(readFileSync("villa.glb"), { name: "palm-villa" });
```

An **upload from URL** when the file already has one — a Dropbox or Drive share link, a presigned S3 / R2 / GCS URL, a CMS media library. The server fetches it itself, so the bytes never pass through your process or an automation platform:

```js
const { job, sizeBytes, source } = await verse.uploadFromUrl("https://www.dropbox.com/scl/fi/…/villa.glb?dl=1", { name: "palm-villa" });
```

```sh
curl -sS -X POST https://verse.ctruh.com/v1/ingest/url -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://www.dropbox.com/scl/fi/…/villa.glb?dl=1","name":"palm-villa"}'
# HTTP/1.1 202 Accepted   {"job":"palm-villa-3f1c9a2b7e04","sizeBytes":48213990,"source":"uc1234.dl.dropboxusercontent.com"}
```

Body fields: `url` (required, absolute `http(s)`), `name`, `kind` (`ifc`, `usd`, … when the extension does not say), `bake`, `path`, `look`, `scan` — the same knobs as a body upload. Dropbox links need `dl=1`; Drive links need "Anyone with the link".

What the server will **not** fetch, and answers `400 url_blocked` to: anything but `http(s)`, a URL with credentials, and any host that resolves to a private, loopback, link-local, cloud-metadata, CGNAT or multicast address (IPv6 ULA, link-local and v4-mapped alike). Redirects are followed by hand, at most three, each re-vetted. The download is streamed to disk and cut at the upload limit (`413 file_too_large`; a `Content-Length` over it is refused before a byte is read). An empty file is `400 empty_file`, a 404 at the URL is `404 url_fetch_failed`, a redirect loop or a timeout is `502` / `504 url_fetch_failed`. Full table: [Upload from URL](../api.md#upload-from-url).

## 3. Wait for the compile

```js
const rec = await verse.waitForJob(job, { onStage: (stage, r) => console.log(stage, r.etaText ?? "") });
// rec.status === "done", rec.url === "https://verse.ctruh.com/?vpk=ingest/palm-villa-3f1c9a2b7e04.vpk"
```

`publishFromUrl(url, opts)` (and `publish(bytes, opts)`) is the upload and the wait in one call. With `curl`, poll `GET /v1/ingest/<job>` every few seconds until `status` is `done` or `error`; the record carries `stage`, `etaText` and, on failure, a friendly `errorInfo` ([the job record](../api.md#get-v1-ingest-job)).

Or do not poll at all: section 6.

## 4. A link

The record's `url` opens the scene. For a client, make a **share link**: a private scene stays private, and the link can be revoked.

```js
const link = await verse.scenes.shares.create(job);
const url = verse.shareLink(job, { share: link.shareToken });   // …/view?vpk=ingest/<job>.vpk&share=<token>
```

```sh
curl -sS -X POST https://verse.ctruh.com/v1/scenes/$JOB/share -H "Authorization: Bearer $TOKEN"
# {"shareId":"…","shareToken":"<32 hex>",…}
```

`shareLink()` takes the same knobs as the viewer (`look`, `variant`, `cfg`, `view`, `bg`), so one link can open the oak variant from the kitchen. Embedding the link on a page: [`<verse-viewer>`](web-component.md).

## 5. The numbers back

```js
const a = await verse.scenes.analytics(job, { days: 30 });        // views, uniqueViewers, time, funnel, rooms, devices, daily…
const csv = await verse.scenes.analyticsCsv(job, { days: 30 });   // the same as CSV text
const all = await verse.accountAnalytics({ days: 30 });            // every scene you own, one row each
```

```sh
curl -sS "https://verse.ctruh.com/v1/scenes/$JOB/analytics?days=30" -H "Authorization: Bearer $TOKEN"
curl -sS "https://verse.ctruh.com/v1/account/analytics.csv?days=30" -H "Authorization: Bearer $TOKEN" -o scenes.csv
```

Only the owner can read a scene's analytics; anyone else gets a `404`, the same answer as for a scene that does not exist. What each field means: [Analytics](../api.md#analytics) and the guide [Show your clients who looked](analytics.md).

## 6. A webhook instead of polling

Register a receiver once; the server POSTs to it when a scene finishes (or fails), when a review comment lands, when a version goes live, when a configurator schema changes.

```js
const hook = await verse.webhooks.create({ url: "https://example.com/verse-hook", events: ["scene.ready", "scene.failed"] });
saveSomewhereSafe(hook.secret);                 // shown once; list() only ever shows a hint
const { deliveries } = await verse.webhooks.deliveries(hook.id);   // the last 50, newest first, ok / status per try
```

A delivery is one `POST` of `{ id, event, t, account, data }` with `X-Verse-Event`, `X-Verse-Delivery`, `X-Verse-Timestamp` and `X-Verse-Signature: sha256=<hex>` — HMAC-SHA256 with the secret over `<timestamp>.<raw body>`. Verify it over the bytes you received, compare in constant time, reject stale timestamps:

```js
import { createHmac, timingSafeEqual } from "node:crypto";
const expected = "sha256=" + createHmac("sha256", SECRET).update(`${req.headers["x-verse-timestamp"]}.${rawBody}`).digest("hex");
const ok = expected.length === sig.length && timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
```

`scene.ready`'s `data` is `{ job, status: "done", url, vpkUrl?, stats? }` — enough to make the share link (section 4) without another call. A non-2xx answer or a timeout is retried three times (2 s, then 8 s). All events and payloads: [Webhooks](../api.md#webhooks-2-7).

## 7. Errors

Every failure the SDK throws is a `VerseError` with the API's error contract decoded: `status`, `code` (`url_blocked`, `file_too_large`, `no_meshes`, `rate_limited`, …), `message` (safe to show), `retryable`, and `errorInfo` with a `fix` sentence for ingest failures. Transient network failures are retried once; server answers never are.

```js
try {
  await verse.publishFromUrl(url);
} catch (e) {
  if (e instanceof VerseError && e.code === "url_blocked") console.log("that link is not public:", e.message);
  else throw e;
}
```

With `curl`: the body is `{ "error": "<sentence>", "errorInfo": { "code", "title", "message", "fix", "retryable" } }` and the header `X-Verse-Error: 1` says the Verse server spoke (as opposed to the network edge). [Error contract](../api.md#error-contract).

## The same five calls, elsewhere

- **No code:** Zapier, Make and n8n apps wrap exactly these calls — [Zapier](automate-with-zapier.md), [Make](automate-with-make.md), [n8n](automate-with-n8n.md).
- **CI:** `sdk/examples/` has a GitHub Actions workflow that publishes a GLB on push.
- **Self-hosted:** replace the origin; the API is the same ([Run your own server](run-your-own-server.md)).

See also: [API reference](../api.md), [JS / TS SDK](../sdk.md), [Integrations](../integrations.md).
