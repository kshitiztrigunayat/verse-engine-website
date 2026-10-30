# What you can upload

Everything on this page is also shown in the app's upload screen, which reads
the numbers live from `GET /v1/limits` — so what you see there is always
what this server actually enforces. The app checks your file **before any
bytes are sent**, tells you in plain language **what it found and what it
will do with it**, and lets you correct it with one tap.

## Two roads

Every upload takes one of two roads. The app decides, says so, and you
can override it ([Fidelity mode](fidelity-mode.md) has the rules in full):

| | **Fidelity** | **Streamed** |
| --- | --- | --- |
| For | a product, a scan — one object or a small set | an interior, a building, a city — anything large |
| What is published | the file itself: Draco decoded, every texture at its source resolution and format | a streamed scene: coarse-to-fine geometry and textures that arrive as the camera needs them |
| How long | seconds | about 8 seconds per MB of source (the app's estimate is calibrated against this server) |
| How it looks | exactly as exported — the Khronos PBR materials, your textures, studio lighting; measured against the Khronos sample models and a reference renderer | the same materials through the compiler's atlas and streams; walkable from the first second |
| Rules | ≤ 6 m across, ≤ 10 M triangles, ≤ 48 textures, ≤ 4 GB decoded (fifteen 8K maps), textured, not lightmap-baked, not IFC/USD | everything else |
| Link | `/view?glb=ingest/<id>.fidelity.glb` | `/view?vpk=ingest/<id>.vpk` |

A textureless low-poly object streams by default (nothing to keep exact,
and it builds in seconds) — the app offers Fidelity for it anyway.

## Formats

| Format | Notes |
| --- | --- |
| **GLB** (binary glTF 2.0) | the recommended format — one self-contained file |
| **glTF 2.0 JSON** (`.gltf`) | a fully embedded `.gltf` (`data:` URIs) on its own; a `.gltf` with a separate `.bin` and texture files: zip the folder (a model library's "glTF Separate" download as it comes) and upload the `.zip` — it is packed into one GLB on our side. A texture missing from the zip is named in the result and that surface shows its plain colour; a missing `.bin` is refused |
| **Phone video of a room** (`.mp4`, `.mov`, `.webm`, `.avi`) or a **zip of room photos** | [Verse Capture](film-a-room.md): a walkable 3D room built from your footage (beta; available where the capture service is on) |
| **3D Gaussian-splat `.ply`** | binary little-endian 3DGS export (INRIA and most capture apps) — streamed |
| **`.splat`** | antimatter15 raw splat records — streamed |
| **Point clouds** (`.ply` xyz, `.las`/`.laz`, `.e57`, `.xyz`/`.pts` text) | laser scans and dense clouds, streamed coarse-to-fine as point discs. A text cloud is one point per line: `x y z`, optionally intensity, colour (0–255 or 0–1) and normal |
| **PLY mesh** (`.ply` with faces) | a scan app's mesh export (vertex colours) — **converted on our side** and [cleaned as a scan](#scans). Send `X-Verse-Kind: cloud` to show its vertices as a point cloud instead |
| **Matterport MatterPak** (`.zip`) | the bundle exactly as Matterport delivers it — [see Scans](#scans) |
| **IFC** (`.ifc`, IFC2x3 / IFC4) | BIM models — converted on our side and streamed; every product becomes a clickable object with its name, type, storey and property sets ([guide](publish-from-ifc.md)) |
| **USD** (`.usdz`, `.usd`, `.usda`, `.usdc`) | one self-contained file — Mesh prims with **MaterialX** (OpenPBR / `standard_surface`) or `UsdPreviewSurface` materials, textures from inside a `.usdz`; Z-up stages and `metersPerUnit` are normalised; references to other files are not followed ([guide](publish-from-ifc.md)) |
| **FBX** (`.fbx`, binary or ASCII, FBX 2011–2020 / 7.1–7.7) | **converted on our side** to glTF, then published like a GLB (Fidelity or streamed). Materials (Phong, 3ds Max Physical, Stingray PBS), embedded textures, units and up-axis from the file, animation and skins come across. Textures kept as separate files: upload a `.zip` with the texture folder ([guide](upload-fbx-obj.md)) |
| **OBJ + MTL** (`.obj`) | **converted on our side**. Zip the `.obj` with its `.mtl` and textures — an `.obj` alone has plain colours. OBJ has no units: a model wider than 1,000 units is read as centimetres (`X-Verse-Units` overrides) ([guide](upload-fbx-obj.md)) |
| **STL** (`.stl`, binary or ASCII) | **converted on our side**. STL carries shape only — no colours, textures or units — so it is shown in a neutral material and read as millimetres (the 3D-printing default; a model under 2 units across is read as metres). `X-Verse-Units` overrides |
| **`.zip`** | a `.gltf` with its `.bin` and textures, or a zipped `.glb` (packed into one GLB); or an `.fbx` or `.obj` with its `.mtl` and texture folder (converted). Other scene files in the zip are ignored. A Matterport MatterPak zip is recognised as one |

`.blend`, `.max`, `.skp` and other application files need exporting first:
FBX or, best, **glTF Binary (.glb)** (in Blender: **File → Export → glTF 2.0**).

## Scans

Room and property captures from a phone or a Matterport camera are a
first-class upload. Verse recognises a capture: the exporter names a
capture app, the upload is a MatterPak or a PLY mesh, or every material is a
single photo texture and nothing else. It then **cleans it before
publishing**, in about a second:

- **Levels the floor and puts it at height 0.** It finds the lowest large
  level surface and rotates it exactly level. Bumps of up to 2.5 cm in it
  (the "wobbly floor" of a LiDAR mesh) are flattened. Phone captures are
  usually a fraction of a degree off; up to 45° is corrected.
- **Removes floating debris.** Crumbs and small fragments hanging in the
  air go. Anything touching the room stays, like a chair on the floor.
- **Fills small holes.** A hole up to 1.2 m round is filled with texture
  from around it. Windows, doorways and unscanned rooms stay open.
- **Evens out the light baked into the texture.** Dark corners are lifted
  and hot spots by a window are softened. Colours and the overall
  brightness are kept: the correction is gentle and never more than
  ×1.5 / ÷1.5.

The upload screen offers **Clean up the scan**, on by default; turn it off to publish
the capture exactly as exported. Through the API, send `X-Verse-Scan: off`
(or `clean` to clean a file Verse did not recognise as a capture). The share
link's record lists what was done, for example *"levelled the floor (it was
0.56° off), removed 119 floating fragments, filled 23 small holes"*. A scan
that fits the product limits (≤ 6 m, ≤ 2 M triangles) opens in Fidelity; a
larger one (a corridor, a whole floor, a house) is cleaned and streamed.

### What to export, per app

| App | Export | Notes |
| --- | --- | --- |
| **Polycam** | **GLB** (best), or OBJ (zip it with its `.mtl` and textures), or USDZ. Point clouds: PLY / XYZ / LAS. Gaussian splats: PLY | Polycam's free plan limits some export formats. |
| **Scaniverse** | **GLB** (best), OBJ (zip) or USDZ. Point clouds: PLY / LAS. Splats: **PLY** | Scaniverse's SPZ splat format is not read yet; export splats as PLY. |
| **3D Scanner App** | **GLB** (best), OBJ (zip), USDZ, PLY mesh, or PLY / XYZ / LAS points | |
| **iPhone** (RoomPlan, Reality Composer, Object Capture) | **USDZ** | A USDZ that is a capture is cleaned as a scan, not treated as a BIM model. |
| **Matterport** | the **MatterPak Bundle** (`.zip`), uploaded unchanged | See below. No Matterport login, API key or account link is needed: Verse only reads the file you download. |
| Photogrammetry (RealityCapture, Metashape, Luma…) | GLB, or OBJ (zip) | |

### Matterport: which export to ask for

In Matterport Cloud, open the space and buy or download the **MatterPak™
Bundle** add-on. It is a paid add-on per space, and Matterport decides which
spaces offer it. Upload the `.zip` as it arrives. Verse looks inside:

- **The textured mesh** (`<model id>.obj` + `.mtl` + its texture JPGs) is
  the scene. Matterport writes it Z-up in metres; Verse reads it that way,
  then cleans it as a scan. A home is usually larger than the Fidelity
  limits, so it streams.
- **`cloud.xyz`** (a colourised point cloud) is skipped when the zip is
  converted as a mesh. To get the point-cloud view instead, upload the
  same zip with `X-Verse-Kind: cloud` (or as a separate upload).
- **The colour plan and ceiling plan images** (`colorplan_*.jpg`, PDF) are
  listed in the record but not used. Verse draws its own floor plan from
  the mesh.

Limits of a MatterPak to know about:

- Its mesh is Matterport's own simplified reconstruction, with textures of
  about 2K each. It is not the detail of the 360° panoramas in the
  Matterport tour, and the panoramas are not in the bundle.
- Spaces captured before December 2017 carry only the OBJ.
- `cloud.xyz` is a reduced-density cloud. For survey-grade density, buy
  the separate **E57** add-on and upload the `.e57` directly (a point cloud).
- A large home's bundle can pass the 512 MB upload limit, usually because
  of `cloud.xyz`. Remove it from the zip, or upload the mesh and the cloud
  separately.

## Limits

These are enforced. A file over a limit is refused before it uploads.

| Limit | Value |
| --- | --- |
| File size | **512 MB**; up to **20 GB** for a file [prepared with verse-prepare](verse-prepare.md) (the Blender, Unreal and Unity plug-ins do this) and sent through the resumable upload. The glTF container itself caps one `.glb` at 4 GB; past that, split the export or instance repeated geometry |
| Triangles (streamed) | no fixed cap: past 12 M source triangles the build runs region by region in bounded memory (a 1 B-triangle instanced city compiles at a 5 GB peak). The file's 32-bit offsets cap it at 4 GB: about **28 B per unique triangle** plus **~2 B per repeated triangle** (repeated meshes, 8+ copies, are stored once but each copy keeps its directory entries) — roughly 140 M unique triangles with nothing repeated, or ~50 M unique beside ~1 B repeated |
| Build time (streamed) | **45 minutes** in total; each attempt up to 30 minutes (an attempt with no progress for 10 minutes is stopped and retried on lighter settings) |
| Fidelity file size | **512 MB** (the upload cap). Over 24 MB the textures stream — a small first view in seconds, then every texture sharpened once to what the device holds; over 1.5 M triangles phones get a simplified mesh, desktops the full one ([Fidelity mode](fidelity-mode.md#larger-products)) |
| Single-room interiors in Fidelity | a one-storey room under **100 MB**, 2 M triangles and 128 textures streams for phones and opens as itself on desktops from the same link ([Fidelity mode](fidelity-mode.md#larger-products)) |
| Splat captures | **4,000,000** splats |
| Uploads | 6 per hour anonymously, 20 per hour signed in |
| Builds at once | 2 per server — the rest wait in a queue, and the app shows your place in it |

## Recommendations (streamed)

These are **recommendations, not limits** — larger scenes are attempted,
and heal themselves onto lighter settings when they need to.

| For a quick, reliable build | Stay around |
| --- | --- |
| Triangles | up to about **3 million** |
| Textures | up to about **400** |
| Texture size | **2K** (2048 px) |
| File size | up to about **170 MB** |

The basis is the largest scene we test on every release: 3.1 M triangles,
399 textures, 167 MB — about 20 minutes to build on the production server.

Textures larger than 2048 px are resampled to 2048 px for streaming (the 12
most prominent materials keep 4096 px). A base-colour texture
larger than 4096 px (8K, 16K) keeps its full detail: it is cut into pages
and the viewer streams only the pages in view (virtual texturing; `?vt=0`
shows the old path). Other maps above 2K only make the upload and the
build longer. **In Fidelity
mode nothing is resampled**: a 4096² map is shown at 4096².

**Baked in Blender (bake to emission).** If you baked your lighting into
images and plugged them into each material's *Emission* socket — the common
archviz workflow, with the Base Color socket often still holding the
original albedo texture — the scene is recognised as baked (and streams):
every material whose emission image is a lit picture (bright over most of
its texels) is shown exactly as that picture, unlit, and its base-colour
texture is set aside (it is not downloaded). Cut-out materials keep their
holes: the alpha of the base texture still applies to plants and grilles
in *Alpha Clip* or *Alpha Blend* mode. A material whose emission image is
mostly black with a few glowing texels — a screen, a lamp — stays a lit
material and is listed in the Lights panel. Naming the baked materials
`…_Baked` (what Blender's bake add-ons do) is a helpful hint, used to pick
the right UV map when the bake sits on its own lightmap UVs, but it is not
required and does not by itself make a material baked: the pixels decide.

**Logos, stickers and posters.** A flat image with transparent parts —
a company logo on a wall, a sticker, a framed poster with a transparent
border, a sign — is a *decal*: a plane whose base-colour image carries the
cut-out in its alpha channel (a PNG on a transparent background). Export it
in either *Alpha Clip* (MASK) or *Alpha Blend* (BLEND) mode; both work the
same way. The image's alpha decides: where it is transparent the wall
behind shows through, where it is opaque the picture shows, lit like the
surface it sits on, and from both sides if the material is double-sided.
Keep the image's transparent pixels truly transparent (alpha 0) — their
colour does not matter. What counts as **glass** instead: an Alpha Blend
material whose transparency is partial — a window pane with its alpha
factor below 1 and no image, or an image whose alpha is a soft, mid-range
tint everywhere (a privacy film) — and any material carrying
`KHR_materials_transmission`. Those refract and transmit; a logo never
does.

## Compression

| Supported — decoded on our side | Not supported |
| --- | --- |
| Draco geometry (`KHR_draco_mesh_compression`) | AVIF textures |
| meshopt geometry (`EXT_meshopt_compression`, `KHR_meshopt_compression` — gltfpack `-c` / `-cc`) | |
| Quantized meshes (`KHR_mesh_quantization`) | |
| WebP textures (`EXT_texture_webp`) | |
| KTX2 / Basis textures (`KHR_texture_basisu`) | |

## What is rendered

**Every Khronos material renders**, on WebGPU and on WebGL2 (iPhones,
in-app browsers), in Fidelity mode and in streamed scenes:

- The metallic-roughness model: base colour, metalness, roughness, normal,
  occlusion and emissive maps, vertex colours, alpha mask and blend, and
  double-sided materials.
- `KHR_materials_clearcoat`, with its clearcoat, roughness and normal
  textures.
- `KHR_materials_sheen`, with colour and roughness textures.
- `KHR_materials_specular`, with specular and colour textures.
- `KHR_materials_transmission`, with its texture: glass that refracts and
  takes its base colour.
- `KHR_materials_volume`, with the thickness texture and absorption
  colour.
- `KHR_materials_ior`, which also changes how much a non-glass surface
  reflects.
- `KHR_materials_iridescence`: thin film, with the strength and thickness
  textures.
- `KHR_materials_anisotropy`: brushed metal, with strength, rotation and
  the direction texture.
- `KHR_materials_dispersion`: rainbow edges in glass.
- `KHR_materials_emissive_strength`, `KHR_materials_unlit`, and
  `KHR_materials_variants` (the default variant).
- `KHR_texture_transform` on every texture: each map can tile, rotate or
  offset on its own, and a second UV set works too, for example ambient
  occlusion on TEXCOORD_1. The texture's wrap mode (repeat, clamp, mirror)
  is honoured.

Fidelity mode also renders punctual lights, node animation, skins and
morph targets.

These limits remain:

- **Phones.** The extension textures are smaller on phones (512 px; 256 px
  for anisotropy and clearcoat-normal maps), at most 24 MB per scene. Past
  that a material keeps its factors.
- **Streamed scenes** carry the extension textures at up to 512 px, and
  anisotropy there follows the surface's UV direction (a `.vpk` has no
  tangents).
- **Not in streamed scenes yet:** specular-glossiness.

The full table, per backend, is in the
[Fidelity mode guide](fidelity-mode.md#what-the-viewer-renders). If your file lists such an extension as
*required*, the server relaxes that requirement and builds the scene
anyway; the result notes what was skipped.

## Animated models

Node animation (doors, fans, turntables — anything a clip moves as a
whole) and skinned meshes (rigged figures) play in the streamed scene, at
any file size, on every device; the first clip plays on open and the clip
bar switches, pauses and scrubs. In Fidelity mode everything plays,
morph targets included. Not carried by the streamed path: morph targets
(blend shapes), and skins with more than 256 joints — a model that needs
those is published in **compatibility mode** (the whole model as one
download) so it still plays, as long as the file is under about 96 MB.

## Who can open the link

Anyone with a current browser. Browsers with WebGPU — Chrome, Edge,
Safari 26, Firefox on Windows and macOS — get the full picture. Others
(older iPhones and iPads, many in-app browsers) get a WebGL2 build that
streams the same scene, with walk, tour, review pins and video export,
and the same studio lighting, sun and contact shadows, bloom,
optional ambient occlusion, per-room reflection probes, real-time GI and
uploaded HDR backgrounds. Still WebGPU-only: path-traced stills,
screen-space and ray-traced reflections, temporal upscaling, HDR display
output and Gaussian-splat captures. The full
table is in [Browser support](../browser-support.md).

## What the preflight checks

Before uploading, the app reads only the head of your file and reports:

- **Red — blocks the upload:** over the size limit; not a format we read; a
  model that references files that were not uploaded; no meshes; lines or
  points instead of triangles; a compression we cannot decode; a damaged or
  truncated file.
- **Amber — you can continue:** more triangles or textures than we
  recommend; textures larger than 2K; a build likely to be long; a material
  feature that will be skipped; animations on a model too large for
  compatibility mode (it is built static).
- **Green:** what it found — meshes, triangles, textures, animations that
  will play — and how long the build should take.
- **What is this?** the classification (product / scan / interior /
  building / BIM / point cloud), its evidence, and the road it will take —
  correctable with one tap.
- **How should it look?** a studio preset and background for a product;
  the Lighting choice for a scene.

The server runs the same checks — and the same classifier — again on the
bytes that arrive, so API and exporter uploads get the same answers (see
[the API reference](../api.md#friendly-errors)).

## While it builds

- **Time left** is a real countdown ("About 6 min left"). It never counts
  up; if a build overruns its estimate the app says so. A Fidelity upload
  is live in seconds and the app says so.
- **If a build struggles, it heals itself.** A build that runs out of
  memory or time is retried automatically — up to three attempts — with
  lighter texture settings. You will see a note such as "rebuilding with
  lighter texture settings — no action needed". Nothing else about the
  scene changes.
- **You always get a working link.** Every finished scene is checked before
  it goes live. If a build cannot be made to work even with the lightest
  settings, we publish your model in **compatibility mode** instead: the
  same model at full quality as one larger download (for models up to about
  96 MB). The app tells you when that happened.
- **A dropped connection is not an error.** Uploads resume by themselves
  from where they stopped — through Wi-Fi drops and server restarts. You
  will see "Reconnecting — your upload is safe".
- **You do not have to wait.** Leave your name, phone number and email in
  the app and we will email you the link when the scene is live. The build
  carries on if you close the tab. (Email is set up by whoever runs the
  server; where it is not, the app says so and the team follows up.)

## If something goes wrong

Every failure is explained with a title, a reason and what to do next —
never a raw error. If the message says the problem is on our side, the team
is alerted (where the operator has connected alerts) and the same file is
worth trying again.
