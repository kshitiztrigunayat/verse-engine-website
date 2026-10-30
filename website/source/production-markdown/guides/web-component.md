# `<verse-viewer>`: one tag, any page

Put a Verse scene on any page that renders HTML with one tag. The poster paints at once; the 3D engine loads when the card scrolls into view, on tap, or straight away. No headers to set on your site: the engine runs on the Verse origin, inside the card.

**Status:** tested. The element is proven in a real browser on a third-party origin (`web/test/fix-verify-integrations.mjs`: self-registration, lazy / eager loading, live attributes, the `viewer()` upgrade to the embed SDK) and by its unit tests (`sdk/viewer`, `npm test`). The npm package `@ctruhtech/verse-viewer` is built but **not yet published**; until it is, load it from the Verse server as below.

## 1. The tag

```html
<script type="module" src="https://verse.ctruh.com/sdk/verse-viewer.js"></script>

<verse-viewer src="https://verse.ctruh.com/?vpk=ingest/palm-villa-0a1b2c3d4e5f.vpk"></verse-viewer>
```

That is all. `src` is the share link from Studio (Studio → Share, or Studio → Embed for a private scene: the link then carries its share token). Any knob on the share link — `look`, `bg`, `view`, `variant`, `cfg`, `share` — carries over.

The element is `display: block; width: 100%`. Size it like an image: give it a width, or let it fill its column, and the box follows the aspect ratio.

## 2. From npm (bundlers, frameworks)

```sh
npm install @ctruhtech/verse-viewer
```

```js
import "@ctruhtech/verse-viewer/register";          // defines <verse-viewer>; a no-op on a server
```

Or without the side effect:

```js
import { defineVerseViewer } from "@ctruhtech/verse-viewer";
defineVerseViewer();
```

Svelte, Angular, Lit, Astro, Qwik: use the tag directly (Angular: add `CUSTOM_ELEMENTS_SCHEMA`). React and Vue have typed wrappers: [React and Vue](react-and-vue.md).

## 3. Attributes

| Attribute | Values | What it does |
| --- | --- | --- |
| `src` | share link · embed URL · `https://HOST/ingest/<id>.vpk` · `ingest/<id>.vpk` · a scene id | What to show. |
| `scene` | scene id | The same as `src` with a bare id. |
| `server` | origin | The Verse origin. Default: the origin of an absolute `src`, else `https://verse.ctruh.com`. Set it for a self-hosted server. |
| `poster` | image URL | Shown before the engine arrives. Default: the scene's own poster. |
| `loading` | `lazy` (default) · `eager` · `tap` | When the 3D loads: when the card is in view · at once · when tapped. Use `tap` on a page with several scenes. |
| `aspect` | `16:9` (default) · `4:3` · `1:1` · `3:4` · `9:16` · `21:9` | The box's shape. Fidelity products default to `1:1`. |
| `background` | `rrggbb` · `transparent` · `grad:a,b` · `studio:warm` … | The backdrop (the share link's `bg`). |
| `camera` | a saved view name · `overview` | The starting camera (the share link's `view`). |
| `look` / `variant` / `cfg` / `share` | | Look preset · material variant · configurator selection · a private scene's share token. |
| `analytics` | `false` | Count nothing from this embed. |
| `ar` | `false` | Hide the View in AR control (shown by default where the phone can place the scene). |
| `guard` | `false` | The scene takes every gesture at once. Default: a vertical swipe and the mouse wheel scroll your page until the visitor taps or clicks into the scene. |
| `fullscreen` | `false` | Hide the fullscreen button. |
| `title` | text | The frame's accessible name. Default: "<Scene name> — 3D view". |
| `api` | present | Upgrade to the embed SDK as soon as the element connects (section 5). |

Every attribute is live: change it and the card re-renders with the new URL.

```html
<verse-viewer src="…" loading="tap" aspect="4:3" look="studio:warm" analytics="false" title="Villa, living room"></verse-viewer>
```

## 4. Styling

```css
verse-viewer { max-width: 960px; --verse-viewer-radius: 12px; --verse-viewer-background: #0b0d12; }
verse-viewer::part(box) { box-shadow: 0 8px 32px rgba(0, 0, 0, .3); }
```

`--verse-viewer-radius` rounds the card; `--verse-viewer-background` is the colour behind the poster while it loads; `::part(box)` is the sized box around the frame.

## 5. The programmatic API

`element.viewer()` loads `<server>/embed.js` once and replaces the card with the embed SDK's own mount: the full [embed SDK](../embed-sdk.md) (`pick`, `setVariant`, `setConfiguration`, `enterAR`, `exportVideo`, every event). SDK events are also re-dispatched on the element as `verse-<name>` CustomEvents, so a framework can listen without touching the API.

```js
const el = document.querySelector("verse-viewer");
el.addEventListener("verse-load", (e) => console.log("card loaded", e.detail.id));
const viewer = await el.viewer();
viewer.on("loaded", (d) => console.log(d.clusters, "clusters"));
await viewer.setVariant("Oak");
```

Properties: `element.embedUrl` (the URL the card shows), `element.sceneId`, `element.src`, `element.loading`.

Add the `api` attribute to upgrade on connect instead of on the first `viewer()` call; the card's laziness is lost, so use it only where the page exists for the scene.

## 6. Server-side rendering

Importing `@ctruhtech/verse-viewer` or `@ctruhtech/verse-viewer/register` on a server does nothing (there is no `window`). Render the tag with its attributes as HTML and the browser upgrades it when the module runs.

Two helpers for places that cannot run JavaScript (emails, AMP, RSS, a no-JS fallback):

```js
import { renderStaticHtml, buildEmbedUrl } from "@ctruhtech/verse-viewer";
renderStaticHtml({ src, aspect: "16:9" });   // the documented responsive <iframe>
buildEmbedUrl({ src, loading: "tap" });      // the embed URL alone
```

## 7. Self-hosted servers

Point `server` at your origin, or use an absolute `src` from it (`src="https://verse.example.com/?vpk=ingest/<id>.vpk"`): the module itself can be loaded from any Verse server (`<your origin>/sdk/verse-viewer.js`) or from npm. The embed card, the poster, the engine and `embed.js` all come from the server named in `src` / `server`, never from `verse.ctruh.com`.

## Questions

- **Does the element need any header on my site?** No. The engine runs inside the Verse frame. A site that is itself cross-origin isolated (COOP / COEP) works too.
- **Does it count views?** Yes, as *Arrived via: embed* in Analytics, unless `analytics="false"`.
- **Can I use the plain iframe instead?** Yes: Studio → Embed copies it, and `renderStaticHtml()` returns the same markup. The element adds live attributes, the SDK upgrade and the framework wrappers.
- **Which browsers?** Every browser that runs the viewer ([Browser support](../browser-support.md)); the element itself needs custom elements and shadow DOM, which all current browsers have.

See also: [Embed anywhere](embed-anywhere.md) (WordPress, Shopify, Webflow), [Embed the viewer](embed-the-viewer.md) (the iframe and the SDK), [Integrations](../integrations.md) (the full matrix).
