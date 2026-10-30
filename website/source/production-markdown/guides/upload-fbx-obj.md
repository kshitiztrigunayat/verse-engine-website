# Upload FBX and OBJ

Upload the FBX or OBJ your tool already exports — 3ds Max, Maya, Revit,
SketchUp, Cinema 4D, Unity, Unreal, Blender — and get a share link. We
convert it to glTF on our side, then it takes the same road as a GLB:
right-sized, classified, and shown in [Fidelity mode](fidelity-mode.md)
(a product) or streamed (a room, a building, a street).

## What to upload

| You have | Upload |
| --- | --- |
| an FBX with its textures **embedded** (Max/Maya "Embed Media", Blender "Embed Textures") | the `.fbx` |
| an FBX whose textures are separate files | a **`.zip`** with the `.fbx` and its texture folder, as the exporter left them |
| an OBJ | a **`.zip`** with the `.obj`, its `.mtl` and the textures. An `.obj` alone converts, with plain colours |

- **FBX**: binary or ASCII, FBX 2011–2020 (file versions 7.1–7.7).
  FBX 2010 and older (6.x) is refused with a message — re-export as FBX
  2014 or newer.
- **Zip**: standard Deflate or stored entries, no password. Other scene
  files riding along in the zip (`.max`, `.blend`, a USD or glTF copy) are
  ignored; if both an `.fbx` and an `.obj` are inside, the FBX is used
  (send `X-Verse-Kind: obj` to pick the OBJ).
- **Texture paths** in an FBX or MTL often point at the author's disk
  (`C:\Users\…\Textures\Brick.PNG`). They are resolved against the files
  in the zip by name, case-insensitively, wherever they sit in it.

The same door as every format: drop the file on the upload screen (the
**FBX** and **OBJ** chips say *converted on our side*), `POST /v1/ingest`
(the bytes are recognised; `X-Verse-Kind: fbx` | `obj` is optional), or
`@ctruhtech/verse-sdk`:

```js
const { job } = await verse.upload(zipFile, { kind: "obj", name: "bistro", units: "cm" });
const rec = await verse.waitForJob(job);
// rec.url     → the share link
// rec.convert → { kind: "obj", schema, products, triangles, materials, images,
//                 missingTextures, units, size, seconds, … }
// rec.fixes   → "Converted the OBJ on our side (from the zip): 1,306 objects, …"
```

The build shows a **converting** stage (*unpacking the zip* → *reading
the model* → *writing the glTF*), then the usual ladder. Limits are the
ordinary ones: 512 MB per upload (a zip counts at its compressed size),
15 minutes for the conversion (`VERSE_CONVERT_TIMEOUT_S`).

## What comes across — and what FBX / OBJ can't carry

| | FBX | OBJ + MTL |
| --- | --- | --- |
| Geometry, normals, UVs, object names and hierarchy | yes | yes (`o` objects and `g` groups become objects) |
| Units | **from the file** (`UnitScaleFactor`): centimetre files from Max / Maya land in metres | **none in the format**: a model wider than 1,000 units is read as centimetres (wider than 100,000 as millimetres) and the fix line says so; `X-Verse-Units: m \| cm \| mm \| in \| ft` (SDK `units`) overrides |
| Up axis | **from the file** (`UpAxis`): Z-up files stand upright | Y-up, as the format expects |
| Base colour, metallic, roughness, emissive | Phong / Lambert values; **3ds Max Physical**, **Maya Stingray PBS** and **Arnold** base values and maps (colour, normal, metalness, roughness, emission) are read from the file and mapped to PBR | `Kd`, `Ke`, the PBR extension lines (`Pr`, `Pm`, `Ps`, `Pc`) and the `map_*` textures |
| Textures | embedded ones always; separate files when zipped. TIFF, TGA, BMP, DDS and EXR are re-encoded as PNG | when zipped |
| Transparency | `TransparencyFactor` / opacity → alpha | `d` → alpha. `Tf` (transmission filter) is **not** turned into glass — most exporters write `Tf 1 1 1` by default |
| Animation and skins | node animation and skinned meshes play (one clip with every moving object in it); static "Take 001" takes are dropped so a still scene is not published as animated | — (OBJ has none) |
| Lights and cameras | lights come across; cameras are not used | — |
| **Not carried** | renderer-only shaders (V-Ray, Corona, Redshift, Arnold node graphs beyond their base values), procedural maps, displacement, layered materials, photometric (IES) lights, more than one animation take, morph targets (shape keys are kept in the file but the streamed viewer does not play them) | anything beyond the MTL |

