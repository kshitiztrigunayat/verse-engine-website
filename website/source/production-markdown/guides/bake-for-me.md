# Bake for me — cloud lightmapping for live-lit scenes

Verse streams best when a scene is **baked**: every surface carries its
lighting in a texture, the engine draws it unlit, and what the visitor sees
is exactly what the renderer in your DCC produced. Most archviz exports
*are* baked ([publish from Blender](publish-from-blender.md)). Many are not —
a model straight out of a configurator, a BIM export, a quick Blender scene
with a few point lights — and those stream with Verse's live lighting, which
is fast but not a render.

**Bake for me** closes that gap: pick it in the **Lighting** choice on the
upload screen (or send one header) and the server traces the light through your scene into
lightmaps before it compiles, so the link streams with the baked look.

## On the upload screen

Drop a GLB. The preflight shows a **Lighting** choice on every upload, in
plain sight, with three options:

- **Keep as exported** (the default): your file's materials and lights are
  shown live, exactly as they came out of your tool. You can relight the
  scene at any time with **Make it look good** or the Lights and Sun
  panels; nothing is baked.
- **Bake for me · preview**: cloud lightmaps at 1K, a few minutes. A first
  look at the baked style.
- **Bake for me · final**: 2K lightmaps, more samples, up to 20 minutes.
  For the published link.

When the file is live-lit (lights, no lightmaps) the app says so under the
options; when it already carries baked lighting it says baking again is
rarely needed. Pick a bake and upload: the build grows a **Light** stage
(“Baking lighting · lightmap 12 of 40”), then carries on as usual. The
finished link is the baked scene; the result says what the bake did
(“Baked the lighting for you (preview quality): 40 lightmaps, 18.2 M texels
in 6 min; 31 % of the surfaces can't be seen from where a visitor can walk
and were left at a flat ambient level”).

The two bake qualities:

| Preset | Lightmaps | Samples | Budget | When |
| --- | --- | --- | --- | --- |
| **Preview** | up to 1024² per material, 24 M texels scene-wide | 32 per visible texel, up to 256 until the map is clean; 1 indirect bounce | ≤ 10 min | a first look at the baked style, at a fraction of the time |
| **Final** | up to 2048², 96 M texels | 128 per visible texel, up to 1024 until clean; 2 bounces | ≤ 20 min | the hero link, once the model is settled |

