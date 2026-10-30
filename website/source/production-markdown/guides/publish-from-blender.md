# Publish from Blender

> **Status: verified on Blender 5.0.1 (Apple silicon), 2026-10-13** — installed
> as an Extension, published a textured scene from the N-panel (export →
> bundled verse-prepare → upload → compile → link shown and copied), the
> link rendered textured, and a dead server shows a plain-language error.
> Bake-on-publish verified 2026-10-13 on the same build (proof room,
> Blender Classroom, Barcelona Pavilion and Lone Monk, headless; the earlier
> Draft/High pipeline also in the editor).

One click in Blender's N-panel exports your scene as GLB, uploads it to a
Verse server and hands back a streaming share link. The add-on is
stdlib-only Python (no pip), speaks the public [ingest API](../api.md), and
is machine-tested end to end inside a headless Blender
(`web/test/fix-verify-blender.mjs`).

**You need:** Blender 4.2 or newer, and a Verse server URL (the hosted
service is the default; your own deployment works identically).

## 1. Install the add-on

### Download

Download **[verse_publish-blender-3.0.0.zip](https://verse.ctruh.com/downloads/verse_publish-blender-3.0.0.zip)**
(3.0 MB) from the [downloads page](https://verse.ctruh.com/downloads). It
bundles verse-prepare for macOS (Apple silicon and Intel), Windows and
Linux. Check it before installing:

```sh
shasum -a 256 verse_publish-blender-3.0.0.zip   # Windows: Get-FileHash verse_publish-blender-3.0.0.zip -Algorithm SHA256
# 2ff2dd7074cf3073b0e68e78af5ee2dcb6047b701824a84e8823930f0ba4f545
```

Then in Blender: **Edit ▸ Preferences ▸ Get Extensions ▸ ⌄ (top right) ▸ Install from Disk…** and pick the zip (or drag it onto the Blender window). No restart is needed. (Blender's
legacy path — *Add-ons ▸ Install…* with the same zip, then enable
"Verse Publish" — also works.)

Building from source instead: `python3 integrations/blender/make_extension.py`
(drop the four verse-prepare binaries in `integrations/bin/` first;
`scripts/build-plugins.sh` builds every plug-in plus `SHA256SUMS`).

## 2. Point it at a server (optional)

**Edit ▸ Preferences ▸ Add-ons ▸ Verse Publish**:

| Preference | What it does |
| --- | --- |
| **Server URL** | Defaults to the hosted service. Set your own origin when you [run your own server](run-your-own-server.md). |
| **Account token** | Optional. With a token the published scene is **account-owned** — permanent, listed in `/studio`, and you draw from the per-token rate bucket (20 uploads/hour) instead of the shared per-IP one (6/hour). Create the token once in `/studio`; it is shown a single time. |
| **Bake quality note** | Toggles the in-panel reminder to bake hero lightmaps at 4K. The exporter never downscales textures; the pipeline keeps up to 4096² on its hero tier, and base colour above 4096 at full detail through virtual texturing. |

## 3. Publish

1. Press `N` in the 3D viewport and open the **Verse** tab.
2. Set a scene name (defaults to the `.blend` file name) and, if you only
   want part of the scene, tick **Selected objects only**.
3. Click **Publish scene**.

The panel walks through **export → prepare → upload % → compile stage → done**. The
compile stage is the server's own live `stage` text (`textures`,
`geometry`, `packing`), so the progress is honest. Esc or **Cancel**
aborts at any point. When it finishes, the link is on your clipboard and
the panel offers **Copy link** and **Open in browser**.

The add-on publishes a **streamed** scene; with
[Bake materials & lighting](#bake-materials-lighting-bake-on-publish) on
(the default for scenes) your node materials — and at High your lighting —
are baked first. To publish a small textured product in
[Fidelity mode](fidelity-mode.md), or to have the server
[bake the lighting](bake-for-me.md), upload the exported GLB in the app
and choose it on the upload screen.

Server errors (storage full, quota, rate limit, timeout) are shown
**verbatim** — they are written to be actionable. Anything that arrives
without the `X-Verse-Error` header came from the network edge, not the
app, and the add-on retries it once on its own.

## Bake materials & lighting (bake-on-publish)

glTF carries one material model — metallic-roughness PBR with plain image
textures — and no lighting. Anything richer in your scene (procedural
textures, Mix/Add shader layers, node groups, colour ramps, vertex-colour
masks, the Cycles lighting you tuned) is reduced by the exporter to whatever
it finds on the first Principled BSDF, so it arrives flat or grey. The
add-on can bake all of that in Blender, where the real shaders exist, right
before the export:

| Panel setting | |
| --- | --- |
| **Bake materials & lighting: Auto / On / Off** | Auto is **on for scenes** (6+ objects, 2+ lights or ≥ 3 m across) and **off for a single product**; the panel says in one line what it chose and why (`Auto: Draft bake — 178 objects: a scene`, `Auto: off — a single product (1 object, 0.4 m) exports as is`). |
| **Quality: Draft / High** | **Draft** (the default) bakes materials only and sends the lights live — seconds. **High** also bakes the **lighting** with Cycles into shared lightmap atlases. |

**What Draft does.** Every material that is not already "Principled + image
textures" is rendered to textures with Cycles: base colour (+ alpha),
metallic/roughness, normal (tangent space; displacement is evaluated as bump
into the normal map) and emission. The shader graph is evaluated through an
*emission proxy* — a copy of the tree in which every BSDF is replaced by an
Emission shader fed by the input of interest — so layered materials bake to
exactly the mix you built. Materials that depend on UVs only are baked as
**one UV tile** on a temporary quad (tiling floors stay tiled, nothing is
unwrapped); materials using Generated/Object coordinates, procedural
textures or vertex colours get a temporary **VerseBake** UV map (smart
project, every user of the material packed into one square). Area lights,
which glTF cannot carry, travel as 180° spot lights of the same peak
intensity.

Draft is built to cost about as much as the export itself:

- materials with the **same node graph** (`Wood`, `Wood.001`, the copies an
  asset-library append makes) are baked once;
- a material is baked on **one object per mesh** — instances share the
  mesh's layout, so 300 instanced chairs are one bake, not 300;
- texture size follows the **unique** surface (256 px/m), capped at
  **512 px**: below 1024 px Verse carries a material in its atlas (fast to
  compile), and there normal and metallic/roughness maps are not shown, so
  those passes are skipped or folded into a mean value instead of baked;
- PNGs are encoded on all cores.

**What High adds.** Every visible mesh gets its own evaluated mesh with a
temporary **VerseLightmap** UV; the objects are packed into shared **4K
atlas pages** at one texel density (200 px/m, scaled down evenly if the
scene would need more than four pages) and each page is baked through one
merged copy of its objects — one Cycles scene sync per page instead of one
per object. Cycles bakes the COMBINED light (direct + indirect + emission,
through your real shaders) at 64 samples on the GPU, the page is
**denoised** (OpenImageDenoise) and goes through the scene's **view
transform** (AgX / Filmic / Standard, look and exposure — what you saw in the
render; a compositor's overall brightness is measured from two small
renders of the camera and folded in), and each object is exported with its
page's emissive-only `<page>_Baked` material — the shape Verse recognises
as a bake and shows unlit. Cut-outs keep their holes (their alpha is baked
into the same cells, on pages of their own), objects without a material get
Blender's default surface, and the lights are not exported (they are in the
bake). Instances of one scatter (a forest of the same tree) share one cell.

**Both qualities:**

- **Window glass stays live.** Glass / Refraction BSDFs, Principled
  transmission and the classic Transparent + Glossy "architectural glass"
  are never baked: they travel as a transmissive Principled
  (`KHR_materials_transmission`), so the view through a window is the
  published scene behind it — a baked pane is a picture of its surface, and
  it came out dark.
- **Objects the camera never sees** (Object ▸ Visibility ▸ Ray Visibility ▸
  Camera off — light portals, fill cards) light the bake but are not
  published (Verse would draw them).
- **Big particle scatters** (pebbles, grass, a forest) are merged before the
  export, within a 2 M-triangle budget: high-poly sources are decimated
  first (never below 64 triangles), then the instances are thinned evenly;
  up to 400 instances become one object each sharing one mesh, more are
  merged per grid cell. Without this the glTF exporter spent over ten
  minutes on Barcelona's 20,000 instances. This also applies with the bake
  **off**. `VERSE_SCATTER_MTRIS` changes the budget.

**Nothing in your file changes.** Linked library instances, collection
instances and curves/text are realised as temporary local copies; materials
are swapped through object-linked slots (and, on objects with modifiers,
the temporary mesh's own slot, which is what the exporter reads); every UV
map, image, mesh, material, helper object and the throw-away bake scenes are
removed and every slot, mesh, modifier and visibility flag put back after
the export — also on error or Esc. The panel shows
`Baking materials 12 / 48` / `Baking lighting: atlas 3 / 6 (876 / 891
objects)`, Esc cancels between steps, and when the publish is done it shows
what the bake did (`lighting baked on 891 objects (6 atlases), glass live,
6 textures, 71.6 s`). Scripts read the same as JSON from
`scene.verse_publish.bake_report`, including per-phase seconds (`phases`).

**Measured (2026-10-13, Blender 5.0.1, Apple M5 Pro, local server)** —
publish = click to live link (export, verse-prepare, upload, compile);
ΔE2000 between the editor's Cycles render from the scene camera and the
published Verse link from the same pose (mean over the frame; lower is
closer), see `integrations/bake-proof/`:

| Scene | Bake off | Draft | High |
| --- | --- | --- | --- |
| **Blender Classroom** (894 objects after instancing, 78 node materials, linked asset libraries, 0.6 M triangles) | ΔE 21.5 · 6.4 s | **ΔE 15.4** · **9.3 s** (bake 2.8 s) — was ΔE 15.7 · 36 s (bake 29 s) | **ΔE 8.9** (median 7.0, SSIM 0.76) · **90 s** (bake 66 s) — was ΔE 13.9 · 689 s (bake 656 s) |
| **Barcelona Pavilion** (sunset sky, water, glass, 20,638 particle instances = 55 M triangles of pebbles, lotus and trees) | ΔE 33.8 · 23 s (compatibility mode — see below); before the scatter merge the export did not finish in 15 min, in any mode | **ΔE 24.1** · 236 s (bake 34 s) | **ΔE 15.2** · 219 s (bake 37 s) |
| **Lone Monk** (1,268 meshes, 5.7 M triangles, Filmic −2 EV + an exposure compositor, grass/bush particles) | ΔE 25.2 · 24 s | **ΔE 23.8** · 45 s (bake 22 s) — was ΔE 23.8 · 2,038 s (bake 2,001 s) | **ΔE 20.4** (median 11.7) · 131 s (bake 96 s) |

The publish times for Barcelona and Lone Monk are mostly the server's
compile of millions of triangles, not the bake. Barcelona's bake-off export
is published in compatibility mode because the server's output check
rejects the plain export's bounds (the baked exports, whose collection
instances are realised, stream); Barcelona and Lone Monk are captured with an orbit camera
(`compare.mjs --orbit`) because the walking camera snaps to eye height.
Proof images: `Verse-Bake-On-Publish-Proof/blender-v2/`.

**Limits.** Draft fixes the *materials*; the lighting is still Verse's own,
so on a lighting-dominated frame its ΔE stays near the bake-off export —
High carries the lighting. Lightmaps are diffuse pictures: reflections and
anything view-dependent (Fresnel/Layer Weight mixes, glossy sheen) bake as
seen along the surface normal. Materials that read per-object randomness
(Object Info ▸ Random) bake one variant per mesh, and merged scatter
instances share one. The compositor's glare, masks and lens effects are
screen-space and are not baked (only its overall brightness is). Displaced
geometry travels as the undisplaced mesh with a normal map. Glass shows what
the *published* scene has behind it — the world sky is not exported, so a
window onto it shows Verse's daylight backdrop. High holds the whole scene
twice while it bakes (originals plus a merged page): peak memory was
8.8 GB for the whole Lone Monk proof run (reference render and three
publishes in one Blender). Geometry-nodes meshes that drop custom UV maps fall back to their
existing UVs.

## The prepare step (2.3)

Between export and upload the plug-in runs **verse-prepare** on the GLB:
textures are right-sized to the texel density the scene can show (default
2048 px/m — one texel per screen pixel at arm's length), opaque base colour
goes to JPEG 92 (everything else stays lossless), duplicate meshes are
instanced and unreferenced data is dropped. The panel shows the tool's own
progress and result. Prepared files may be up to **20 GB**; without the tool,
exports under 512 MB upload as they are (the server prepares them losslessly)
and larger ones stop with the install hint. Preferences: prepare on/off, the
binary path, texels per metre, lossless. Details, flags and how the binaries
are bundled: [verse-prepare](verse-prepare.md).

## What gets exported

- GLB, modifiers applied, +Y up.
- Textures embedded at **source resolution** by the exporter; the prepare
  step then right-sizes them to what the scene can show (never upscaled).
- Draco off (the server ingests raw GLBs and normalizes compressed inputs
  anyway).
- Files over 100 MB use the [resumable upload](../api.md#resumable-uploads)
  flow automatically, so a flaky connection resumes instead of restarting.
- One automatic retry on transient network/edge failures; a 30-minute total
  budget, matching one server compile attempt (30 min; a build's whole wall
  clock is 45 min).

## Baking tips for archviz

Fully-baked exports (emissive lightmaps, no live lights) stream
**bit-faithfully**: the engine's ground-truth harness measures the streamed
render against Blender's own EEVEE output and gates at a 64×64 mean ΔE76
below 6 per view (`web/test/fidelity.mjs`). For that path to shine:

- Bake lightmaps at 4K for hero surfaces (floors, feature walls); the
  compiler keeps the top 12 materials at 4096² by default
  (`VERSE_HERO_TEXTURES`, `VERSE_HERO_DIM`), and streams base
  colour larger than 4096 (8K, 16K) at full detail through virtual
  texturing (`?vt=0` shows the old path).
- Keep lightmaps as PNG or uncompressed in the GLB — the pipeline encodes
  lightmaps with UASTC in every path precisely so banding never appears.
- Scenes with live lights still look right (the lit path is gated against
  EEVEE too — see [Concepts](../concepts.md#fidelity-two-paths)), they just
  cannot match a bake pixel for pixel.

## Headless test

```sh
node web/test/fix-verify-blender.mjs       # spawns serve.mjs + blender --background (incl. bake-on-publish)
# editor-vs-link proof on any .blend (renders the camera, publishes off / draft / high, measures ΔE):
blender --background scene.blend --python integrations/bake-proof/blender_proof.py -- --server http://localhost:8970 --out out --tag scene
node integrations/bake-proof/compare.mjs out/scene.json
```

## Next

- [Share privately with tokens](share-privately.md) — client-only links.
- [Collect client review comments](collect-review-comments.md) — pinned
  notes on the link you just published.
- [Embed the viewer](embed-the-viewer.md) — the same scene on your site.
