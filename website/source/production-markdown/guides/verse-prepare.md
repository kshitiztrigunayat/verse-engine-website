# verse-prepare — the local compression step

A DCC export is sized for the DCC, not for delivery: a 4K texture on a
door handle, the same chair exported forty times, buffers nothing
references. On archviz exports that is where the 2–40 GB comes from, and
it is why uploads used to stop at 512 MB.

`verse-prepare` rewrites a GLB so that **what travels is what a visitor can
ever see** — without changing what they see. It runs in three places:

| Where | How | Textures |
| --- | --- | --- |
| Blender / Unreal / Unity plug-ins | automatically, between export and upload | base colour → JPEG 92 (opaque only), everything else lossless |
| the ingest server | on every upload that arrives without the marker | lossless |
| your shell / CI | `verse-prepare in.glb -o out.glb` | your flags |

Files that went through it carry `asset.extras.verse.prepared` and may be
**up to 20 GB** on the resumable upload (`POST /v1/ingest/begin` with
`"prepared": true`; the server verifies the marker at commit). Plain files
are accepted up to the plan's raw upload limit (`rawUploadMB`) and the
server prepares them itself.

## What it does

1. **Texel-density right-sizing.** For every image, the world-space size
   of the surfaces that sample it is measured from the triangles themselves
   (world area ÷ UV area, per primitive, through node transforms and
   `KHR_texture_transform` scale). The image keeps the resolution a visitor
   standing at arm's length can resolve — `--texels-per-metre`, default
   **2048 px/m** (one texel per screen pixel at ~0.5 m on a 1080p screen)
   — and nothing more. Never upscaled, never below `--min-dim` (256),
   never above `--max-dim` (4096). The largest use of an image decides, so
   a texture shared by a wall and a tile keeps the wall's detail.
2. **Re-encode.** Opaque base colour goes to JPEG (quality 92, invisible
   at the right-sized resolution). Lightmaps, emissive, normals,
   roughness, occlusion and anything with alpha stay PNG — banding and
   normal artefacts never appear. `--lossless` keeps everything PNG.
   Images that need neither a resize nor a format change pass through byte
   for byte.
3. **Dedupe.** Identical images, identical accessors and identical meshes
   (same primitives, same materials) collapse to one copy; nodes re-point
   to the survivor — glTF instancing. `--no-dedupe` switches it off.
4. **Strip.** Buffer views and accessors nothing references any more are
   dropped and the binary chunk is rebuilt tight.

Positions pass through **bit-identical** by default: the compiler's
cluster DAG is the right place to handle triangle density, and unchanged
positions keep the fidelity harness meaningful (and the compiler's
geometry cache warm — see `--weld` / `--simplify-error` below for the two
opt-in passes that do move vertices). Unused vertex attributes are dropped
(lossless), and `--max-tris-per-m2` can thin over-dense meshes on request.
Quantized output (`KHR_mesh_quantization`) is deliberately not produced:
the ingest server would have to expand it in memory before the compiler
reads it, which is the wrong trade for 2 GB files.

On the flagship flat (3.1 M triangles, 399 textures) the Draco-decoded
export goes 283 → 190 MB in 0.9 s: 19 textures right-sized (plants, vases
and books sampled above 4000 px/m), 4 meshes instanced, 1 183 stale buffer
views dropped. On exports with 4K textures everywhere the ratio is far
larger — the tool prints what it did to every image.

## CLI

```
verse-prepare in.glb [-o out.glb] [--texels-per-metre 2048] [--max-dim 4096]
             [--min-dim 256] [--lossless] [--jpeg-quality 92] [--no-dedupe]
             [--keep-attributes] [--max-tris-per-m2 N]
             [--weld [E]] [--simplify-error E]
             [--json report.json|-] [--dry-run] [--quiet]
```

- Output defaults to `in.prepared.glb`.
- `--keep-attributes` keeps vertex attributes the pass would otherwise
  drop (a TANGENT with no normal map, an all-white COLOR_n, a TEXCOORD_k
  no texture samples). Stripping is lossless; it is on by default.
- `--max-tris-per-m2 N` (off by default, **lossy**): primitives denser
  than N triangles per square metre of world surface are simplified to
  that density with meshopt. Positions are never moved and vertex arrays
  are untouched, so the upload shrinks only by the index list; the real
  win is a lighter compile and stream. 2000 removed 1.97 M of the flat's
  3.1 M triangles. Leave it off for product close-ups.
- `--weld [E]` (off by default; **moves vertices**, lossless to the
  tolerance): merges vertices whose positions lie within E metres of each
  other (world space, through the mesh's largest instance scale; `--weld`
  alone = 0.1 mm) **and** whose other attributes — normal, UV, tangent,
  colour — are bit-identical, so UV-chart seams and hard edges survive.
  The first vertex is canonical and keeps its position; the others snap
  to it, the vertex buffers are rewritten to the survivors, indices are
  remapped and triangles that collapsed are dropped. Points/lines,
  morph-target and skinned primitives are left alone. Exports that
  duplicate every vertex per triangle (some CAD/BIM paths) shrink by
  3–6× in geometry; the compiler's own position-weld then finds nothing
  left to do.