**What preview means (2.7.2).** A preview is a *clean* bake at a lower
texel density, never a noisy one. Every lightmap is sampled until the
preset's floor is reached and its grain (the median deviation of a texel
from its neighbours on the same surface) is under 10 %, then an
edge-aware denoiser takes the rest; a lightmap that is still grainy after
that, or that no light reached, is not shipped — that material is shaded
per vertex by the same tracer instead and the result says so. The app
also tells you the samples per texel actually traced ("… 148 samples per
texel, denoised").

Choose **Keep as exported** and the scene is published live-lit, exactly as it came out of your tool.

## From the API and the SDK

```sh
curl -sS -X POST https://HOST/v1/ingest \
  -H "Content-Type: model/gltf-binary" -H "X-Verse-Name: flat-a" \
  -H "X-Verse-Bake: preview" --data-binary @flat-a.glb
```

```js
const { job } = await verse.upload(file, { name: "flat-a", bake: true });   // true = "preview"; or "final"
const rec = await verse.waitForJob(job);
console.log(rec.bake);  // { quality, seconds, texels, lightmaps, hiddenAreaFraction, … }
```

Resumable uploads pass `bake` in the `begin` body. While the job is in
`stage: "baking"` the record carries live counters
(`bake.phase` / `done` / `total`, `workText`); when it is done, the report —
or `bake.skipped` with the reason the scene was compiled live-lit instead
(see below). Full field list: [docs/api.md § Bake for me](../api.md#bake-for-me-2-7).

## What the bake does

1. **Flattens** the scene to world space and decides which materials can
   carry a bake: opaque, lit, not glass, not water or foliage (those keep
   their procedural lanes), not already a lightmap.
2. **Works out what a visitor can see.** The compiler's occupancy grid gives
   the walkable floor; every triangle is shadow-ray tested from eye height
   over that floor. Surfaces nobody can reach a line of sight to — the back
   of a wardrobe, the top of a cupboard, the far side of exterior walls —
   are *hidden*: packed at half the texel density and never traced (they
   get a flat ambient level — half the median lit surface, never black).
   The report's `hiddenAreaFraction` says how much that was; on furnished
   interiors it is typically a third. Two-sided materials (`doubleSided`,
   which most archviz exports set on everything) are first turned to face
   open space: each triangle is probed from both sides and the side that
   sees the room wins, so a chair shell wound inside-out or a wall whose
   slivers point every which way bakes from the room's side, not from
   inside its own geometry (that was the black armchair).
3. **Charts and packs** each material into one square lightmap, sized from
   its visible area and the preset's scene-wide texel budget.
4. **Traces**: the glTF punctual lights (`KHR_lights_punctual`, point and
   spot; directional lights are not carried), emissive surfaces as area
   lights, and — when the file has no punctual lights at all — a sky and
   sun. An *interior* lit that way (an enclosed room with a window: the
   bake measures how much of the surface can see the sky) also gets an
   interior fill — the skylight a one-bounce tracer cannot carry around
   the room, credited to rays that travel a metre or two without hitting
   anything, so corners and under-furniture stay dark and open walls
   light up — instead of metering black and amplifying noise with a ×27
   exposure gain (the production speckle). One or two indirect bounces.
   Progressive passes refine every lightmap to the preset's floor, then
   on while its grain is above 10 %, up to the ceiling or the wall-clock
   budget; big maps first.
5. **Finishes**: a variance-guided, edge-aware denoiser (5 à-trous steps
   guided by each texel's world position, normal and running sample
   variance: grain is smoothed, contact shadows and sun edges are kept,
   charts never bleed), a quality gate (grain still above 6 %, or a map
   the light never reached → that material is shaded per vertex, not
   shipped as a lightmap), the material's own colour texture folded in, a
   metered exposure (the median visible surface lands at mid grey,
   highlights roll off softly, the gain capped at ×8), gutter dilation,
   PNG.
6. **Shades per vertex** what a lightmap cannot carry: cut-out and blended
   materials (plant cards, decals — their holes live in the colour
   texture's own UVs, which a lightmap would replace), meshes finer than
   their lightmap (an 80 k-triangle armchair in a 256² map), and the
   lightmaps the gate refused. The same tracer lights every vertex (both
   sides of a two-sided surface, the brighter wins), the result goes into
   `COLOR_0` and the material becomes `KHR_materials_unlit` with its
   texture and alpha mode intact. A live-lit material would shade black
   in a bake-dominant scene (there are no lights left in a fully-baked
   world), so this is what "kept live" means after a bake.

   One more black-plant cause lives in the file, not the bake: some
   exporters write a `COLOR_0` vertex-colour layer of all zeros on
   meshes that never used one (the reception's plants and armchairs), and
   a vertex colour of black paints the mesh black on every path. The
   loader now drops an all-zero colour layer; a real vertex colour (any
   non-zero channel anywhere) is kept.

The output is an ordinary GLB whose baked materials are emissive-only
(`emissiveTexture` + `KHR_materials_emissive_strength`) — the shape the
compiler already recognises as a lightmap bake — so everything downstream
(streaming, verification, versions, the classic fallback) is
unchanged.

## What it cannot do (yet)

- **Animated or skinned scenes** are not baked (a bake freezes lighting);
  they compile live-lit and the record says `bake.skipped: "the scene is
  animated …"`. The same for scenes that are already baked.
- **Normal maps, roughness and metalness** on baked materials are folded
  into flat diffuse lighting — a brushed-metal kitchen front bakes like a
  painted one. Keep such materials live by exporting them as glass or
  unlit, or bake in your DCC.
- **Charts are box projections**, not an unwrap: a curved surface
  stretches a little across the seam between two projection directions,
  and a spiral stair can self-overlap. Walls, floors, furniture and
  anything built from flat faces are exact.
- **Units**: glTF emissive has no physical unit; emissive 1.0 is taken as
  100 cd/m² (`VERSE_BAKE_EMISSIVE_NITS` on the server). Exposure is
  relative, so only the balance between lamps and emissive panels is
  affected.
- **Two-sided surfaces** are baked from the side that sees open space
  (probed per triangle); a thin wall seen from both sides gets one side's
  light on both.
- **Per-vertex shading** (plants, refused maps, and the densest meshes)
  has no texel-level shadow detail: a leaf is lit as a whole. A
  dense mesh first gets a denser lightmap of its own (up to 4× the
  scene's texels per metre) and only falls back to per-vertex when even
  that cannot hold it.
- **Slatted surfaces** box-project their slat sides into one-texel-high
  charts; they bake correctly but at the density of a texel per slat.

## Operating it

| Knob | Effect |
| --- | --- |
| `VERSE_BAKE=0` | the stage is skipped on this server (the record says so) |
| `VERSE_BAKE_TIMEOUT_S` | the bake's window (default 10 min preview, 20 min final); never more than leaves the compile half of the job clock. The compiler gets a deadline 8 % + 15 s inside it and always returns its best result before it; the window's end is only a backstop kill (then the scene compiles live-lit) |
| `VERSE_BAKE_DEADLINE_S` / `--deadline-s` | (compiler) the whole bake's wall clock; the trace stops early enough for the finish to fit |
| `VERSE_BAKE_GPU=0` | (compiler) never use the GPU tracer; by default it is used whenever an adapter is present (macOS builds always include it; Linux/Windows GPU boxes build with `--features gpu`) |
| `VERSE_BAKE_THREADS` | (compiler) CPU threads for the bake (default: every core) |
| `VERSE_BAKE_PARTS` | (server) force a fleet split into N parts; by default 1 + the bake-capable workers polling, at most 8 |
| `VERSE_BAKE_CACHE=0` | (compiler) trace every bounce exactly (no irradiance cache) — for references |
| `VERSE_BAKE_DENSE_BOOST=0` | (compiler) dense meshes go straight to per-vertex shading (the 3.x behaviour) |
| `VERSE_BAKE_BUDGET_S` / `VERSE_BAKE_TEXELS` | the tracer's wall-clock budget when no deadline is given, and the texel budget (presets: 540 s / 24 M and 1800 s / 96 M) |
| `VERSE_BAKE_EMISSIVE_NITS` | radiance of emissive 1.0 (default 100) |
| `VERSE_BAKE_DENOISE=0` | skip the denoiser (for measuring what it removes) |
| `VERSE_BAKE_GATE=0` | ship every lightmap, noisy or not, and keep dense meshes on lightmaps (inspection only) |

**Faster baking.** The reference interiors bake final quality in
minutes: a new BVH, one shared gather ray per sample, the sun traced once
per texel, an irradiance cache for the bounce, and rounds that sample
every lightmap evenly against a deadline. A Mac (or any GPU box running
the worker) bakes on its GPU; fleet workers each bake a part of the
lightmaps, so adding workers divides the time. `verse-compile
--bake-compare a.glb b.glb` prints how different two bakes look (ΔE76 over
the surfaces a visitor can see), independent of their lightmap layouts.

Locally: `target/release/verse-compile --bake preview in.glb -o baked.glb`
prints the same `progress: bake …` lines the app shows and a
`bake-report:` JSON line; `cargo build --release -p verse-compile` builds it.

Gates: `node web/test/fix-verify-bake.mjs` (ports 8780–8789) — the preflight
detection, the compiler's output shape, the ingest stage and job record,
both tiers' pixels (the wall near the lamp brighter than the far wall, no
black walls, a floor gradient), and the un-baked ladder untouched; and
`node web/test/fix-verify-bake-quality.mjs` (ports 8900–8909) — a sky-lit
room with a window opening, a double-sided cut-out plant card and a
dark-fabric sofa: clean wall and ceiling lightmaps on the shipped PNG, a
lit plant, a non-black sofa, `sppAchieved` on the job record and the
card, plus a real customer reception file as a skip-if-missing case (wall
lightmap variance ≥ 5× lower than the un-denoised bake, the pair written
to `web/test/out/bake-quality/`, plants and armchairs lit per vertex,
preview under 3 min); and `node web/test/fix-verify-fastbake.mjs` (ports
9600–9649) — texel detail on a dense mesh against a 1024-spp reference,
the deadline, byte-identical parts, the reference interiors' times (GPU,
CPU, Railway-emulated) and ΔE76, distributed speedup with 1/2/4 parts,
the fleet protocol with two workers and a tiny job clock.
