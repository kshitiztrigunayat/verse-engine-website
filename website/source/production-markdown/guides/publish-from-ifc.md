# Publish from IFC or USD

Upload the building model or the USD scene you already have and get a
share link where every object can be clicked for its properties and every
storey switched off. Nothing to convert on your side.

## What to upload

| You have | Upload | What comes out |
| --- | --- | --- |
| A BIM model from Revit, ArchiCAD, Tekla, Allplan, BricsCAD, Bonsai/BlenderBIM… | the `.ifc` file (IFC2x3 or IFC4) | one object per product with its **GlobalId, IFC type, name, storey and property sets** (Pset_*, quantities, type psets) |
| A USD scene from Omniverse, Houdini, Maya, Blender, Reality Composer | one self-contained `.usdz` (recommended), or a single `.usd` / `.usda` / `.usdc` | one object per Mesh prim with its **prim path and name**, grouped by the Xform below the root; MaterialX (OpenPBR / standard_surface) or `UsdPreviewSurface` materials and the textures inside the file |

Both go through the same door as a GLB: the upload screen (drop the file),
`POST /v1/ingest` (the bytes are recognised; `X-Verse-Kind: ifc` or `usd`
is optional), or `@ctruhtech/verse-sdk`:

```js
const { job } = await verse.upload(file, { kind: "ifc", name: "tower-b" });
const rec = await verse.waitForJob(job, { onStage: (s) => console.log(s) });
// rec.url      → the share link
// rec.propsUrl → the object index (per node: id, type, name, storey, props)
// rec.convert  → { kind, schema, products, triangles, materials, storeys, seconds }
```

The build shows a **converting** stage with the product count, then the
usual prepare → compile → sign → verify ladder. Limits are the ordinary
ones (512 MB one-shot, resumable above that); conversion has a 15-minute
budget.

## In the link

- **Click an object** — the marker names it and the *Objects* panel opens
  on its type, storey, id and property sets.
- **Objects panel** (the stacked-layers button in the header): a tree by
  storey, then by type, then product. Tick a storey or a type off to hide
  it — hidden objects are dropped before the renderer's visibility test,
  so a hidden floor costs nothing. *Isolate* keeps only the selected
  object; *Show all* restores. Search by name, GlobalId, type or storey.
- **Deep link** — *Copy link* in the panel, or add `?select=<GlobalId>`
  (USD: the prim path) to the share URL; the link opens on that object and
  orbits onto it.
- Works in both tiers (WebGPU and WebGL2), in the playground and in embeds.

## Embedding

```html
<div id="model" style="height: 480px"></div>
<script src="https://HOST/embed.js"></script>
<script>
  const v = Verse.embed(document.getElementById("model"), { vpk: "ingest/tower-b-1a2b3c4d5e6f.vpk" });
  v.on("objects", ({ count, storeys, types }) => console.log(count, storeys, types));
  v.on("select", ({ object }) => showPanel(object));          // click → the object's record
  const index = await v.getProperties();                        // the whole index
  const wall = await v.getProperties("2O2Fr$t4X7Zf8NOew3FLOH"); // one object
  v.setVisible(index.storeys.find((s) => s.name === "Level 2").nodes, false);
  v.isolate(index.types.IfcDoor);                               // only the doors
  v.setVisible("all");
  v.select(wall.id, { frame: true });
</script>
```

The props sidecar is also plain JSON: `GET /ingest/<id>.props.json`
(private scenes: the owner's token or a share token, exactly like the
scene). Its shape is documented in [docs/api.md → IFC and USD](../api.md#ifc-and-usd-2-7).

## Getting a good result

- **IFC**: export with geometry (the "Coordination View" / "Reference
  View" MVDs are fine) and the property sets you want to see. Spaces,
  openings, annotations and grids are left out on purpose. Products
  without a surface style take a palette by type (walls light, slabs grey,
  doors wood, windows glass) so an unstyled model still reads as a
  building; styled colours are kept. Large georeferenced models are moved
  to the origin.
- **USD**: pack a `.usdz` so the textures travel with the layer.
  References, payloads and sublayers that point at files *outside* the
  upload are not followed — flatten the stage first (`usdcat --flatten`,
  or export a USDZ). Mesh prims are read with their materials: a
  **MaterialX** network (`ND_open_pbr_surface_surfaceshader` from Blender
  4/5, Houdini, Omniverse; `ND_standard_surface_surfaceshader` from Maya /
  Arnold) wins over the `UsdPreviewSurface` written beside it. Base colour,
  metalness, roughness, normal and emission (with its strength) map to
  glTF PBR; coat, fuzz / sheen, transmission, specular weight / colour and
  IOR become the matching `KHR_materials_*` extensions, which render as
  listed in [what is rendered](what-you-can-upload.md#what-is-rendered)
  (clearcoat, sheen, transmission and emission strength on both roads;
  specular tint in Fidelity mode only — a streamed surface shows its base
  material there). Separate metallic and roughness textures are packed into
  one. A Z-up stage is stood upright and `metersPerUnit` applied (a
  centimetre stage lands in metres). Not read: skinning, animation, point
  instancers, subsurface, thin film. Files over 160 MB use the 64-bit
  converter (the 436 MB Intel Sponza `.usda` converts in 7 s).
- The viewer keeps one detail hierarchy **per product**, so a model with
  tens of thousands of tiny products streams more roots than a merged
  mesh would; group furniture or hardware at export time if the first
  view is slow to settle.
- Need the lighting baked too? Both inputs end up as ordinary GLB scenes,
  so [Bake for me](bake-for-me.md) applies when the file carries lights.

## When it does not work

| Message | Why | What to do |
| --- | --- | --- |
| *This file isn't an IFC or USD we can read* (`bim_invalid`) | the bytes are not IFC/USD, the IFC has no products with geometry, or the USD has no Mesh prims | re-export with geometry; for USD flatten the stage |
| *We couldn't convert this file* (`convert_failed`) | the converter crashed or ran past 15 minutes | try again; if it repeats, export GLB from your tool and send us the file details |
| objects without a storey | the IFC does not contain them through `IfcRelContainedInSpatialStructure` (or an aggregate of a contained element) | they are listed under *No storey* in the panel |
