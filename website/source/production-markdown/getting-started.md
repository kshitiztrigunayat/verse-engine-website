# Getting started — five minutes to a streaming 3D scene

Verse Engine turns a GLB into a URL that streams in the browser — a
283 MB apartment shows its first picture in about 4 seconds over the
internet, and a 30-million-triangle scan runs at over 100 fps on a laptop,
because the viewer fetches a coarse version first and then only the
detail the camera can see. This page is the shortest path from a file
on your disk to a scene on your own site. Every step works on the dev
server (`node web/playground/serve.mjs`, port 8080) and on the production
deployment identically; `HOST` below stands for either.

## 1. Upload a model (≈ 1 minute)

Open the app at `https://HOST/app` and drop a file or choose one — a
`.glb` is the quickest ([everything you can upload](guides/what-you-can-upload.md)).
The file is checked in your browser before anything is uploaded, and you
confirm two things before you press **Publish**:

1. **What is this?** — what the check found (a product, a scan, an
   interior, a building…) and how it will be shown: **Fidelity** for a
   textured product or scan up to about 6 m (published as itself, live in
   about a second — [Fidelity mode](guides/fidelity-mode.md)), **Streamed**
   for interiors, buildings, BIM, point clouds and splats. You can correct
   either.
2. **How should it look?** — a studio look and background for a Fidelity
   product, or the **Lighting** choice for a live-lit streamed scene:
   **Keep as exported** (the default) or **Bake for me** (preview or final —
   [Bake for me](guides/bake-for-me.md)).

Among the advanced options there are two ways to open a file:

| Option | When | What happens |
| --- | --- | --- |
| **Automatic** (recommended) | anything, up to 512 MB (20 GB when [prepared](guides/verse-prepare.md) by a plug-in) | a Fidelity product is published as itself in about a second; anything else the server builds into a streamed scene (a minute or two for products, about twenty minutes for a large building). You watch its progress with a countdown, then walk the scene and get a link |
| **This device only** | small textured products | the GLB opens whole in your browser with full PBR textures; nothing is uploaded and no link is created |

If a build struggles it is retried on lighter settings by itself. A model
(up to 96 MB) that still cannot be streamed is published in
**compatibility mode**: the link works at full quality, as one larger
download.

Draco-compressed, KHR-quantized and WebP/KTX2-textured files are accepted
and normalized server-side. Gaussian-splat captures (`.splat` or 3DGS
`.ply`) upload the same way as models: small ones load instantly in the
browser, larger ones compile into a streamed `.vsp` and hand back a share
link just like a GLB (browsers with WebGPU only; add `X-Verse-Kind: splat`
when using the API directly).

Prefer the API? The same thing from a shell:

```sh
curl -X POST https://HOST/v1/ingest \
  -H "Content-Type: model/gltf-binary" -H "X-Verse-Name: chair" \
  --data-binary @chair.glb
# → {"job":"chair-9f3a01b2c4d5"}
curl https://HOST/v1/ingest/chair-9f3a01b2c4d5
# → {"status":"done","url":"https://HOST/?vpk=ingest/chair-9f3a01b2c4d5.vpk", …}
```

Full protocol, keys and quotas: [Ingest API](api.md).

## 2. Get a share link (≈ 10 seconds)

When the build finishes, the scene opens with its link; **Share** copies
it:

```
https://HOST/app?vpk=ingest/chair-9f3a01b2c4d5.vpk
```

Copy it. Anyone who opens it streams the scene — no account, no install —
in a current browser, on a desktop or a phone
([Browser support](browser-support.md)). The `ingest/<id>.vpk` part is the **scene id** you will
use everywhere else. The file is Ed25519-signed by the server; browsers
verify it and the viewer's status reads "Streaming · verified".

Scenes that get an automatic walkthrough also offer **Tour** and
**Export video** — a client-ready MP4/WebM flythrough of the tour,
recorded and downloaded entirely in your browser (pick duration and
1080p/720p/native; nothing is uploaded).

**Review workflow.** Every share link doubles as a review round: the
viewer offers **Review** once the scene is up. Your client
toggles it on, clicks any spot in the scene (orbit or walk mode alike),
and types a note — the comment is pinned to that exact 3D position, no
account needed. When you open the same link, the numbered pins show
where every note lives; sign in as the scene's owner (with your
email or WhatsApp code, or a Studio token) and each pin grows **Resolve** and **Delete** — resolved pins
grey out and hide behind a "show resolved" toggle. Your Studio scene
cards list open/resolved counts per scene. Comments cap at 500
characters and 200 per scene; on a private scene they are visible only
with the share token or your own sign-in.

Want the link to open for your client only? Sign in, flip the scene to
**private** and mint a per-recipient share token —
[Share privately with tokens](guides/share-privately.md).

Useful URL options in the app: `?model=<glb>` (classic load),
`?vpk=<url>` (stream), `?experience=<manifest>` (see step 4),
`?inspector=1` (devtools panel), `?tier=c` (force the WebGL2 fallback).
Look and performance knobs (`?ssr`, `?hdr`, `?exposure`, `?env`, `?post`,
`?render=demand`, …) are in [Tune quality knobs](guides/tune-quality.md).

## 3. Embed it with one script tag (≈ 1 minute)

Paste this into any HTML page — a CMS block, a product page, a
Notion-style embed. The host page needs **no** header changes: the engine
runs in an iframe served from the Verse origin, which carries the
cross-origin-isolation headers it needs.

```html
<script src="https://HOST/embed.js" data-scene="chair-9f3a01b2c4d5"></script>
```

That is the whole integration. `data-scene="<id>"` resolves to
`ingest/<id>.vpk`; `data-vpk="<url>"` and `data-model="<glb>"` are also
accepted, and `data-poster="poster.jpg"` shows an image until the engine
arrives (and if it never does — ad-blockers, offline — the poster stays).

