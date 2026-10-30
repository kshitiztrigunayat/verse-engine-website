# Integrations

Every way to get a scene into Verse or a Verse scene onto a page, in one table: the platform, how the integration works, and how far it has been proven.

**How to read the status column**

| Status | Meaning |
| --- | --- |
| **tested** | proven end to end by a gate in this repo against a real server (and, where it applies, a real browser) |
| **validated** | the code parses, type-checks and builds, and its schemas are checked, but it has not yet run on the live platform |
| **skeleton** | the shape is there; expect a first-run fix on the live platform |
| **listing pending** / **npm publish pending** | built and tested, and works today by hand (paste, upload, private install), but the public store listing or npm package is not published yet — see the per-row note |
| **in progress** | being built on a separate branch; not in this release |

## Embed on a page

| Platform | Method | Status | Guide |
| --- | --- | --- | --- |
| Any HTML page | `<verse-viewer>` web component (`<origin>/sdk/verse-viewer.js`) | tested · npm publish pending (`@ctruhtech/verse-viewer`) | [`<verse-viewer>`](guides/web-component.md) |
| React (Next.js, Remix, Gatsby) | `@ctruhtech/verse-react` wrapper, SSR-safe | tested · npm publish pending | [React and Vue](guides/react-and-vue.md) |
| Vue 3 (Nuxt 3) | `@ctruhtech/verse-vue` wrapper + plugin, SSR-safe | tested · npm publish pending | [React and Vue](guides/react-and-vue.md) |
| Svelte, Angular, Lit, Astro, Qwik | the web component directly | tested (same element) | [`<verse-viewer>`](guides/web-component.md) |
| Any HTML page | the plain iframe from Studio → Embed; oEmbed (`/oembed?url=`) | tested | [Embed anywhere](guides/embed-anywhere.md) |
| WordPress | plugin (auto-embed, `[verse]` shortcode, block), uploadable zip | tested (plugin checks + server gate) · WordPress.org listing pending | [Embed anywhere](guides/embed-anywhere.md) |
| WooCommerce | the same plugin 1.1.0: product panel, 3D view tab, gallery replacement, `[verse_product]`, REST / Store API fields | validated · not yet run on a live store | [Sell with WooCommerce](guides/sell-with-woocommerce.md) |
| Shopify | theme app extension (product-page block, per-product metafield) | validated · Shopify app listing pending | [Embed anywhere](guides/embed-anywhere.md) |
| Webflow | Code Embed recipe | tested (snippet) | [Embed anywhere](guides/embed-anywhere.md) |
| Wix | Embed HTML element; Velo page code + HtmlComponent | validated · snippet tested on a host page · not yet run on a live site | [Embed in Wix](guides/embed-in-wix.md) |
| Squarespace | Code block snippet | validated · snippet tested on a host page · not yet run on a live site | [Embed in Squarespace](guides/embed-in-squarespace.md) |
| BigCommerce | Page Builder widget template + Stencil partial | validated · snippet tested on a host page · widget registered per store by hand | [Sell with BigCommerce](guides/sell-with-bigcommerce.md) |
| Framer | code component with property controls | validated (`tsc`) · snippet tested on a host page · not yet run inside Framer | [Embed in Framer](guides/embed-in-framer.md) |
| Magento / Adobe Commerce | module (product attribute, block, template) | skeleton · needs a 2.4 test install | [Sell with Magento](guides/sell-with-magento.md) |
| Ghost | paste the link (oEmbed discovery) or an HTML card | validated · snippet tested on a host page · discovery tags tested on the server | [Embed in Ghost and HubSpot](guides/embed-in-ghost-and-hubspot.md) |
| HubSpot CMS | Embed module, or the custom HubL module (`hs upload`) | validated · snippet tested on a host page · not yet run on a live portal | [Embed in Ghost and HubSpot](guides/embed-in-ghost-and-hubspot.md) |
| Elementor, any page builder | paste the HTML from Studio → Embed into the HTML block | tested (plain iframe) | [Embed anywhere](guides/embed-anywhere.md) |

Every embed is the same poster-first card underneath: nothing of the engine downloads until the card is in view (or tapped), and views count as *Arrived via: embed*.

## Automate

