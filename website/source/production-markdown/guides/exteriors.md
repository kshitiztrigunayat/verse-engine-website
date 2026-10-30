# Exteriors — sky, weather, fog and ground

*A villa, a tower, a street: an exterior needs a sky over it, ground under
it and, when the pitch calls for it, weather. The exterior kit (2.7) adds
all three to any scene, on every device, without a recompile.*

## What you get

| Feature | What it does | Where it works |
| --- | --- | --- |
| **Physical sky** | A daylight dome (Preetham model) placed by the **Sun** panel: noon is blue, evening warm, the horizon hazes with turbidity. Its light also fills live-lit surfaces (the ambient follows the sun). A procedural cloud layer with coverage and density scrolls with the wind. | WebGPU and WebGL2. Baked (lightmapped) scenes keep their bake and only get the backdrop. |
| **Weather** | Rain streaks or snowflakes falling around the visitor; rain also wets upward-facing surfaces (darker, glossier). | WebGPU and WebGL2 (wet response: streamed scenes on both, classic GLBs on WebGPU). |
| **Fog** | Height fog — dense at a chosen height, thinning above — in a colour of your choice. | WebGPU and WebGL2. |
| **Ground** | A grass / asphalt / sand / custom-coloured plane under and around the model, sun-shadowed, fading to the horizon; or a heightfield (a PNG you upload) with real relief. **Walkable**: visitors stand on it. | WebGPU and WebGL2. |

## Try it in a link

Every knob is a share-string, so you can preview without saving:

```
/?vpk=ingest/<id>.vpk&sun=140,25,3&sky=3,1,0.4,0.6
/?vpk=ingest/<id>.vpk&sky=2.5&weather=rain,0.7,2&fog=0.02,0,8fa3bf,0.2
/?vpk=ingest/<id>.vpk&sky=4,1,0.8,0.7&weather=snow,0.5,1&ground=grass,120
```

| Knob | Values |
| --- | --- |
| `sky=` | `turbidity,exposure,coverage,density[,atmosphere[,aerial]]` — turbidity 1 (alpine) … 10 (hazy), exposure around 1, cloud coverage and density 0–1. A bare `sky` turns it on with defaults; `sky=0` off. The optional `atmosphere` picks the clear-sky atmosphere model instead of Preetham (deeper blue overhead, a thin pale horizon, warm glow round the sun, warm sunlight); `aerial` (0–8, 1 = clear air) then hazes distance the way real air does. Big exteriors (township-scale sites) open with `atmosphere,1` by default. |
| `weather=` | `rain\|snow\|none,intensity,windX[,windZ]` — intensity 0–1, wind in m/s. |
| `fog=` | `density,height,rrggbb[,falloff]` — density 0.005 (a hint) … 0.1 (thick), height in metres, falloff how fast it thins above. `fog=0` off. |
| `ground=` | `grass\|asphalt\|sand\|rrggbb,size[,y]` — size in metres (default 60), `y` the ground height (default: just under the model). `ground=none` off. Heightfields come from the saved experience, not the link. |

The Sun panel's `?sun=` sets where the sun is; the sky follows it.

## Author it and save it

1. Open the scene as its owner with `?author=1` (a signed-in Studio
   session). Beside **Sun** in the toolbar there is **Exterior**.
2. **Sky** — tick *on*, drag turbidity (crisp → hazy), exposure, clouds.
   Move the sun in the Sun panel and watch the dome and the ambient follow.
3. **Weather** — pick rain or snow, set intensity and wind. Rain darkens
   and polishes floors and roofs; walls stay dry.
4. **Fog** — tick *on*, set density, the height it sits at, how fast it
   thins, and its colour.
5. **Ground** — pick *plane*, a material and a size; leave *Height y*
   empty to sit just under the model. For relief, pick a PNG (≤ 4096 ×
   4096, the red channel is the height, white = `Relief` metres up),
   press **Upload**, and the kind switches to *heightfield*. Click
   **Walk** — you are standing on it.
6. In the Author bar tick **Save the exterior (sky, weather, fog, ground)
   with this experience**, press **Save**, then **Set as link default**.
   The plain share link now opens with your exterior; the link also
   carries the knobs while you work, so a copied URL previews the same
   look.

The heightfield lives beside the scene as `ingest/<id>.ground.png` (API:
`PUT /v1/scenes/<id>/ground`, SDK: `scenes.setGround`) and follows the
scene's visibility and version rules.

## Embeds

```js
const viewer = Verse.embed(el, { scene: "<id>", exterior: { sky: "3,1,0.4,0.6", ground: "grass,120" } });
viewer.on("exterior", (e) => console.log(e.state.sky, e.query));
viewer.setExterior({ weather: { kind: "rain", intensity: 0.6 } });
viewer.setExterior(null); // everything off
```

## Good to know

- **Baked scenes.** A lightmapped scene keeps its own light; the sky is a
  backdrop there, and the ground is still lit live. For a sky-lit look,
  bake with the sun you want, or upload the live-lit file.
- **Interiors.** Rain and snow fall through roofs (the sheet has no
  collision) — leave weather at `none` inside, or use fog alone.
- **Clouds** are a 2D layer: they move and light with the sun but cast no
  shadows on the ground.
- **Ground** is one square; it receives the sun's shadow but casts none,
  and it fades to the horizon rather than ending at an edge.
- **WebGL2** draws everything; its classic-GLB meshes (not streamed scenes)
  skip the wet response.
- Values are clamped engine-side; a link with a junk knob still renders.

Gate: `web/test/fix-verify-exterior.mjs` (ports 8870–8879).
