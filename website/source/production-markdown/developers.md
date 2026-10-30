# Developers: embed, automate, get notified

Everything a developer needs to put Verse scenes in their own product, in
copy-paste form:

1. [`<verse-viewer>`](#verse-viewer) — one tag on any page.
2. [React and Vue](#react-and-vue) — thin typed wrappers over that tag.
3. [The REST SDK](#the-rest-sdk) — upload, wait, publish, private links,
   embed code, analytics.
4. [Webhooks](#webhooks) — `scene.ready` / `scene.failed`, signed and
   retried.
5. [MCP server](mcp.md) *(unreleased)* — let AI assistants and agents
   (Claude, ChatGPT, Cursor) upload a 3D file and hand back a Verse link.

Start at the [developer hub](https://verse.ctruh.com/developers): a live demo with copy-paste
code for HTML, React, Vue, Node and curl, and a
[playground](https://verse.ctruh.com/developers/playground) where you paste a GLB link or drop a
small file and get a live preview, the embed code and an SDK snippet. Runnable examples
(Next.js, Vite + React, Vue, plain HTML, a Shopify product page, a Node upload script and a
webhook receiver) live in `sdk/public-examples/`; designer tools (Framer, Webflow, Figma) in
`integrations/designers/` ([guide](guides/designer-tools.md)).

Install: `npm install @ctruhtech/verse-sdk @ctruhtech/verse-viewer @ctruhtech/verse-react @ctruhtech/verse-vue`
(take what you need). Each package has a 60-second quickstart in its README.

Replace `https://verse.ctruh.com` with your Verse origin if you run your own. The account token is the
credential — create one in Studio (`/studio`) or with
`POST /v1/account`; keep it server-side.

Reference: [api.md](api.md) (every route), [sdk.md](sdk.md) (every SDK
method), [embed-sdk.md](embed-sdk.md) (every viewer verb and event).
Postman: `web/playground/verse-api.postman_collection.json`.

## Adoption numbers

[`/developers/adoption`](https://verse.ctruh.com/developers/adoption) is a public page of aggregate counts, fed by `GET /v1/adoption` (JSON, cached five minutes):
weekly npm downloads for `@ctruhtech/*` and the SDK repository's GitHub stars (both fetched by
the server and cached an hour), and from the server itself: API keys used in the last 30 days (a count),
distinct sites embedding Verse, scenes served per week, and MCP calls. No personal data: a site is
kept only as a salted one-way hash, so there is no list, no IP address and no page path.

- **Being listed.** A scene owner can opt in with `POST /v1/adoption/optin {"listDomains": true}`
  (Bearer token); the sites that embed *their* scenes are then named on the page. `false` withdraws
  and deletes the stored names. `GET` on the same route reads the setting.
- **MCP counter.** The MCP server reports each tool call with `POST /v1/mcp/ping {"tool": "upload_scene"}`
  (any account token or org key). Only a short tool label is kept.

## `<verse-viewer>`

```html
<script src="https://verse.ctruh.com/embed.js" async></script>

<verse-viewer
  src="palm-villa-0a1b2c3d4e5f"
  poster="https://verse.ctruh.com/ingest/palm-villa-0a1b2c3d4e5f.poster.png"
  autoplay-tour>
</verse-viewer>
```

That is the whole integration. The 3D engine runs in an iframe from the
Verse origin, so your page needs no special headers; the element is
**lazy** (no frame, no engine bytes until it comes within 300 px of the
viewport), **responsive** (100 % of its container's width at 16:9), and
keeps the embed **scroll guard** — on a phone a vertical swipe over the
scene scrolls your page until the visitor taps into the scene; the mouse
wheel does the same on desktop.

### Attributes

| Attribute | Value | |
| --- | --- | --- |
| `src` | scene id · `.vpk` / `.glb` / `.fidelity.glb` URL · a share link | required; a share link's `share`, `look`, `bg` and `variant` come along |
| `share` | 32-hex share token | opens a **private** scene ([private links](#private-links)) |
| `poster` | image URL | shown until the scene draws (and if 3D cannot start) |
| `background` | `rrggbb` · `transparent` · `grad:a,b` · `studio:neutral\|warm\|dark` · `image:…` · `hdr:…` | changes live |
| `look` | look preset, e.g. `studio:warm`, `showroom` | |
| `load` | `lazy` (default) · `eager` · `tap` | `tap` shows a "View in 3D" button and loads nothing until it is pressed |
| `autoplay-tour` | boolean | plays the owner's guided tour once the scene is in |
| `aspect` | `16:9` (default) · `4:3` · `1:1` · `3:4` · `9:16` · `21:9` · `fill` | `fill` = the element's own CSS height |
| `tier` | `a` · `c` | pin the renderer: WebGPU where available (default) or WebGL2 |
| `hotspots` · `guard` · `fullscreen` · `analytics` | `false` to turn off | pins + tour · scroll guard · fullscreen button · view analytics |
| `variant` · `quality` | material variant name · `4k` | |

Changing an attribute re-mounts the viewer (except `background`, which
changes in place).

### Events

DOM `CustomEvent`s on the element; the payload is `event.detail`.

| Event | `detail` |
| --- | --- |
| `load` | `{ name, clusters?, streamed?, animations? }` — the scene is in (streamed scenes keep refining) |
| `ready` | `{ tier, ttfi }` — the engine booted (`tier` `"A/B"` WebGPU or `"C"` WebGL2) |
| `progress` | `{ drawn, total, fraction }` — ~1 Hz streaming progress |
| `error` | `{ message, code? }` — `code: "degraded"` when 3D cannot start here (the poster stays), `"no-source"` without `src` |
| `hotspot` | `{ id, label?, title? }` — a hotspot was visited (click, tour, or `viewer.goTo`) |
| `view-change` | `{ position: [x,y,z], forward: [x,y,z] }` — the camera moved (≤ 4 Hz, world metres) |
| `tour` | `{ playing, steps?, seconds? }` |

Every other viewer event (`stage`, `variant`, `measure`, …) is
dispatched under its own name too.

### Methods

```js
const el = document.querySelector("verse-viewer");
el.addEventListener("load", () => console.log("in"));
el.addEventListener("view-change", (e) => console.log(e.detail.position));

await el.setCamera({ position: [3, 2, 4], target: [0, 1, 0] }); // orbit camera: eye + pivot
await el.playTour();                                             // the owner's guided tour
el.stopTour();
const png = await el.screenshot();                               // Blob (image/png) of the current frame
el.activate();                                                   // mount now (skip lazy / tap)
el.viewer;                                                       // the full embed API: setVariant, setLights, exportVideo, …
```

Methods called before the scene has loaded wait for it. TypeScript:
`HTMLElementTagNameMap["verse-viewer"]` is typed by `verse-embed.d.ts`
(also shipped in `@ctruhtech/verse-sdk`).

## React and Vue

`@ctruhtech/verse-react` and `@ctruhtech/verse-vue` (in `sdk/react`, `sdk/vue`) are ~80-line
wrappers with no dependencies beyond the framework: they load `embed.js`
from your Verse origin once and render `<verse-viewer>`. Props mirror the
attributes (camelCase; the element's `load` attribute is the `loading`
prop), events arrive as callbacks / emits with the `detail`, and the ref
exposes `setCamera`, `playTour`, `stopTour`, `screenshot` and `viewer`.

### React

```jsx
import { useRef } from "react";
import { VerseViewer } from "@ctruhtech/verse-react";

export function Listing({ sceneId }) {
  const viewer = useRef(null);
  return (
    <>
      <VerseViewer
        ref={viewer}
        host="https://verse.ctruh.com"
        src={sceneId}
        autoplayTour
        onLoad={(d) => console.log("loaded", d.name)}
        onViewChange={(d) => console.log(d.position)}
      />
      <button onClick={() => viewer.current.setCamera({ position: [3, 2, 4], target: [0, 1, 0] })}>Front view</button>
    </>
  );
}
```

### Vue 3

```vue
<script setup>
import { ref } from "vue";
import { VerseViewer } from "@ctruhtech/verse-vue";
const viewer = ref(null);
</script>

<template>
  <VerseViewer ref="viewer" host="https://verse.ctruh.com" :src="sceneId" autoplay-tour
    @load="(d) => console.log('loaded', d.name)" @view-change="(d) => console.log(d.position)" />
  <button @click="viewer.setCamera({ position: [3, 2, 4], target: [0, 1, 0] })">Front view</button>
</template>
```

No `isCustomElement` compiler option is needed: the wrapper renders the
element itself.

**Without a bundler:** the Verse origin serves both wrappers at
`/sdk/react/index.js` and `/sdk/vue/index.js` (CORS-enabled); map the
framework with an import map. Complete pages are in the repository at
`sdk/examples/react.html` and `sdk/examples/vue.html`.

## The REST SDK

`@ctruhtech/verse-sdk` — typed, dependency-free, ESM + CJS, Node 18+ and browsers.
Without npm: `import { VerseClient } from "https://verse.ctruh.com/sdk/verse-sdk.js"`.

### Upload → ready → share

```js
import { readFile } from "node:fs/promises";
import { VerseClient } from "@ctruhtech/verse-sdk";

const verse = new VerseClient({ baseUrl: "https://verse.ctruh.com", token: process.env.VERSE_TOKEN });

const bytes = await readFile("villa.glb");
const done = await verse.publish(bytes, {
  name: "palm-villa",
  resumable: true,                                   // chunked; survives a dropped connection
  onUploadProgress: (p) => console.log(`${Math.round(p.fraction * 100)} % uploaded`),
  onStage: (stage) => console.log("compiling:", stage), // preparing → queued → … → done
});
console.log(done.job, verse.shareLink(done));       // the scene id + its public link
```

`publish()` = `upload()` + `waitForJob()`; call them separately to store
the job id and poll later (`verse.job(id)`). Failures throw `VerseError`
with a friendly `message` and a stable `code`.

### Publish settings

```js
await verse.scenes.setVisibility(sceneId, "private");     // "public" | "unlisted" | "private"
await verse.scenes.setBackground(sceneId, "studio:warm");
await verse.scenes.setDefaultExperience(sceneId, expId); // the tour the link plays
```

### Private links

A private scene answers `404` to everyone but its owner and holders of a
share token. One call mints a token and builds the link; revoking it
kills that link (and every embed using it) and nothing else:

```js
const link = await verse.scenes.shares.link(sceneId);      // { id, shareToken, url, … } — token shown once
sendToClient(link.url);
// later
await verse.scenes.shares.revoke(sceneId, link.id);
```

### Embed code

```js
const { element, iframe, url } = verse.embedCode(sceneId, { share: link.shareToken, autoplayTour: true });
// element: <script src=".../embed.js" async></script>\n<verse-viewer src="…" share="…" autoplay-tour></verse-viewer>
// iframe:  a responsive lazy iframe (for CMSs that strip scripts)
const oe = await verse.oembed(verse.shareLink(sceneId)); // what WordPress / Notion / Slack fetch
```

### Analytics

```js
const a = await verse.analytics.scene(sceneId, { days: 30 });
console.log(a.views, a.uniqueViewers, a.time.medianSeconds, a.funnel);
const all = await verse.analytics.account({ days: 90 });   // + all.scenes[]
const csv = await verse.analytics.sceneCsv(sceneId);       // for a spreadsheet
```

## Webhooks

Register a URL; Verse POSTs to it when a scene you own finishes.

```js
const hook = await verse.webhooks.create({
  url: "https://example.com/verse-hook",
  events: ["scene.ready", "scene.failed"],
});
saveSecret(hook.secret);           // shown ONCE
await verse.webhooks.test(hook.id); // a signed `ping`, right now
```

| Event | `data` |
| --- | --- |
| `scene.ready` | `{ job, scene, status: "done", url, vpkUrl?, stats? }` |
| `scene.failed` | `{ job, scene, status: "error", error, code }` |
| `comment.added` · `version.promoted` · `config.changed` | see [api.md § Webhooks](api.md#webhooks-2-7) |
| `ping` | `{ hook, events }` — only from `webhooks.test()` |

Each delivery is `POST {id, event, t, account, data}` with headers
`X-Verse-Event`, `X-Verse-Delivery`, `X-Verse-Timestamp` and
`X-Verse-Signature: sha256=<HMAC-SHA256(secret, "<timestamp>.<raw body>")>`.
Answer any 2xx within 10 s. Anything else is retried — **3 tries**,
backoff 2 s then 8 s — and every attempt is in the delivery log
(`verse.webhooks.deliveries(hook.id)`, last 50). Hooks and logs persist
with the rest of the server state (`.verse-webhooks.json` on the volume);
ten hooks per account.

### Receiver (Node, Express)

Verify against the **raw** bytes, before parsing:

```js
import express from "express";
import { verifyWebhook } from "@ctruhtech/verse-sdk";

const app = express();
app.post("/verse-hook", express.raw({ type: "application/json" }), async (req, res) => {
  const ok = await verifyWebhook({
    secret: process.env.VERSE_WEBHOOK_SECRET,
    body: req.body,                                   // Buffer
    signature: req.get("X-Verse-Signature"),
    timestamp: req.get("X-Verse-Timestamp"),          // older than 5 min → false
  });
  if (!ok) return res.sendStatus(401);
  const { event, data } = JSON.parse(req.body.toString("utf8"));
  if (event === "scene.ready") await markListingLive(data.scene, data.url);
  res.sendStatus(204);
});
```

Deliveries can repeat (a retry after a slow 2xx): dedupe on
`X-Verse-Delivery`.

### Receiver (any language)

```python
import hmac, hashlib, time
def verify(secret: str, raw: bytes, sig: str, ts: str) -> bool:
    if abs(time.time() - int(ts)) > 300: return False
    want = "sha256=" + hmac.new(secret.encode(), ts.encode() + b"." + raw, hashlib.sha256).hexdigest()
    return hmac.compare_digest(want, sig or "")
```

## Proof

`web/test/fix-verify-devkit.mjs` runs all of the above against a real
server: the element on tier A and tier C in a plain page on another
origin (lazy, responsive, scroll guard, private token, `setCamera` →
`view-change`, `screenshot`, autoplay tour, hotspot, tap-to-load), the
React and Vue example pages, the SDK from upload to revoked link, and a
webhook receiver that fails once (retry, signature, delivery log).