- `--simplify-error E` (off by default; **lossy within E**): meshopt
  attribute-aware simplification with an **absolute** positional error
  bound of E metres (world space) — `0.001` means no surface moves more
  than a millimetre. Normals and UVs steer the collapse (a ~15° normal
  change or a quarter-UV shift costs as much as the full bound), borders
  are locked so neighbouring primitives never crack, and the vertex
  buffers are rewritten to the surviving vertices — unlike
  `--max-tris-per-m2`, the saving is real bytes, not an index list. Runs
  after `--weld` and after the density pass when both are given. The
  report carries `verticesWelded` / `verticesSimplified`; the prepared
  marker records both tolerances.
- `--dry-run` measures and reports without writing — the estimate step.
- `--decode-meshopt` only decodes `EXT_meshopt_compression` /
  `KHR_meshopt_compression` to plain buffer views and writes the GLB (the
  ingest server's normalizer). A meshopt input to the full pass is decoded
  the same way first (3.0.0-beta.1).
- `--json -` prints the report to stdout: per-image before/after
  dimensions and bytes, the source texel density, the action taken
  (`kept`, `resized`, `re-encoded`, `dropped`, `duplicate of N`), dedupe
  counts, triangles, seconds.
- stderr carries `progress: prepare images i/n` lines (what the plug-ins
  show) and one line per image that changed.
- Exit 0 on success, 2 on usage, 1 when the input is refused. Refused
  inputs say why: Draco compression (export with compression
  off — the server still accepts Draco for direct uploads), external
  buffers (`.gltf` + `.bin`; export a single `.glb`).

The input is memory-mapped: a 20 GB export is measured in place, and only
the images and the surviving buffer views are copied.

## Building and bundling the binary

From the repo root, `cargo build --release -p verse-compile` produces
`target/release/verse-prepare` next to `verse-compile` (the Dockerfile
copies it into the image; the ingest server spawns it). The **Tools**
GitHub Actions workflow (`.github/workflows/tools.yml`, run it from the
Actions tab or push a `tools-v*` tag) builds four binaries:

| Artifact | For |
| --- | --- |
| `verse-prepare-darwin-arm64` | Apple Silicon Macs |
| `verse-prepare-darwin-x64` | Intel Macs |
| `verse-prepare-windows-x64.exe` | Windows |
| `verse-prepare-linux-x64` | Linux |

Drop them into `integrations/bin/` (gitignored) and build the plug-ins:

- **Blender** — `python3 integrations/blender/make_extension.py` puts them
  under `verse_publish/bin/` inside the zip with the exec bit kept.
- **Unity** — `sh integrations/unity/make_tarball.sh` copies them to the
  package's `Tools~/`.
- **Unreal** — `sh integrations/unreal/VersePublish/make_plugin_zip.sh`
  copies them to the plug-in's `Resources/bin/`.

All three plug-ins upload large files through the resumable
begin/part/commit flow, so prepared files up to 20 GB work from every
editor.

Each plug-in looks for the tool in this order: the path set in its
preferences, the bundled copy, then `PATH` (the Unreal plug-in also finds
the repo's `target/release/verse-prepare` when it is built inside the
repo, and `integrations/unreal/VersePublish/bundle_prepare.sh` builds the
Mac binaries into its `Resources/bin/` for a from-source build).

**Non-finite numbers.** JSON has no `inf` / `NaN`, but some exporters print
them anyway (Unreal 5.8 wrote `"ior":inf`). verse-prepare, the compiler
and the Unreal plug-in replace each with a safe value for its field —
`ior` → 1.5, factors and colours clamped to 0..1 (NaN → the spec default),
`attenuationDistance` / light `range` / camera `zfar` removed (absent means
infinite), transforms → identity — log every fix and list it in the
report's `warnings`.

## In the plug-ins

The publish flow becomes **export → prepare → upload → compile**. The
prepare phase shows the tool's own progress (`Preparing textures
120/400`), then the result (`Prepared 2 480 → 310 MB (212 textures
right-sized)`). Preferences: **Prepare before upload** (on), the binary
path, **Texels per metre** (2048), **Lossless textures** (off).

Without the tool, exports upload as they are (resumably, up to the plan's
raw upload limit) and the server prepares them; the plug-in logs the
install hint.

## Choosing texels per metre

| Setting | Means | Use |
| --- | --- | --- |
| 1024 | 1:1 texels at ~1 m on 1080p | large exteriors, previews, bandwidth-first |
| **2048** | 1:1 at ~0.5 m | interiors, furniture, the default |
| 4096 | 1:1 at ~0.25 m | product close-ups, hero materials you walk right up to |

The compiler keeps its own ceilings after this step (2048² streamed
tiers, 4096² hero tier), so a higher setting only matters for sources
that are actually that dense.