| Platform | Method | Status | Guide |
| --- | --- | --- | --- |
| Zapier | Platform CLI app: triggers `scene.ready` / `scene.failed` / `comment.added`, actions upload-from-URL + share link, search analytics | validated (schema, `zapier validate`, app tester against a mock) · Zapier listing pending | [Automate with Zapier](guides/automate-with-zapier.md) |
| Make (Integromat) | custom app: base, API-key connection, dedicated webhook, modules | validated (structure) · Make app listing pending | [Automate with Make](guides/automate-with-make.md) |
| n8n | community node package `n8n-nodes-verse` (Verse + VerseTrigger with HMAC verification) | validated (`tsc`, build, manifest, signature self-test) · npm publish and n8n verification pending | [Automate with n8n](guides/automate-with-n8n.md) |
| Any language | the REST API: token, upload or upload-from-URL, poll or webhook, share link, analytics | tested | [REST client round trip](guides/rest-client.md) |
| JavaScript / TypeScript | `@ctruhtech/verse-sdk` | tested · npm publish pending | [JS / TS SDK](sdk.md) |
| GitHub Actions | the SDK's example workflow (`sdk/examples/`) | tested | [JS / TS SDK](sdk.md) |

## Publish from a tool

| Tool | Method | Status | Guide |
| --- | --- | --- | --- |
| Blender | add-on / extension (`verse_publish`) | shipped — verified in Blender 5.0.1 | [Publish from Blender](guides/publish-from-blender.md) |
| Unity | package `com.ctruh.verse-publish` | shipped — verified in Unity 6000.6.5f1 (Built-in, URP, HDRP) | [Publish from Unity](guides/publish-from-unity.md) |
| Unreal | plugin `VersePublish` | shipped — verified in Unreal Engine 5.8.3 | [Publish from Unreal](guides/publish-from-unreal.md) |
| IFC / USD | upload the file as it is | tested | [Publish from IFC or USD](guides/publish-from-ifc.md) |
| FBX / OBJ | upload the file (or a zip with its textures) | tested | [Upload FBX and OBJ](guides/upload-fbx-obj.md) |
| SketchUp, Rhino, 3ds Max, Revit, ArchiCAD | plug-in exports a GLB from inside the tool | beta (4.0.0-beta.1) — the upload core is tested against a real server; not yet run inside the host apps; each guide says what still needs a real install | [SketchUp](guides/publish-from-sketchup.md) · [Rhino](guides/publish-from-rhino.md) · [3ds Max](guides/publish-from-3dsmax.md) · [Revit](guides/publish-from-revit.md) · [ArchiCAD](guides/publish-from-archicad.md) |
| Maya, Cinema 4D, Houdini, SolidWorks, Figma, Spline | plug-in exports a GLB from inside the tool (SolidWorks and Figma: skeletons; Spline: export a GLB and upload it; Figma: inserts a Verse link) | beta (4.0.0-beta.1) — tested against fake hosts and a real server; not yet run inside the host apps | [Maya](guides/publish-from-maya.md) · [Cinema 4D](guides/publish-from-cinema4d.md) · [Houdini](guides/publish-from-houdini.md) · [SolidWorks](guides/publish-from-solidworks.md) · [Spline and Figma](guides/publish-from-spline.md) |
| Phone / tablet LiDAR and capture apps, 3D tour export bundles, laser scanners | Import a scan (USDZ, GLB, OBJ zip, PLY, E57, XYZ / PTS, LAS / LAZ, a tour bundle's zip, splat PLY) | tested | [Import a scan](scan-import.md) |

## What is tested where

- `web/test/fix-verify-integrations.mjs` — the web component, React and Vue in a real browser on a third-party origin; the REST round trip with a real webhook delivery; the upload-from-URL guard (units + live); every `integrations/embeds/*/snippet.html` on a host page; the embeds and automation check suites; this page and every guide above.
- `web/test/fix-verify-embeds.mjs` — oEmbed, link unfurls, laziness, the COEP host, the plug-in checks, the Studio panel.
- `node integrations/embeds/check.mjs` — PHP parses, JSON schemas, the Framer component type-checks, the plugin zip builds.
- `node integrations/automation/check.mjs` — the Zapier schema and app tester, Make's structure, the n8n build and signature check.

Store listings and npm packages are not published yet; until they are, every integration above installs by hand from this repository.
