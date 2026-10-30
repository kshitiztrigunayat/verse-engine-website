# Restyle a space, live

*You are walking through a home and want to see it Scandinavian, or
Japandi, or with marble floors. Tap a style and the floors, walls,
counters, fabrics and skirting change in place on every device, with
nothing re-uploaded. People, plants, glass, screens and lamps stay as
they are.*

## Where it is

- In the toolbar: **Restyle**. The panel shows **Original** and six
  styles: Scandinavian, Japandi, Luxury Marble, Indian Contemporary,
  Industrial and Coastal. Each one has a small swatch of its floor.
- Every preset upholsters the sofa in a real fabric colour, matte
  (roughness 1, no sheen): oatmeal for Scandinavian, sand for Japandi,
  champagne for Luxury Marble, terracotta for Indian Contemporary, tobacco
  for Industrial and sea blue for Coastal. The tints are solved in linear
  light against the weave's own mean colour. The grey linen weave times a
  near-white tint used to give a grey sofa in most styles.
- The text box takes plain words: `Scandinavian`, `luxury marble`,
  `Indian contemporary`, `marble floor`, `dark wood cabinets`,
  `sage green walls`, `warmer lights`, `evening`. They are understood on
  the device, so no AI service is involved and the same words always give
  the same result.
- **Hold: before** shows the original while you hold it down. **Undo**
  steps back one change. **Copy link** copies a link that opens with the
  style you have on screen.
- **Clip 9:16 / 16:9** records a 15-second before-and-after clip (on
  desktop only).

## What changes, and what never does

Every material in the file gets a *role* from its name and from where its
surfaces sit (how much faces up or sideways, how high it sits, how big it
is). The compiler writes these facts into the scene, so the viewer reads
them when the scene opens and does not have to scan anything.

| Restyled | Never touched |
| --- | --- |
| floors (wood, stone, tile), walls (paint, plaster, stone), ceilings, skirting, counters, cabinets and joinery, upholstery, leather, rugs, curtains, metal trim | glass and mirrors, people, plants, screens, lamps and emissive surfaces, decor (books, art, vases), anything the classifier is not sure about |

A style swaps in a texture from the built-in material library
(26 CC0 sets from ambientCG; see [attributions](../attributions.md)). The
texture is laid out in world metres from three directions (triplanar
mapping), so a plank is a plank wide on every floor whatever the file's
UVs look like. It does not stretch on badly unwrapped meshes, and there
are no seams where one mesh meets another. Paint styles are a flat
colour with the room's lighting kept. On a baked scene the new surface
keeps the bake's light and shadow, because the bake's brightness is
carried over.

Each style also sets a lighting mood through the light studio: exposure,
environment fill and a white balance (warmer or cooler). The sun stays
where the scene or the **Sun** panel put it.
The white balance applies to the room's surfaces only. Glass, people and
plants keep their colour.

## Speed

The first time a style is used, its textures are fetched (about 60 KB
each, 512² JPEG) and uploaded. After that a switch between styles takes
less than 300 ms, crossfade included (on WebGPU and on WebGL2; measured by
`web/test/fix-verify-restyle.mjs`). Streamed scenes use 8 of the 12
layers in the media texture array (the other 4 hold video screens).
Classic and Fidelity scenes have 16 slots of their own. When a slot is
needed, the style used longest ago gives up its slot.

## Links

`?style=` carries the look, for example:

```
/app?vpk=…&style=japandi
/app?vpk=…&style=japandi;floor-stone=marble-white;floor-stone.r=0.15;w=0.60
```

A preset id comes first, then any per-role changes (`role=set`,
`role.t=rrggbb` tint, `role.r=` roughness, `role.m=0|1` metal) and the
mood (`ev=`, `env=`, `w=` warmth −1…1).
The address bar follows every change, so the link people copy always
carries the current look.

## Tour together

In a live tour room, a host who restyles changes the look for everyone.
The change goes to the room as the presenter action
`{ name: "style", detail: { style: "<the ?style= value>", query: "<same>" } }`
(`style` is the field the presenter reads; `query` is kept for older
clients). Followers apply it through `window.__verseSetStyle(style)`,
which goes through the same path as the panel. An empty style restores
the original.

## For generators and modellers: the naming contract

When the material names follow the pattern below, the role comes from the
name before any guessing. The Verse Home generator (plan-to-home) uses
this pattern. Names are split on `_`, `-`, `.`, spaces and camelCase,
numbers are dropped, and matching ignores case.
The **first word** decides the role. A later word can choose a material
family:

