# Build a configurator

Let a buyer choose the fabric, the legs and the size — on the real scene,
in a frame, with the price updating and a link that opens exactly what
they picked. The scene stays one upload; the choices are a schema you
author in Studio.

**You need:** a Studio account, a streamed scene you own
(`ingest/<id>.vpk`), and a model whose variations are either
`KHR_materials_variants` (what Blender / Substance / most DCC exporters
write) or simply extra materials you can point at.

## 1. Prepare the model

Two ways to express a choice, mix freely:

- **Material variants.** Author `KHR_materials_variants` in the file (in
  Blender: the Material Variants panel). The compiler carries the table
  into the scene; each variant name becomes something an option can apply.
  A variant may swap several materials at once — that is one option.
- **Extra materials.** Give the alternative look its own material on a
  hidden or duplicate primitive, or just leave it unused in the file.
  An option can then say *material 4 draws as material 7*
  (`materials: {"4": 7}`), in any combination — multi-material groups
  without touching the exporter.
- **Show / hide.** An option can black out materials (`hide: [4]`) — "no
  armrest", "without the canopy". Honest limit today: the surface turns
  black rather than disappearing (the engine has no per-material hide
  lane yet; the hidden mask from the BIM work replaces it).

Material indices are the glTF order; Studio shows them with names next
to the fields.

## 2. Author the groups in Studio

Open `/studio`, find the scene card and press **Configurator**.

1. **Add group** — name it ("Fabric").
2. **+ option** per choice — name it ("Walnut"), pick the variant it
   applies from the dropdown and/or type aliases (`4→7, 5→7`) and/or the
   materials to black out (`4, 5`). Add a **SKU** and a **price** if you
   want the panel to total them (the price is a label — Verse never
   bills anyone).
3. The first option of each group is the default. Set a **currency** and
   a **base price** at the top if you want a running total.
4. **Save configurator**, then **Try it in the viewer**.

Everything is validated on save with the same code the viewer renders
with; a variant name that is not in the scene is dropped with a warning
rather than saved broken. Prefer the API? It is one call:

```sh
curl -sS -X PUT https://HOST/v1/scenes/SCENE/config -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{
  "currency": "USD", "base": 890,
  "groups": [
    { "name": "Fabric", "options": [
      { "name": "Oak",    "variant": "Oak" },
      { "name": "Walnut", "variant": "Walnut", "price": 120, "sku": "SOFA-WAL" } ] },
    { "name": "Legs", "options": [
      { "name": "Steel", "materials": { "4": 7 } },
      { "name": "None",  "hide": [4], "price": -40 } ] } ] }'
```

Ids are slugged from the names (`fabric`, `walnut`); set your own `id`s
when they must stay stable across renames.

## 3. What visitors get

A **Configure** chip in the toolbar opens the panel: one row of chips per
group, a swatch from the material it applies, the option's price, and the
total at the bottom. Every pick changes the scene in a frame — no
re-stream — and rewrites the link:

```
https://HOST/?vpk=ingest/<id>.vpk&cfg=fabric:walnut,legs:none
```

Only non-default picks are in the string, so a plain link still opens the
default. Send that link, put it in a quote, paste it into the CRM.

## 4. In your own page

The embed SDK keeps the panel out of the iframe and gives you the data:

```html
<div id="sofa"></div>
<script src="https://HOST/embed.js"></script>
<script>
  const viewer = Verse.embed(document.getElementById("sofa"), { scene: "SCENE", cfg: { fabric: "walnut" } });
  viewer.on("configuration", (c) => {
    // c.groups: [{ id, name, default, options: [{ id, name, price?, sku?, swatch? }] }]
    renderYourSwatches(c.groups, c.selection);
    total.textContent = c.priced ? `${c.total} ${c.currency}` : "";
    addToQuote.dataset.skus = c.skus.join("+");
    share.href = `https://HOST/?vpk=ingest/SCENE.vpk&cfg=${c.cfg}`;
  });
  fabricSelect.onchange = () => viewer.setConfiguration({ fabric: fabricSelect.value });
</script>
```

`getConfiguration()` returns the same shape on demand. TypeScript users get
`VerseConfiguration` from `verse-embed.d.ts`; server-side,
`@ctruhtech/verse-sdk` has `scenes.config(id)`, `scenes.setConfig(id, schema)` and
`shareLink(id, { cfg })`.

## 5. Hear about changes

Add a webhook in Studio (**Webhooks**, bottom of the library) with the
`config.changed` event and your endpoint receives a signed POST whenever
the schema is saved — handy for keeping a product catalogue in step. See
[docs/api.md § Webhooks](../api.md#webhooks-2-7) for the signature recipe.

## Limits

- 16 groups × 32 options; a later group wins a material conflict.
- Visibility is a black-out, per material (see above).
- Prices and SKUs are display only; checkout is yours.
- Classic (non-compiled `.glb`) scenes have no schema — compile them.
