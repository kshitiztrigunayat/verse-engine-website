# Import a scan

Bring the capture you already have — from a phone or tablet with LiDAR, a
photogrammetry or capture app, a 3D tour platform's export bundle, or a laser
scanner — and get a cleaned, streamed Verse scene: the right way up, in
metres, with the capture's faults fixed, on a laptop and on a phone.

*This page covers importing: formats, orientation, units, what the
cleanup fixes and its limits.*

## In the app

On the upload screen, choose **Import a scan**:

1. **Where is it from?** Phone or tablet LiDAR · Photogrammetry or capture
   app · 3D tour export bundle · Laser scanner or point cloud. Each source
   shows what to export and narrows the file picker to the formats it makes.
2. **3D tour export bundle** only: choose **Textured mesh** (the walkable
   space) or **Point cloud** (the bundle's cloud). If you have a link to a
   hosted tour instead of the bundle, paste it under *Have a tour link
   instead?* — the app tells you what to do (see [Tour links](#tour-links)).
3. **More options** (rarely needed): *Up axis* and *Units* override the
   automatic choice; *Clean up the scan* (on by default) can be unticked to
   publish the capture as captured.
4. **Choose the scan file**, or drop it on the page while the panel is open.
   The usual checks run, then the upload starts.

## Formats

| Source | Formats | What happens |
| --- | --- | --- |
| Phone or tablet LiDAR | `.usdz`, `.glb`, `.ply` (mesh or points), `.obj` in a `.zip` with its `.mtl` and textures, `.e57` | Meshes are converted to GLB where needed and cleaned; point clouds are packed and streamed |
| Photogrammetry or capture app | `.glb` / `.gltf` (embedded), zipped `.obj`, `.ply` mesh, `.usdz`, Gaussian-splat `.ply` (3DGS) or `.splat` | The same; a splat capture is packed as a splat |
| 3D tour export bundle | the bundle's `.zip` as downloaded (an OBJ mesh with its textures, `cloud.xyz`, colour floor plans) | **Textured mesh:** its OBJ is converted (the bundle is Z-up, metres) and cleaned. **Point cloud:** its `cloud.xyz` is unpacked and packed as a cloud |
| Laser scanner or point cloud | `.e57`, `.las` / `.laz`, `.ply` points, `.xyz` / `.pts` text, or a zip carrying one | Packed into a streamed point cloud (every scan in an E57 is merged) |

Every import above is exercised by `web/test/fix-verify-scan-import.mjs`,
except LAS / LAZ: they ride the existing point-cloud reader
(`fix-verify-cloud.mjs` packs a LAS file and recognises a LAZ header).

## Up axis and units

A capture often does not say which way is up, or what unit it is in. glTF is
Y-up in metres by definition and USD declares both (`upAxis`,
`metersPerUnit`), so those frames are kept. For the others the server
decides before anything else is measured (the cleanup's thresholds are in
metres):

**Up.** The evidence is which way the surfaces face. A capture sees the tops
of things — the floor, table tops, seats — and rarely their undersides, so the
area-weighted sum of the surface normals points up; opposite walls cancel.
The strongest axis wins only when it is clearly ahead (at least 3 % of the
total surface, and twice the runner-up). Otherwise the format's convention
stands: **Z-up** for E57 and LAS, **Y-up** for OBJ, PLY and text clouds
(phone capture apps write Y-up). A tour bundle is always read Z-up. A point
cloud without normals has no surface evidence, so it follows the
convention. Every rotation is a quarter or half turn about an axis — the
floor's residual tilt is then levelled by the cleanup.

**Units.** A capture is human-scale. After orientation, a file at most 40
units tall and 500 across is read as **metres**. Otherwise **centimetres**,
then **millimetres**, are tried: the first that makes the height between
1.8 m and 15 m wins. Inches and feet are never guessed.

**Overriding.** In the app: *More options → Up axis / Units*. Through the
API: `X-Verse-Up: auto | x | y | z | -x | -y | -z` and
`X-Verse-Units: m | cm | mm | in | ft`. An unreadable value is ignored. A
USD or FBX file's declared frame is applied by its converter and is not
overridden.

What the gate measures: one procedural 4 × 3 m room, 2.5 m tall, written as
a Z-up centimetre OBJ zip, a millimetre PLY mesh, a Z-up USDZ declaring
centimetres, a tour bundle, a Z-up PLY point cloud with normals, a
millimetre XYZ cloud and a Z-up E57 — every one lands as a 4.00 × 2.50 ×
3.00 m room, Y-up, with the floor at y = 0 (meshes: the published GLB's
bounds; clouds: the packed cloud's root points).

## Cleanup

Meshes go through the existing scan cleanup: floor levelled and put at
y = 0, floating debris removed, small holes filled, light baked into the
texture evened out. An import from the panel always asks for it
(`X-Verse-Scan: clean`); untick *Clean up the scan* (`X-Verse-Scan: off`)
to publish exactly as exported. With `off`, an explicit up axis or unit
still applies — the orientation step runs alone, nothing else changes.

On the gate's synthetic room the cleanup removes the three floating crumbs
and fills the 16 × 16 cm hole in the far wall, on every mesh import.

## Tour links

A link to a hosted tour cannot be imported: fetching a tour's geometry needs
the tour platform's API access, which a Verse server does not have. Paste a
link into the app and it recognises it (with the model's id) and answers:
ask the model's owner — or anyone they gave export rights — to download the
model's **export bundle** from their tour account, then upload that zip
unchanged. Nothing is fetched. Other links get a plain "download the file
first" answer.

## Limits

The same rules as every upload, published by `GET /v1/limits` under
`scanImport`:

| Limit | Value | Where it is enforced |
| --- | --- | --- |
| File size | 512 MB | the upload (one-shot and resumable `begin`) |
| Conversion (OBJ, PLY mesh, USDZ) | 15 min (`VERSE_CONVERT_TIMEOUT_S`) | the converter |
| Cleanup | 10 min (`VERSE_SCAN_CLEAN_TIMEOUT_S`) | `scan-clean` |
| Packing a cloud or a splat | 30 min per attempt | `cloud-pack` / `splat-pack` |
| Whole job | 45 min wall clock | the job |
| Point cloud | 200 million points | the preflight and `cloud-pack` |
| Splat capture | 4 million splats | the preflight and `splat-pack` |
| Import from a link | not available (`linkImport: false`) | — |

A cleanup that cannot run never fails the upload: the capture is published
as captured and the record says why.

## Errors

A broken file fails with one of the usual friendly errors (a sentence and
its fix, plus `errorInfo.code`); the raw detail stays in the server log. The
gate checks:

| File | Error |
| --- | --- |
| A GLB cut off part-way | `corrupt_file` |
| A PLY whose header promises more points than it holds | `cloud_invalid` |
| A PLY announcing 300 million points | `cloud_too_many` |
| An E57 with a valid header and garbage after it | `cloud_invalid` |
| A zip with no scan in it | `unsupported_format` |
| A USDZ whose layer is not USD | `bim_invalid` ("the file could not be parsed (line 3, column 8)") |
| Text that is not a point cloud | `cloud_invalid` |
| A file that is not a model at all | `unsupported_format` |
| A scan over 512 MB | `file_too_large`, at `begin` |

## API

`POST /v1/ingest` (or the resumable `begin` / `part` / `commit`) with:

| Header | Begin body | Meaning |
| --- | --- | --- |
| `X-Verse-Scan: clean \| off` | `scan` | clean (the panel's default) or publish as captured |
| `X-Verse-Up` | `up` | which file axis is up; `auto` infers |
| `X-Verse-Units` | `units` | the file's unit (an OBJ without it keeps the converter's own guess unless it is a scan import) |
| `X-Verse-Kind: cloud` | `kind` | a point cloud, or a tour bundle's cloud |

The finished record carries what was done: for a mesh, `scan.frame`
(`up`, `upMode`, `unit`, `unitMode`, `size`); for a cloud, `frame`; and a
plain-words line in `fixes`, e.g. *"Normalised the scan: turned it upright
(its z axis was up — its surfaces showed which way is up) and read its units
as centimetres (250 units tall reads as 2.50 m in cm) — now 4.00 × 2.50 ×
3.00 m."* `upMode` / `unitMode` is `inferred`, `convention`, `asked` or
`kept`.

The tools take the same choices: `scan-clean in.glb -o out.glb --up auto
--units auto [--up-convention z]` and `cloud-pack in.e57 -o out.vpc --up
auto --units auto` (the decision is printed as `cloud-frame: {json}`). The
shared rules live in `crates/verse-compile/src/scan_frame.rs` (unit-tested);
the app and the server share `web/playground/scan-import.js`.

## The gate

`web/test/fix-verify-scan-import.mjs` (ports 9850–9859) generates every input
itself (`make-scan-import-fixtures.mjs`; the E57 is written by the `e57`
crate's writer, `examples/make-scan-e57`; the splat comes from the repository's
sample splat) — no customer files, nothing downloaded. It checks the shared
module, detection of every fixture, every importer end to end, the
normalised geometry, the bad files and limits, a render of every import on
renderer tier A (WebGPU, desktop) and tier C (WebGL2, phone viewport), the
card (sources, help, tour link, a picked file's upload and its result, a
375 px phone), and these docs. Output: `web/test/out/scan-import/`
(screenshots, `metrics.json`).

On Linux without a GPU, tier A runs on SwiftShader through Vulkan
(`--enable-features=Vulkan --use-vulkan=swiftshader --use-angle=swiftshader`):
the default headless WebGPU path loses its device every few seconds there.

## Known gaps

- **Hosted tour links** are recognised, not imported — that needs the tour
  platform's API access. Use the export bundle.
- **The fixtures are synthetic.** They have the shapes the apps export
  (formats, frames, units, a tour bundle's layout), not real captures; the
  cleanup on real phone captures is measured by `fix-verify-scans.mjs`,
  which needs four CC-BY captures (docs/attributions.md).
- **Inches and feet** are never inferred; ask with `X-Verse-Units`.
- **Small objects in centimetres or millimetres** (under 40 units tall) read
  as metres, and taller ones are sized as a room would be; ask with
  `X-Verse-Units`.
- **Up for a cloud without normals** follows the convention (Z for E57 and
  LAS, Y otherwise); a Y-up E57 without normals needs `X-Verse-Up: y`.
- **Splat captures** are packed as exported: the up/units step does not run
  on splats. Tier C has no splat renderer (it says so); compressed `.spz`
  splats are not read.
- **Untextured room-layout USDZ** files (walls and furniture as plain boxes)
  are not covered by the gate.
- **Converter version:** the gate's OBJ / PLY conversions ran here on Blender
  4.0.2; production pins Blender 5.0.1.