| Material name | Role |
| --- | --- |
| `floor_<room>` | floor-wood |
| `floor_<room>_tile` (also `ceramic`, `porcelain`, `mosaic`) | floor-tile |
| `floor_<room>_stone` (also `marble`, `granite`, `concrete`, `terrazzo`, `travertine`) | floor-stone |
| `wall_<room>` | wall-paint |
| `wall_<room>_plaster` (also `render`, `stucco`, `limewash`) | wall-plaster |
| `wall_<room>_tile` (also `stone`, `marble`, `brick`, `concrete`) | wall-stone |
| `ceiling_<room>` | ceiling |
| `skirting[_<room>]`, `baseboard` | skirting |
| `counter[_<room>]`, `countertop`, `worktop`, `benchtop` | countertop |
| `cabinet_…`, `wardrobe_…`, `door_…`, `joinery_…`, `shelf_…`, `table_…`, `desk_…` | cabinet-wood |
| `sofa_…`, `chair_…`, `armchair_…`, `bed_…`, `cushion_…`, `fabric_…` (add `_leather` for leather) | upholstery-fabric / leather |
| `rug_…`, `carpet_…` | rug |
| `curtain_…`, `drape_…`, `blind_…` | curtain |
| `metal_…`, `trim_…`, `handle_…`, `tap_…`, `fitting_…` | metal-trim |
| `person_…`, `people_…`, `figure_…` | people (protected) |
| `plant_…`, `tree_…`, `foliage_…` | plant (protected) |
| `glass_…`, `glazing_…`, `window_…`, `mirror_…` | glass (protected) |
| `screen_…`, `tv_…`, `monitor_…` | screen (protected) |
| `light_…`, `lamp_…`, `emitter_…`, `bulb_…` | light (protected) |
| `decor_…`, `art_…`, `vase_…`, `book_…` | decor (protected) |

Examples: `floor_kitchen_tile`, `wall_living`, `wall_bath_tile`,
`ceiling_bedroom_2`, `skirting`, `counter_kitchen`. Give each room its
own floor, wall and ceiling materials so a later "marble in the kitchen
only" can address one room. A material with transmission (or blended
with alpha under 0.6) is always glass, whatever its name.

Verse Home's generator uses the contract as is, with
no new roles: sofas, beds, cushions and dining-chair seats are
`sofa_fabric` / `cushion_fabric_accent` / `bed_linen`; drapes are
`curtain_drape`; kitchen shutters `cabinet_kitchen_shutter`; table tops
`table_top`; the TV feature wall is `joinery_feature_<room>` (wood slats) or
`wall_<room>_feature_marble` / `_concrete` (stone); rug borders
`rug_border`; lamp shades, the cove LED and downlights `lamp_shade`,
`light_cove`, `light_downlight` (protected); the furniture pack's models
keep `decor_…` names except a chair's legs (`cabinet_wood_…`), so a restyle
changes the soft goods, joinery and surfaces and leaves the hero pieces,
art and plants as photographed. The window view is `decor_view_city`, and
any `decor_view_…` material is scenery to the compiler too (no collision,
outside the walk grid).

Files that do not follow the pattern are still classified, from words in
the name (`Wood_Floor`, `Parquet`, `White Paint`, `linen`) and then from
geometry: a large up-facing surface at floor level is a floor, a tall
sideways one is a wall, and a large down-facing one at the top is a
ceiling. Anything uncertain is left alone.

## Programmatic

- `window.verseApp.restyle({ preset: "japandi" })` and
  `window.__verseRestyle.apply(action)` (dev and staging; production keeps
  the app's plumbing off `window` — handover/production-hardening.md, tier
  2) take a restyle action:
  `{ preset?, changes?: [{ role, set?, flat?, tint?, tintMul?, roughness?, metal? }], lights?: { ev?, env?, warmth?, sun?: [azimuth, elevation, intensity] }, reset?, undo? }`
  (a `sun` here moves the sun until the style is cleared).
  Unknown roles, library sets and out-of-range values are dropped.
- `window.__verseRestyle.say("marble floor, warmer lights")` runs the same
  free-text grammar as the panel.
- `window.__verseRestyle.roles()` lists every material with its role, a
  confidence and the reasons, so you can see why `Floor_02` became
  `floor-wood`.
- A `verse-restyle` window event fires on every change
  (`detail: { name: "style", query, state, ms }`).

## Gate

`web/test/fix-verify-restyle.mjs` checks the grammar, the naming
contract and the classifier. On the unbaked two-room interior (with a
person, a plant and a glass partition added) and on the villa when it is
present, it checks on tier A and on tier C (phone class): every panel
style visibly changes the floor and the walls; glass, people and plants
match the same lighting mood applied on its own; tier C matches tier A;
switches take ≤ 300 ms; memory stays ≤ 256 MB on a phone; there are no
console errors; Original restores the first frame; the room action and
the `?style=` link reproduce the host's frame. Frames are saved to
`web/test/out/restyle/`.
