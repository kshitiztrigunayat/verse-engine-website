# Tune quality knobs

Every quality decision in the viewer has a URL knob. Append them to any
playground or share link (`https://HOST/?vpk=ingest/<id>.vpk&ssr=1&hdr=0`)
to A/B a look, pin a result for a client, or bisect a performance problem.
Nothing here is required — the defaults are tuned per device tier (tier A:
WebGPU on a desktop-class GPU; tier B: WebGPU on a phone or tablet; tier C:
the WebGL2 build — [Concepts](../concepts.md#tiers-what-each-device-gets)) — but a
link **with** a knob always renders the same way, which is what you want
when you send one.

## The table

| Knob | Values | Default | Use it when |
| --- | --- | --- | --- |
| `?ssr=` | `0`…`1`, or bare `?ssr` | auto: `0.5` on bake-dominant archviz scenes, `0` elsewhere (tier A only) | Glossy floors and tables should mirror the room. Half-resolution screen-space reflections; `0` kills the pass, `1` is strongest. Off on tier B regardless. |
| `?sheen=` | `0`…`1`, or bare `?sheen` (= `0.15`) | off | A fully-baked (unlit) scene reads flat and dead on glossy furniture. Adds a low-intensity IBL specular over lightmapped materials without touching the bake's colours. |
| `?hdr=` | `auto` · `1` · `0` (+ `?hdrpeak=` 1–8, default 2) | `auto` in the playground, SDR in embeds | On an HDR display, hot speculars and emissives past 1.0 should use real headroom (`auto` enables when the panel reports `dynamic-range: high` **and** the device is tier A). `0` pins SDR — set it for anything destined for SDR screens, including video exports. `1` forces the float16 surface anywhere. |
| `?exposure=` | EV stops (clamped ±4) or `auto` | `0` | The scene is too dark or too hot as authored. `auto` is a one-shot scene-adaptive nudge toward mid-grey; a number is a fixed offset you can put in a link. |
| `?env=` | `studio` · `sky`, optionally `,<intensity>` | `studio` | Lit (non-baked) scenes: `studio` is a three-softbox rig that flatters products; `sky` is the outdoor preset. `env=sky,1.5` brightens the environment 1.5×. Ignored by bake-dominant scenes (their lighting is the bake). |
| `?post=` | `full` · `lean` | tier A `full`, tier B `lean` | Tier B defaults to a lean post chain (depth of field and bloom skipped, TSR kept) for frame time. `post=full` opts a tier-B device back in; `post=lean` forces lean on tier A to measure the cost. |
| `?render=` | `demand` · `continuous` | `continuous` (playground), `demand` (embeds and devices on battery) | `demand` renders only while something changes — input, tours, animations, streaming refinement — and parks the loop otherwise, so a still viewer costs ~zero battery. The HUD fps reads "idle" when parked. `continuous` is the classic every-vsync loop. |
| `?profile=1` | flag | off | You need to know where frame time goes. Per-pass GPU timings in an overlay and `window.__versePassMs` (`cull`, `vg-cull`, `shadow`, `sky+ext`, `main-a` (mesh opaques), `vg-depth` (streamed depth prepass + alpha cut), `vg-opaque`, `hiz+cull2`, `main-b`, `oit`, `ssao`, `ssr`, `tsr`, `bloom`, `blit`, `frame`); the `frame` row is the honest total on tile-based GPUs, where passes overlap. While profiling, main pass A is split at those draw groups (a few tile loads/stores more). Tier C reports `shadow`, `sky+ext`, `main-a`, `vg-opaque`, `transparent`, `post` through `EXT_disjoint_timer_query_webgl2` where the browser exposes it. |
| `?upscale=` | `0` · `1` | on for a `.vpk` ≥ 512 MB on WebGPU (tier A, B) | Temporal upscaling for big scenes: TSR (jittered, history-reprojected, neighbourhood-clamped, sharpened) replaces 4× MSAA, the scene renders at ≤ 0.75 of native while the camera moves and climbs back to native when it is still. `0` keeps MSAA; `1` turns it on for any scene. |
| `?scale=` | `0.5`…`1` | dynamic (DRS) | A/B tests and screenshots. Pins the internal render scale and disables dynamic resolution; `scale=1` vs `scale=0.6` separates pixel-bound passes from resolution-independent ones. Video export pins it to 1 for you. |
| `?tbn=1` | flag | off | Classic (non-streamed) PBR models with normal maps over irregular or sheared UV unwraps. Shades from the authored or mikktspace vertex tangent frame instead of the screen-space cotangent frame. Measured a wash on the reference helmet, which is why it is opt-in. |
| `?vgflat=0` | flag | on | You want to see the streamed scene's early frames exactly as the final texture would render them. Default `on` shades the first, coarse clusters with their baked flat colour so the first seconds read as a soft clay model with correct colours instead of shattered texture glass; `0` disables that early-shading pass. |

Related knobs in the same family: `?ssao=0` / `?ao=<strength>[,<radius>]`
(ambient occlusion), `?dof=<focus m>,<aperture>` (depth of field),
`?sun=<azimuth>,<elevation>[,<intensity>]` (time of day, moves shading and
shadows together), `?material=<idx>:<rrggbb>;…` (finish variants),
`?oit=0` (in-pass alpha instead of order-independent transparency),
`?tier=c` (force the WebGL2 fallback), `?quality=4k` / `?temporal=1`
(temporal super-resolution).

Quality switches: `?gi=0` (real-time GI off), `?vt=0` (the pre-virtual-texturing
texture path), `?refl=0` (per-room reflection probes off — the environment
reflections instead), `?rt=1` (ray-traced reflections, opt-in, desktop
WebGPU only; never on WebGL2 or phones), `?gamut=p3|srgb` (pin the canvas
gamut) and `?tonemap=agx` (the AgX tone curve, beside ACES and Khronos PBR
Neutral).

## Recipes

**Archviz client link (baked interior).** The defaults already give SSR
on bake-dominant scenes. For a link that renders identically on every
client screen: `&ssr=0.5&hdr=0&sheen=0.15`.

**Product on a white studio background (lit GLB).** `&env=studio,1.2&exposure=0.3&tbn=1`
if the asset's normal map has a hard-seam unwrap; drop `tbn` otherwise.

**Something looks wrong — is it the engine or the display?** Add
`&hdr=0&scale=1&post=full`. If it still looks wrong, it is content or a
bug; screenshots are tone-mapped to SDR and prove nothing about HDR.

**Frame time on a laptop GPU.** `&profile=1&scale=1`, read the `frame`
row, then `&scale=0.6`: if `frame` barely moves, the cost is in
resolution-independent passes (`cull`, `vg-cull`) and DRS cannot help.

**Battery-friendly kiosk.** `&render=demand` — the engine parks between
interactions; streaming and the heartbeat keep running.

## In an embed

The SDK exposes the user-facing subset as options rather than URL knobs:
`render` (`"demand"` default), `hdr` (SDR default — your page's colours
never shift uninvited), `quality: "4k"`, and verbs for the look —
`setExposure(ev)`, `setSun()`, `setMaterial()`, `setDepthOfField()`,
`setEnvironment(url)`. See the [Embed SDK reference](../embed-sdk.md).

## What the knobs are measured against

The lit path is gated against Blender EEVEE ground truth (`web/test/fidelity-lit.mjs`,
64×64 mean ΔE76 below 9 per view, achieved 1.7–7.0 on the scripted
subjects), and the baked path against the source bake itself
(`web/test/fidelity.mjs`, ΔE below 6). SSR has its own locality and energy
gate (`web/test/fix-verify-ssr.mjs`) because the references were rendered
without reflections. Goldens and both fidelity harnesses run in SDR, so
`?hdr` never changes a tested pixel.
