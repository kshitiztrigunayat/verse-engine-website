# Publish from Unity

> **Status: verified on Unity 6000.6.5f1 (Apple silicon), 2026-10-13.** A real
> editor imported a glTF model (glTFast 6.14.1, resolved automatically),
> exported a textured scene, ran the bundled verse-prepare, uploaded
> (one-shot and resumable), compiled and showed the link in the window; the
> link rendered textured. A dead server shows a plain-language error.
> Bake-on-publish v2 measured on Boat Attack (URP 17, terrain), a
> lightmapped URP interior and an HDRP room — see [Measured](#measured).

A **Tools ▸ Verse ▸ Publish Scene** editor window exports the open scene (or the
selection) to GLB with glTFast, uploads it, shows the server's compile
stages live, and gives you a streaming link.

**You need:** Unity 2021.3 or newer (2022.3 LTS recommended). The package
depends on `com.unity.cloud.gltfast`, pulled in automatically.

## 1. Install the package

### Download

Download **[com.ctruh.verse-publish-3.0.0.tgz](https://verse.ctruh.com/downloads/com.ctruh.verse-publish-3.0.0.tgz)**
(3.0 MB) from the [downloads page](https://verse.ctruh.com/downloads). It
bundles verse-prepare for macOS (Apple silicon and Intel), Windows and
Linux under `Tools~/`. Check it before installing:

```sh
shasum -a 256 com.ctruh.verse-publish-3.0.0.tgz   # Windows: Get-FileHash com.ctruh.verse-publish-3.0.0.tgz -Algorithm SHA256
# 24741c9d4736784af4ed7ac9240d928d90d6cefd8c773a92dfc48df55a4d8505
```

Keep the file somewhere stable (Unity references a tarball by path — the
project's `Packages/` folder is a good place), then **Window ▸ Package
Manager ▸ + ▸ Add package from tarball…** and pick it.

### Other routes

From a git URL — **Window ▸ Package Manager ▸ + ▸ Add package from git URL…**:

```
https://github.com/ctruh/verse-engine.git?path=integrations/unity/com.ctruh.verse-publish
```

Or from a tarball:

```sh
cd integrations/unity && ./make_tarball.sh   # -> dist/com.ctruh.verse-publish-3.0.0.tgz
```

then **+ ▸ Add package from tarball…**. A local checkout also works as a
`"com.ctruh.verse-publish": "file:/path/to/integrations/unity/com.ctruh.verse-publish"`
entry in `Packages/manifest.json`. Every route resolves glTFast from the
Unity registry (6.14.1 on Unity 6) and finds the bundled verse-prepare
wherever the package lives. The install must finish with no console errors.

## 2. Server and token

Open **Tools ▸ Verse ▸ Publish Scene**. The window holds, persisted via
`EditorPrefs`:

| Field | What it does |
| --- | --- |
| **Server URL** | Prefilled with the hosted service. Point it at your own origin when you [run your own server](run-your-own-server.md). |
| **Account token** | Optional, entered in a password field, sent as `Authorization: Bearer`. Owned scenes are permanent and listed in `/studio`; token uploads use the per-token rate bucket (20/hour). Leave empty for an anonymous test. |

## 3. Publish

1. Set the scene name (defaults to the active scene) or tick **Selection only**.
2. Press **Publish scene**.

Progress runs **export → upload % → Compiling — `<stage>` → done**. The
upload streams from disk (`UploadHandlerFile`, HTTP/1.1), the compile
stage is the server's live text passed through verbatim, polling runs on
`EditorApplication.update` so the editor never blocks, and **Cancel** works
in every phase. On success the link is shown, auto-copied, and
**Copy link** / **Open in browser** are offered.

Server errors are shown verbatim. The window retries exactly once, and only
on failures that lack the `X-Verse-Error` header (edge/proxy failures) —
an application error is final and actionable.

If the server cannot be reached at all (wrong URL, server down, no
network) the window says so in plain words — "Could not reach the Verse
server at <host>. Check the Server URL above and your connection, then
publish again." — instead of a transport error.

## Publish from a script or CI

The same state machine runs without the window:

```sh
Unity -batchmode -projectPath <project> -logFile publish.log \
  -executeMethod Ctruh.VersePublish.VersePublishBatch.PublishFromCommandLine \
  -verseScene Assets/Scenes/Main.unity -verseServer https://verse.ctruh.com \
  -verseName my-scene -verseResult result.json \
  [-verseBake auto|on|off] [-verseBakeQuality draft|high] [-verseNoSky]
```

Do not pass `-quit` (the publish runs on the editor update loop and the
method exits the editor itself: 0 on success, 1 on failure) or
`-nographics` (glTFast reads textures back through the GPU). A token, if
any, comes from the `VERSE_TOKEN` environment variable. Editor scripts can
call `VersePublishBatch.Publish(...)` or `VersePublishWindow.PublishHeadless(...)`
directly.

## Bake materials & lighting (bake-on-publish)

glTFast exports what it can read off Unity's standard Lit property names.
Custom shaders, Shader Graphs, detail/layered materials and all of Unity's
baked lighting (lightmaps, light probes) are lost, so scenes arrive flat and
grey. The window's **Bake materials & lighting** option bakes what the Game
view shows, in the editor, right before the export:

| Window setting | |
| --- | --- |
| **Bake materials & lighting: Auto / On / Off** | Auto is **on for scenes** (lightmaps present, a Terrain, 6+ renderers, 2+ lights or ≥ 3 m across) and **off for a single product**; the window says which it chose. |
| **Quality: Draft / High** | Draft: up to 8 bake pages of 2048² (64 texels/m near the camera), 1K material captures, a 4K sun shadow map, terrain from every second height sample. High: up to 24 pages (192 texels/m), 2K captures, 8K shadows, terrain at full resolution. |
| **Sky as background** | On by default — see [Terrain, LODs and the sky](#terrain-lods-and-the-sky). |

**What a bake page holds.** Every opaque, cut-out and blended renderer is
rasterised into a rectangle of a few 2048² *bake pages* in its own lightmap
UV layout (Unity's TEXCOORD1 unwrap — TEXCOORD0 when a lightmapped mesh has
no second UV set, as Unity does; generated with `Unwrapping` for a dynamic
mesh without one). Each texel is what Unity shows there:

- **surface** — the renderer's material drawn through its own **Meta pass**
  (the pass Unity's lightmapper reads albedo and emission from; Standard,
  URP Lit, HDRP Lit, surface shaders and Shader Graph Lit all have one)
  straight into the page, with the mesh's real world normals and positions,
  so tiling, detail layers, triplanar projection, moss on upward faces and
  procedural maths come out as they look. Materials without a Meta pass use
  main texture × colour.
- **× indirect light** — the renderer's lightmap (read as raw HDR from a
  temporary uncompressed re-import of its EXR, so the platform encoding is
  never guessed; directional lightmaps applied with the surface normal), or
  for a dynamic renderer its light probe as full L2 spherical harmonics per
  texel.
- **+ direct light the lightmap does not hold** — Realtime lights and Mixed
  lights in *Baked Indirect* or *Shadowmask* mode (a *Subtractive* lightmap
  already holds its Mixed lights): each light's diffuse term with its own
  falloff and spot cone, normal maps included, shadowed from a shadow map
  rendered for the bake (directional: one orthographic map over the scene;
  spot: one perspective map; point: six cube faces). Fully *Baked* lights are
  in the lightmap and the probes already.
- **+ emission**, all of it encoded through the **editor camera's colour
  grading**: a URP camera that renders post-processing is read once per
  publish as a 3D LUT (an identity colour cube drawn on a quad through a copy
  of the camera — Unity's own post exposure, white balance, lift/gamma/gain,
  curves and tonemapping), so the link shows the graded look, not the raw
  radiance.

Renderers are paged **by place** (Z-order of their positions) and packed by
size, at a texel density chosen from the quality, the object's surface and
its distance from the main camera (full density within ~30 m, a third far
away), scaled to the page budget. A level with 900 objects compiles 7–20
textures instead of one per object (Boat Attack High: 512 s of server
compile before, 32 s now). The pages are exported as emissive-only
`VersePage<n>_Baked` materials on mesh copies whose first UV set addresses
the page — the shape Verse's compiler detects as a bake and shows unlit — and
the link opens with `auto=0`, so Verse's first-open auto exposure does not
re-expose an already graded image.

**Cut-outs keep their holes.** A material whose Meta pass clips (an
alpha-clipped Shader Graph, URP/HDRP Lit with alpha clipping) is detected
from the capture's coverage; one that does not clip but is declared cut-out
takes main texture alpha × colour alpha. The holes travel in the page's own
alpha (Verse reads a cut-out's alpha in the same UV set as its baked colour),
cut-outs get twice the texel density, and they export as glTF `MASK`
(blended materials as `BLEND`). Baked cut-out geometry goes out in
primitives of under 128 triangles: Verse builds a far-distance impostor for
every alpha-cut primitive above that, whose atlas is lit, not baked — on a
level with 300 trees that cost ~80 s of compile and made the scene stop
reading as a bake.

**Skinned meshes** keep one colour per object (albedo × probe light + the
average sun). Lights are not exported once the lighting is baked in.

**Nothing in your scene changes.** Renderer materials, meshes and enabled
flags are swapped for the export and restored afterwards (also on error or
Cancel); the temporary lightmap copy is deleted. The window shows
`Baking materials 4 / 13`, `Preparing meshes 64 / 920`, `Shadows: Sun…`,
`Baking page 2 / 7` and, when done, what the bake did. Batch mode:
`-verseBake auto|on|off -verseBakeQuality draft|high [-verseNoSky]`; the
result JSON carries `bake` (pages, objects, cut-outs, direct lights,
per-phase seconds) and `scene` (LOD, terrain, sky, grade) objects.

### Terrain, LODs and the sky

These run on **every** publish, bake on or off:

- **LOD groups** go out as LOD0 only (glTFast exported every level on top
  of each other — z-fighting, 2–4× the triangles, and the coarse levels had
  no lightmap). Verse builds its own LOD chain.
- **Terrain** becomes tile meshes of ~64 m (heightmap sampled at every
  second sample on Draft, every sample on High), its splat layers
  composited on the GPU into one base-colour and one normal texture per
  terrain (layer tiling, offset and tint included). The tiles carry the
  terrain's lightmap, so the bake treats them like any lightmapped object;
  the terrain's trees become instances of their prototypes (up to 4,000).
  Detail meshes and grass are not exported.
- **Sky and background.** The skybox (whatever draws it — procedural,
  6-sided, cubemap or a custom sky shader) is rendered into a cubemap from
  the main camera and unwrapped to an equirect, graded like the bake.
  An **account-owned** publish (token set) uploads it as the scene's Radiance
  `.hdr` background (`PUT /v1/scenes/<id>/background/image`): every visitor
  sees the sky, and it lights the live-lit parts of the scene. An
  **anonymous** publish cannot set a background, so the link carries it:
  `bg=grad:<above>,<horizon>`, on live-lit and baked scenes alike (since
  3.0.0 Verse shows gradients behind baked scenes and paints solid
  colours exactly).

### Measured

Unity 6000.6.5f1 (Apple silicon), local server with empty caches,
2026-10-13 — ΔE2000 between a camera render in the editor and the published
Verse link from the same pose (mean over the frame; lower is closer;
`integrations/bake-proof/unity/compare-unity.mjs`), publish = click to link:

| Scene | Bake off | Draft | High |
| --- | --- | --- | --- |
| Boat Attack `demo_Island` (URP 17, 2 terrains, 920 renderers after LOD0, Shader Graph cliffs and vegetation, Mixed sun in Baked Indirect, colour-graded camera) | ΔE 17.9 · 35.5 s | **ΔE 10.0** · **21.3 s** (bake 2.2 s, 7 pages) | **ΔE 9.9** · 41.8 s (bake 5.3 s, 20 pages) |
| URP interior (window, Mixed sun + Mixed spot in Baked Indirect, baked lamp, cut-out plant and perforated screen, detail-mapped rug, probe-lit vase, procedural sky) | ΔE 18.2 · 1.8 s | **ΔE 4.7** · 5.2 s | **ΔE 4.6** · 6.9 s |
| The same room under HDRP 17 (fixed exposure, gradient sky) | ΔE 15.6 · 1.6 s | **ΔE 8.7** · 4.2 s | **ΔE 8.6** · 5.9 s |

Before this version Boat Attack measured ΔE 29.0 (off), 32.0 (Draft,
44 s) and 32.0 (High, 900 s); the "off" column improves too because the
terrain, LOD0 and the sky now travel on every publish. Draft is faster than
a plain publish on Boat Attack: seven 2048² pages compile faster than the
level's own twelve source textures (two of them 4K). Side-by-sides:
`Verse-Bake-On-Publish-Proof/unity-v2/` (`*.sheet.png`: editor, off, Draft,
High).

**Limits.** Boat Attack's sea is drawn by a script at run time — there is
no mesh to export, so the link has no water. A baked scene's background is
one colour (a gradient or the sky image needs a token). HDRP: the camera's
exposure and tonemapping are not read (the bake's direct light in the HDRP
room is too bright by about that factor). Fine alpha patterns (a perforated
screen) close up at the page's resolution. World-space shaders on cut-out
materials use their one-tile capture. Bloom, vignette and depth of field are
not carried. Skinned meshes are one colour. Specular highlights are not
baked (Verse's own reflections apply).

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

- GLB via glTFast 6.x, textures at **source resolution** (never
  downscaled — bake at the quality you want published); bake pages as
  JPEG 92 (PNG where they carry cut-out alpha).
- LOD0 of every LOD group, Terrains as tile meshes, the skybox as the
  background — on every publish.
- The protocol layer (`VersePublishClient.cs`) is plain C# with no
  UnityEngine dependency, so the same request shapes are replayed by the
  headless test.
- 30-minute total budget, matching one server compile attempt (30 min; a
  build's whole wall clock is 45 min).

## Known seams to watch

- glTFast export API drift on future glTFast majors (errors mentioning
  `GameObjectExport` or `ExportSettings`) — 6.14.1 works as-is.
- Textures arriving downscaled — they must be source resolution.

## Next

- [Share privately with tokens](share-privately.md)
- [Embed the viewer](embed-the-viewer.md)
- [Publish from Unreal](publish-from-unreal.md)