Emission strength and the clearcoat of a 3ds Max Physical / Stingray /
Arnold material become the matching `KHR_materials_*` extensions and
render as listed in [what is rendered](what-you-can-upload.md#what-is-rendered).
Phong specular is not PBR data: it is set to the neutral value rather
than turned into `KHR_materials_specular`.

Missing textures never fail an upload: the link builds, those surfaces
keep their colour, and the record names them (`convert.missingTextures`,
and the fix line: *"3 textures the model names were not in the upload
(Brick_Diff.png, …) — upload a .zip with the texture folder to include
them"*).

## How the conversion works (and why Blender)

`tools/model-convert/convert.mjs` unpacks a zip (zip-slip and zip-bomb
guarded), transcodes an **ASCII** FBX to binary, repairs MTL texture
paths, and runs **headless Blender 5.0** (`blender -b`) to import the
model and export glTF. Blender reads binary FBX only, so the ASCII→binary
step is our own (`fbx-ascii.mjs`): ASCII and binary FBX are the same node
tree, so the transcode is lossless — it keeps the 3ds Max Physical and
Stingray properties that an importer round trip would drop.

We measured three converters on the same files before choosing (the gate
fixture: a textured cube, a metallic sphere, an emissive lamp and a
skinned, animated bar, exported metres Y-up and centimetres Z-up; the
Unity *Boat Attack* FBX files from 3ds Max; and the Intel Sponza release,
a 929 MB ASCII FBX with 3ds Max Physical materials, 3.75 M triangles and
144 textures):

| | **Blender 5.0 (chosen)** | FBX2glTF 0.13 (FBX SDK 2020) | assimp 6.0 |
| --- | --- | --- | --- |
| Units and up axis (cm Z-up fixture → 5 × 2.15 × 2 m) | correct | correct | **100× too big** (500 × 215 × 200: no FBX unit conversion) |
| Materials on the fixture | gold metallic 1 / roughness 0.3, lamp emission ×4 — exact | **metallic 0.4 on every material**, roughness from shininess (0.2), duplicated materials | texture darkened (base factor 0.8), metallic lost, extra specular/volume extensions |
| Materials on Unity / Max files | sane Phong mapping | the Unity cliffs **glow white** (emissive 1) | roughness **−0.6** (invalid) |
| ASCII FBX | via our lossless transcoder | read, but the external texture was lost | read |
| OBJ | correct (cm OBJ read as cm by rule) | **100× too small** (0.05 m) | correct, but a phantom default material |
| Animation / skins | kept (one clip) | kept (1-channel stubs per take) | kept |
| Sponza 929 MB ASCII FBX | **72 s, 3.5 GB peak** (zip in, all 28 Physical materials mapped, 95 maps incl. normal / roughness / metalness, 36.2 × 19.9 × 23.8 m) | 182 s (x86 build under Rosetta), 2.9 GB, 49 maps, base colour halved | 26 s but **7.2 GB**, 3,625 m wide, roughness −2.2 |
| Fixture conversion | 0.5–1 s, 220 MB | 0.05–0.12 s, 14 MB | 0.01–0.03 s, 7 MB |
| In the image | +360 MB compressed (pruned Linux build) | +6 MB, but bundles the proprietary Autodesk FBX SDK; x86-only | +10 MB |

Blender is the slowest and largest, and the only one that got units,
axes and materials right on every file — the criteria that decide whether
the link looks like the model. The image cost is in the "In the image"
row above.

## When it does not work

| Message | Why | What to do |
| --- | --- | --- |
| *This FBX or OBJ file isn't one we can read* (`model_invalid`) | not FBX/OBJ bytes, FBX older than 2011, a zip with no `.fbx`/`.obj`, an unreadable file | re-export (FBX 2014+ binary is the safest), or zip the model itself |
| *We couldn't convert this file* (`convert_failed`) | the converter crashed or ran past 15 minutes | try again; if it repeats, export GLB from your tool |
| the model is 100× too big or too small | an OBJ in a unit the rule guessed wrong | upload again with `X-Verse-Units` (SDK `units`) |
| surfaces are flat colours | the textures were separate files and not zipped, or the MTL was missing | zip the model with its texture folder (and `.mtl`) |
