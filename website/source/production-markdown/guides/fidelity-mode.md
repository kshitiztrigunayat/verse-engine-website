# Fidelity mode

A single product renders exactly as exported. A city streams. Fidelity
mode (2.8) is the first half of that sentence: for an upload that is one
object or a small set — a shoe, a chair, a lamp, a hovercar, a scan — the
server publishes the file itself and the viewer shows it the way a plain
glTF viewer would, with the textures and materials you exported, under
studio lighting, in seconds. Nothing in between can lose a texture.

## What happens when you upload

1. **We look at the file before a byte is sent.** The upload screen reads
   the head of the file in your browser — meshes, triangles, textures
   and their sizes, materials, lights, baked or live lighting, the
   model's bounds — and the same classifier runs again on the server
   with the bytes that arrive (`web/playground/asset-class.js`, one
   module, two places, one verdict).
2. **Step 1 — What is this?** The app says what it found in plain
   words ("We found: a product — 1 mesh, 3 textures (2,048²), 404,476
   triangles, PBR materials. We'll show it in Fidelity mode…"), shows the
   evidence as chips, and lets you correct it with one tap: **Product /
   Scan / Interior / Building / BIM / Point cloud** — only the plausible
   ones are enabled — plus **Show as: Fidelity | Streamed**.
3. **Step 2 — How should it look?** A product or scan picks a studio
   environment (**Neutral**, **Warm**, **Dark**) and a background
   (studio, pure white, or a colour). A scene keeps the existing
   **Lighting** choice (keep as exported / bake preview / bake final).
4. **Publish.** One button. Nothing advances or starts by itself.
5. When it is live, the app says what we detected and did ("Shown in Fidelity
   mode: exact textures and materials, studio lighting, no streaming"),
   and the share link opens it: `/view?glb=ingest/<id>.fidelity.glb`
   (`/app?glb=…` for the workspace). Studio shows a **Fidelity** badge
   on the scene.

A textured product is live in about a second (the shoe: 1.8 s from the
click to the link, 0.8 s on the server).

## The rules

| Verdict | Rule | Path |
| --- | --- | --- |
| **product** | one object or a small set: longest side ≤ 6 m, ≤ 10 M triangles after Draco decode, ≤ 48 textures, ≤ 4 GB decoded (fifteen 8K maps), no IFC/USD, no room signature (≥ 40 meshes with ≥ 24 materials and lights or a > 3.5 m extent), not lightmap-baked | **Fidelity** — unless it has no textures and under 50 k triangles: nothing to keep exact, so it streams (seconds) and the app offers Fidelity as the alternative |
| **scan** | one to four dense meshes (≥ 300 k triangles) with one to three textures of ≥ 4096² — or ≥ 800 k triangles in ≤ 2 materials | **Fidelity** while it fits the product caps; a bigger scan is a scene |
| **interior** / **building** | everything else: large bounds, many materials, lightmap bakes, a room's worth of meshes and lights (> 25 m across = building) | **Streamed** (the `.vpk` compiler, level-of-detail geometry and texture streaming) |
| **bim** / **cloud** / **splat** | IFC, USD, point clouds, Gaussian splats | always streamed |

A Fidelity request past the hard caps (over the 512 MB ceiling, more than
20 M triangles or 8 GB of decoded textures) streams instead, and the app
says why ("Streamed instead of Fidelity mode: …").

## What the server publishes

- `ingest/<id>.fidelity.glb` — the upload with its Draco geometry decoded
  and **every texture at its source resolution and format**: a PNG stays a
  PNG, a 4096² map stays 4096². No `verse-prepare` right-sizing, no
  re-encode, no `.vpk` compile.
- `ingest/<id>.fidelity.tex.json` + `ingest/<id>.fidelity.tex` (files
  over 24 MB) — the texture pyramid the viewer streams from; and
  `ingest/<id>.fidelity.phone.glb` past 1.5 M triangles — the phone mesh.
  Sidecars: a plain glTF viewer opens the `.fidelity.glb` without them.
- `ingest/<id>.usdz` — the AR Quick Look package, from the same bytes.
- `ingest/<id>.poster.png` — the poster the viewer attaches on first open.
- The job record (`GET /v1/ingest/<job>`): `path: "fidelity"`, `glbUrl`,
  `classification` (the verdict and its evidence), `look` (the studio
  preset and background you chose), `digest` (`sha256:…`) and `signature`
  (the digest under the server's signing key), `stats { mode:
  "fidelity", tris, meshes, textures, bytes }`.
- Private, unlisted, share tokens, versions and delete work exactly as
  for a `.vpk`: the artifact is a scene file like any other.

The API takes the same road with `X-Verse-Path: fidelity` (or `path` in
the resumable `begin` body); an upload that says nothing streams as it
always has, and the record still carries the verdict so your tool can
decide. The JS SDK: `verse.upload(file, { path: "fidelity", look:
"studio:warm,bg:ffffff" })`.

## What the viewer renders

Fidelity mode is the engine's classic (whole-file) path hardened into a
reference-grade glTF viewer — on WebGPU **and** on the WebGL2 build:

- Metallic-roughness PBR with the Khronos BRDF: GGX / height-correlated
  Smith / Schlick, **multiple-scattering energy compensation**, exact
  sRGB ↔ linear handling, textures uploaded at source resolution with a
  **full mip chain** (box-filtered in linear light) and **16× anisotropic**
  filtering.
- Image-based lighting from a prefiltered environment: GGX specular mips
  (a 256² cube in Fidelity mode) plus **SH9 irradiance**; three studio
  presets (**neutral**, **warm**, **dark-contrast**), generated on the
  device, deterministic. The WebGL2 build lights with its analytic rig
  (the same gradient, the preset as a tint) — no prefiltered cube on that
  tier yet.
- Every extension the loader reads, rendered or not (be honest):

  | Extension | Rendered |
  | --- | --- |
  | `KHR_materials_emissive_strength`, `KHR_materials_unlit`, `KHR_texture_basisu`, `EXT_texture_webp`, `KHR_draco_mesh_compression`, `KHR_mesh_quantization` | yes |
  | `KHR_texture_transform` | yes — per texture, plus one second UV set and the sampler's wrap mode |
  | `KHR_materials_clearcoat`, `KHR_materials_sheen` | yes — factors and every texture (clearcoat normal included) |
  | `KHR_materials_transmission`, `KHR_materials_ior`, `KHR_materials_volume` | yes — screen-space refraction tinted by the base colour, the transmission and thickness textures, per-pixel absorption in world units; an authored IOR sets every dielectric's reflectance |
  | `KHR_materials_specular` | yes — factors and textures |
  | `KHR_materials_dispersion` | yes — one refraction per colour channel |
  | `KHR_materials_variants` | the default variant; `setVariant` switches (classic scenes) |
  | `KHR_lights_punctual` | yes (listed in the Lights panel) |
  | `KHR_materials_iridescence` | yes — thin-film interference, strength and thickness textures |
  | `KHR_materials_anisotropy` | yes — anisotropic GGX + bent-normal environment, strength / rotation / direction texture |
  | vertex colours, alpha MASK / BLEND, double-sided, morph targets, skins, node animation | yes (BLEND through weighted-blended order-independent transparency — not depth-sorted) |

- **Khronos PBR Neutral** tone mapping by default (`?tone=aces` for the
  filmic curve), 4× MSAA (or TSR with `?temporal`), a soft **contact
  shadow** under the model (`?contact=0..1`, default 0.6, WebGPU), auto
  framing from the model's bounds, orbit controls with a slow turntable
  until the first interaction (`?turntable=0` holds the authored yaw;
  walking is still there for anything over 4 m).
- Share links keep the look: `/view?glb=…&look=studio:warm,bg:ffffff`;
  `?env=neutral|warm|dark` and `?bg=` on the link still win.

## Measured

`web/test/fidelity-gltf.mjs` renders the Khronos glTF-Sample-Assets set
(DamagedHelmet, FlightHelmet, SciFiHelmet, BoomBox, WaterBottle, Corset,
Lantern, ToyCar, MaterialsVariantsShoe, ClearCoatTest, TransmissionTest,
IridescenceLamp) plus a real customer shoe model in Fidelity mode **and** with
a pinned reference renderer at the same camera, the
same environment (the engine's neutral studio radiance handed to the reference
as a float equirect), the same tone curve and backdrop, then compares
ΔE2000 over the model's pixels. The gate: mean ΔE ≤ 6 on the core-PBR set
and ≤ 10 on the extension set (WebGL2: +3), a texture-detail ratio ≥ 0.5
(no clay), mean luminance ≥ 0.03 (no black), no console errors, both
backends; then the upload path end to end.

## Larger products

A furniture catalogue piece with a 4K–8K texture set, a car, a watch with
a 5 M-triangle mesh: previously anything over 96 MB could not be held whole
in a browser, so it streamed through the `.vpk` compiler and lost the
exact look. Now a Fidelity product of any size up to the 512 MB upload cap
loads **progressively**, and the full-quality frame is the one the 2.8
viewer rendered.

**On publish.** Past 24 MB (`VERSE_FIDELITY_STREAM_MB`) the server runs
`verse-prepare --fidelity-pyramid` on the published GLB and writes, beside
it, a **texture pyramid**: every texture at half, quarter, … of its source
down to 128 px (`<id>.fidelity.tex`, each level a complete JPEG or PNG —
JPEG q92 for colour maps without alpha, PNG for data maps and anything
≤ 256 px) and a manifest (`<id>.fidelity.tex.json`: where the GLB's JSON
chunk, each image's bytes and every geometry buffer view sit, which images
are colour / extension-packed / alpha, and the levels). The levels are
written tier by tier from the smallest, so "every texture at its smallest
level" is one byte range. A PNG level is the pixels the viewer's own
capped decode would produce (the same `image` crate call), so the slots
the renderer caps anyway — the extension textures at 2048² on desktop —
are bit-identical. Past 1.5 M triangles (`VERSE_FIDELITY_PHONE_TRIS`) the
server also writes `<id>.fidelity.phone.glb`: the same materials and image
indices, textures stripped to one 1×1 placeholder, the mesh
meshopt-simplified (borders locked, normals and UVs steering the collapse)
under an error that starts at 0.05 % of the model's size and doubles until
the mesh is under the cap. Desktops never see it. The pyramid for a 15 ×
8K set takes about 7 s; the job settles after it, so the first viewer
already streams. A product under 24 MB publishes exactly as before — no
sidecars, the same bytes, the same load.

**In the viewer.** `?glb=ingest/<id>.fidelity.glb` hands the URL to the
render worker, which asks for the manifest. Without one (a small product,
an older publish) it fetches the file whole, as 2.8 did. With one:

1. **First view** — the GLB's JSON chunk, every non-image buffer view (the
   geometry; on a phone with a phone mesh, that file's geometry instead) and
   the smallest level of every texture, by Range requests coalesced across
   small gaps, four in flight; repacked here into one small GLB the engine
   loads exactly as any other (same loader, same materials, same image
   indices). Images a material extension packs load at the renderer's cap
   (2048 desktop / 512 phone) in this phase, so those slots match today's
   capped decode from the start.
2. **Refine** — each texture once, colour maps first, to one final tier
   for the whole set: the **source bytes out of the GLB** on desktop class
   when they fit the renderer's memory budget (1.5 GB on tier A), else the
   largest pyramid tier that does; on phone class (tier B, tier C phones,
   in-app browsers) the largest tier under the 256 MB budget with 32 MB
   kept free, never past 2048². `refine_texture` decodes the bytes exactly
   as a load decodes a Fidelity texture (source resolution, Lanczos3 cap at
   8192) and re-uploads with the same mip chain; WebGPU rebuilds the
   materials' bind groups, WebGL2 refills the shared texture object. One
   load per texture, no eviction, no level swaps, and nothing is fetched
   after the last texture lands — orbiting a finished product makes zero
   requests. A GPU recovery (the engine reloads the first-view GLB from its
   cache) refines again, once.

The worker posts `fidelity-stream` messages (`first-view`, `refine` ×n,
`complete`: bytes, `firstViewMs`, `fullMs`, the tier and the level each
image ended at), the status line counts the sharpening, the result
says "first view … · sharpening to source resolution", and the HUD's stats
carry `fidelity`. `?fidstream=0` forces the whole-file load (the reference
the gate compares against).

**GPU-compressed textures.** Every image in the pyramid also carries a
UASTC mip chain (`.basis`, capped at 4096², the streamed path's encoder).
The decode pool transcodes it to what the device has — BC7 on desktops,
ASTC or ETC2 elsewhere — and the renderer uploads the chain as is, one
byte per texel plus mips: a quarter of RGBA8. A product takes its source
bytes when they fit the budget (the whole-file frame, ΔE 0) and the
compressed chains when they do not (`helmet-8k`: 15 × 8K shown at 4096²
compressed instead of RGBA8 4096²); a room always takes them.

**Single-room interiors.** A room-sized interior — one storey (≤ 6 m
high), ≤ 20 m across, ≤ 2 M triangles, ≤ 128 textures, ≤ 2 GB decoded,
under 100 MB — is flagged `roomFidelity` by the classifier. It streams as
always (that is what phones load: the one-time fit-mode load), **and** the
server publishes it as itself beside the `.vpk` (`<id>.fidelity.glb` +
the pyramid, seconds, before the minutes-long compile). From the same
`?vpk=` link a desktop-class device (tier A, tier C desktop) opens the
room in Fidelity: the render worker finds the manifest beside the `.vpk`
and loads the room progressively — geometry and every texture at ≤ 128 px
first, then each texture's compressed chain at the largest size the
set holds under 320 MB of texture memory — with the exact materials, no
atlas, no cluster cut, sharp from the first view; staging (`stage.json`
spawn, walk mode) and the floor plan work as before because the scene id
is the `.vpk`'s. A phone streams the same room in the same tone curve the
desktop's Fidelity road shows (Khronos PBR Neutral), so the link looks the
same on both. `?roomfid=0` keeps the streamed road and today's curve on
any device (the comparison baseline). A customer reception (48 MB, 96 textures,
14.8 m) is the gate's case, compared with a reference viewer
page.

**Honest limits.** Textures are RGBA8 on the exact path, so what fits
uncompressed is what a GPU holds: five 8K maps are 1.3 GB at level 0.
Compressed chains are capped at 4096² and are lossy (UASTC, pack level 1
— the streamed path's quality); a product that fits as RGBA8 never takes
them. Phones never take the compressed chains on this path yet (they
hold RGBA8 at ≤ 2048²; rooms stream on phones).
Geometry is not streamed: a desktop fetches the full mesh before the first
view (a 6 M-triangle product is 211 MB of geometry — about 90 s on a
20 Mbit/s line), and a phone the phone mesh. A product whose full set fits
the budget (the chess set, a 4K helmet) renders the 2.8 frame at full
quality — measured ΔE2000 against the whole-file load in
`web/test/fix-verify-bigfidelity.mjs`.

## Background

What sits behind the model is an owner setting, a link knob and an embed
verb — one spec string everywhere:

| Spec | Meaning |
| --- | --- |
| `rrggbb` | a solid colour, exact (the engine's sky pass paints it) |
| `transparent` | nothing — the host page shows through (embeds) |
| `grad:rrggbb,rrggbb` | a vertical gradient, top → bottom |
| `studio:neutral` · `studio:warm` · `studio:dark` | one of the studio environments as the backdrop; it lights the model too |
| `image:ingest/<id>.bg.jpg` | an uploaded picture (`.jpg`/`.png` ≤ 20 MB), cover-fit, backdrop only |
| `hdr:ingest/<id>.bg.hdr` | an uploaded Radiance `.hdr` (≤ 20 MB): the backdrop **and** the image-based lighting |

- **Owners**: the **Background** chip in the stage chrome (signed in) —
  six presets including pure white and the indigo-slate default, a colour
  picker, a two-colour gradient, the three studio environments, and a
  picture/HDR upload. Saved as the scene's `<id>.bg.json` sidecar
  (`PUT /v1/scenes/<id>/background`, `PUT …/background/image`) under the
  scene's own visibility and delete rules, and replayed for every visitor
  on both backends.
- **Links**: `?bg=` on any share link wins over the saved one.
- **Embeds**: `bg` in the options (`"transparent"` when your page wants
  its own), `viewer.setBackground(spec)`, `viewer.getBackground()`, the
  `background` event.
- Honest limits: a gradient, a picture and `transparent` are drawn by the
  page behind a canvas created with an alpha surface, so switching to one
  of them on a page that opened opaque reloads the page once; `.exr` is
  not read yet (upload an `.hdr`); the WebGL2 build ignores an uploaded
  HDR (its lighting stays the analytic studio rig).