Programmatic mount, when you want events and control:

```html
<div id="viewer"></div>
<script src="https://HOST/embed.js"></script>
<script>
  const viewer = Verse.embed(document.getElementById("viewer"), {
    scene: "chair-9f3a01b2c4d5",
  });
  viewer.on("ready",  (d) => console.log("tier", d.tier, "first frame in", d.ttfi, "ms"));
  viewer.on("loaded", (d) => console.log(d.clusters, "clusters"));
  viewer.on("dwell",  (d) => analytics.track("3d-dwell", d.ms));
  const hit = await viewer.pick(0.5, 0.5); // what is under the centre pixel?
</script>
```

Every verb and event — `walk()`, `pick()`, `play()`, `spawnProp()`,
`setDepthOfField()`, `goTo()`, `dwell`, `interact`, `signed`, … — is in the
[Embed SDK reference](embed-sdk.md). The typed contract ships as
`verse-embed.d.ts`.

Degradation is automatic and telemetered: browsers with WebGPU get the
full picture; browsers with only WebGL2 (older iPhones, many in-app
browsers) get a lighter build; anything else gets the poster and a link to
open the scene in a browser. The WebGL2 build streams the same scenes,
with the same studio lighting, shadows, bloom and reflection probes (screen-space and ray-traced reflections,
path-traced stills and splats stay WebGPU-only). See
[Browser support](browser-support.md).

## 4. Compose an experience (≈ 2 minutes)

A walkthrough is more than one mesh. An **experience manifest** is a JSON
file on the Verse origin that places extra GLBs into a base scene, sets the
lighting and ambience, and names the hotspots a visitor jumps between:

```json
{
  "name": "Showroom",
  "scene": "ingest/chair-9f3a01b2c4d5.vpk",
  "props": [{ "url": "props/lamp.glb", "position": [1.2, 0, -0.6], "yaw": 30 }],
  "ambience": { "particles": "dust@0,1.5,0*1", "audio": "wind@0,2,0" },
  "spawn": { "position": [0, 1.6, 3], "yaw": 180 },
  "hotspots": [
    { "id": "front", "label": "Front", "position": [0, 1.2, 3], "look": [0, 0.5, 0] },
    { "id": "side",  "label": "Side",  "position": [3, 1.2, 0], "look": [0, 0.5, 0] }
  ]
}
```

Save it as `showroom.verse.json` next to your assets and open

```
https://HOST/?experience=showroom.verse.json
```

The app shows a button per hotspot. In an embed,
`viewer.load("showroom.verse.json")` does the same and `viewer.goTo("side")`
jumps; the `experience` event hands you the hotspot list to build your own
UI. Every key is documented in [Experience manifests](experience-format.md).

Prefer not to hand-write JSON? Open your scene with `&edit=1` and the
**experience editor** authors the manifest live: capture the spawn and
hotspots from where you stand, tap surfaces to place props and ambience,
add more streamed scenes at offsets (the Scenes section — an apartment plus
its clubhouse in one link), record a camera tour (⏺, replayed by `?tour=`
or `viewer.load("….tour.json")` in an embed), and grab a share poster
(📸) for the embed's `data-poster`. Download the JSON or Publish for an
instant share link.

## Where next

- **[Concepts](concepts.md)** — compile, stream, adapt to the device,
  sign: the five ideas behind everything else, in one page.
- **[Help & troubleshooting](help.md)** — links that will not open, a
  browser that stopped the 3D view, slow networks, failed uploads.
- **[Live examples](#/examples)** — the real engine embedded four ways on
  this page: a streamed product scene, an animated GLB, an
  experience with hotspots, Gaussian splats — each beside its snippet.
- **New** —
  [Sign in with a one-time code](guides/sign-in.md) ·
  [Plans and pricing](guides/plans-and-pricing.md) ·
  [Camera paths](guides/camera-paths.md) ·
  [Host a web game](guides/host-a-web-game.md) ·
  [Spatial Bench](guides/spatial-bench.md) ·
  [Verse Home](guides/instant-home.md) ·
  [Floor plan to 3D home](guides/floor-plan-to-3d.md) ·
  [Restyle a space, live](guides/restyle.md) ·
  [Tour together, live](guides/tour-together.md) ·
  [Analytics](guides/analytics.md) ·
  [Embed anywhere](guides/embed-anywhere.md) ·
  [The `<verse-viewer>` element](guides/web-component.md) ·
  [React and Vue](guides/react-and-vue.md) ·
  [Import a scan](scan-import.md).
- **How-to guides** — one task per page:
  [Publish from Blender](guides/publish-from-blender.md) ·
  [Bake for me](guides/bake-for-me.md) ·
  [See it in your room (View in AR)](guides/view-in-ar.md) ·
  [Exteriors: sky, weather, fog, ground](guides/exteriors.md) ·
  [Video on surfaces, sound in the room](guides/video-and-audio.md) ·
  [Unity](guides/publish-from-unity.md) ·
  [Unreal](guides/publish-from-unreal.md) ·
  [Share privately with tokens](guides/share-privately.md) ·
  [Embed the viewer](guides/embed-the-viewer.md) ·
  [Export a flythrough video](guides/export-video.md) ·
  [Collect client review comments](guides/collect-review-comments.md) ·
  [Tune quality knobs](guides/tune-quality.md) ·
  [Run your own server](guides/run-your-own-server.md) ·
  [Monitor production](guides/monitor-production.md) ·
  [Ask Verse, the site assistant](guides/ask-verse.md).
- **[API reference](api.md)** — every route with request and response
  examples, the error contract, rate limits.
