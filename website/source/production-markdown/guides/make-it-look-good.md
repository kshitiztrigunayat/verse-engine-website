# Make it look good

*You uploaded a GLB and nothing looks good: it is dark, flat, the first
view faces a window, and the Lights, Sun and Exterior panels are a lot of
sliders. One button does the whole job — the best picture this engine can
make of your scene, and the best walkthrough — and you can undo it.*

## Where the button is

- In the toolbar beside **Lights** and **Sun**: **Make it look good** (the
  sparkle). One click.
- On the **Ready** card that appears when a scene opens, when the scene is
  live-lit and has no lights of its own — the upload this was built for.
- On a link: add `&auto=1` and it runs when the scene opens. `&auto=0`
  switches it off for that link (nothing is touched, even if the link
  carries a saved look).
- In the embed SDK: `viewer.autoLook()` (see
  [embed-sdk.md](../embed-sdk.md#autolook-opts-undoautolook)).

While it works the chip reads *Looking… view 3/8*, *Looking… sun 7/12*,
*Looking… exposure*. It takes about ten seconds on a laptop: every step
measures the real frame and moves on only when the picture confirms it.

## What it does, in order

1. **Picks the first view.** It stands at each of the auto tour's
   waypoints and at the room's centre facing four ways, and scores each
   view by composition: how much of the frame is the room (surfaces
   between arm's length and the far wall), variety in depth, in surface
   orientation and in materials (a sofa, a table and a plant beat a blank
   wall or a window decal), no near-plane clipping, and — indoors — a
   penalty for every ray that leaves through a window into nothing. The
   horizon is put on the upper third. The best view is where you start.
2. **Measures the frame.** The rendered frame becomes a luminance
   histogram: median, 5th and 95th percentiles.
3. **Fixes exposure.** Up to four steps toward a median of 0.40 with the
   95th percentile under 0.95 (no clipped whites), inside the Lights
   panel's ±4 EV. This alone rescues most "nothing can be seen" uploads.
4. **Checks baked or live.** Environment fill off for one frame: a
   lightmap-baked scene barely changes, a live-lit one goes dark. A
   **baked scene gets the quality knobs and keeps its own exposure** — EV 0
   unless its highlights clip (then down, at most one stop) or it is far
   too dark (then up); never a sun,
   never a fill (the bake is the light).
5. **Places the sun.** Indoors it tries 12 azimuths with only the sun on
   and keeps the one that puts the most direct light on what you see
   (through the openings); outdoors it stands 35° off the model's long
   axis on the camera's side. 32° up. If your file has its own lights or
   emissive materials they are kept and scaled as a group so the median
   lands.
6. **Fill and shadows.** Soft sun shadows (Lights panel's *Shadow
   softness* 3), then the environment fill is raised until the deepest
   shadows clear (5th percentile ≥ 0.04) while the 95th stays under 0.95
   — shadows lifted, contrast kept — and exposure is re-balanced.
7. **Sky for exteriors.** A scene that reads as an exterior (the compiler
   says `open`, or a large open footprint whose depth probe mostly misses
   within 30 m) gets the physical sky at turbidity 2.5, fog off. Interiors
   never get a sky.
8. **Every quality knob the device has.** Ambient occlusion and the mirror
   probe and screen-space reflections (WebGPU only), glass refraction,
   and **Cinematic** path tracing on WebGPU — the walkthrough plays in
   raster, and whenever the camera rests the picture converges to the
   path-traced frame. Full render scale is pinned on re-open (`scale=1`).
9. **Starts the walkthrough.** Your guided tour if you authored one; else
   the auto tour, joined at the chosen view rather than from its start.
   Under *prefers-reduced-motion* the camera stands at the view instead of
   flying. The chip reads **Playing the walkthrough · Stop**.
10. **Keeps it.** The link now carries everything the panels would have
    written (`?lights=`, `?sun=`, `?sky=`, `?ssao=`, `?ssr=`, `?glass=`,
    `?cinematic=`, `?scale=`, the view as `?at=`) plus `auto=1`, so anyone
    opening it gets the lit scene and the walkthrough without pressing
    anything. If you are the scene's **signed-in owner**, the look is also
    saved into the scene's default experience, so the plain link opens lit
    for every visitor.

## The two looks

The routine now picks one of two looks and the **Lights** panel's *Look*
row lets you switch with one tap (no camera move, no walkthrough):

- **Showroom** — the first look for a live-lit interior without authored
  lights (the reception uploaded from Blender). Even, soft, high-key: a
  strong neutral studio fill, a gentle key sun for shape, Khronos PBR
  Neutral tone mapping (the glTF reference curve — off-white walls land
  near white instead of ACES's grey), subtle AO, and a light backdrop
  behind the windows and around the outside view. Exposure is metered on
  the walls: the frame's 90th-percentile luma lands near sRGB 232 without
  the 99th clipping. No sun sweep, no Cinematic (real GI would darken it).
  A room with nothing light to meter on (every surface near black even at
  +2.5 EV) takes daylight instead.
- **Realistic daylight** — the sun + sky look the routine always made:
  the sun sampled over 12 azimuths, environment fill lifted until the
  shadows read, the physical sky for exteriors, Cinematic when it agrees.

Baked scenes get neither (only exposure, as before); scenes with their own
lights stay as exported; exteriors take daylight. `&look=showroom` /
`&look=daylight` on a link pins the choice; the button writes it beside
`lights=` so a shared link opens the same way. Products in Fidelity keep
the studio look they already had.

A first open also frames the outside view like a product viewer: a 35°
lens with the model filling about three quarters of the frame, resting at
a 3/4 angle on the façade side instead of turning on the turntable. Walking
keeps the 55° a room needs. `&framing=0` restores the old framing;
`&fov=` / `&fill=` tune it.

## What it never touches

- Your model, its materials and its textures (nothing recompiles).
- Lightmaps: a baked scene keeps its bake; only exposure and the quality
  knobs move.
- Your authored hotspots, cards and guided tour (it plays them).
- Weather, fog and the ground you set in the Exterior panel (it only turns
  the sky on for exteriors; it turns nothing off).
- Anything a visitor cannot see: it never writes to the server unless you
  are the signed-in owner, and then only the default experience.

## Undo

- Right after a run a small popover under the toolbar shows what was
  chosen (sun, fill, exposure, medians) with **Undo**: lights, sun, sky,
  Cinematic, the quality knobs, the camera and the link go back to the
  state before the click.
- Later: **Lights → Reset** returns every light setting to the file's; the
  Sun and Exterior panels have their own controls; and `&auto=0` on a link
  keeps the routine from running at all.

## What the numbers mean (for QA)

`window.__verseAutoLook.result` holds the whole decision: `before` /
`after` (median, p5, p95), `view` and `composition` (score, coverage,
depth spread, orientation and material variety, misses, candidates),
`sun` and the 12 `sunSamples`, `look` (`showroom` / `daylight`),
`backdrop`, `ev` / `env` / `all` / `soft`, `sky`,
`quality` (ssao, probe, ssr, glass, cinematic, scale), `walkthrough`,
`lights` (the share string) and `persisted`; `steps` is the log. Gates:
`web/test/fix-verify-autolook.mjs` and, for the showroom look,
`web/test/fix-verify-showroom.mjs` (the reception against reference
captures: wall luminance, corner floor, glass, sharpness, idle DRS).

## Unbaked interiors: lighting that bounces

Scenes uploaded without a bake (live materials, "Lighting = Keep as
exported") now get real-time global illumination: light from the
windows, the sun, lamps and glowing materials bounces around the room,
corners darken, colours bleed, a closed room stays dark. There is nothing
to switch on — it is computed when the scene is compiled and runs in the
viewer on every device. It follows the Sun panel, the sun study and the
light studio within a fraction of a second, and Make it look good waits
for it before it sets the exposure (rooms usually come out a little
darker and more natural than before, so the button raises the exposure to
match). Baked scenes are not changed. To compare, add `?gi=0` to the
link. Re-upload a scene compiled before 4.0 to get it.

## Honest limits

- The measurements are of the frame on screen, so the viewport's size and
  the device shape the result a little; a link re-opened on another
  device replays the saved knobs rather than re-measuring.
- Texture detail is already streamed at the device's maximum by proximity
  (there is no cap to lift), and foliage effects are compile-time lanes
  (always on when the file has them) — the button reports both as-is.
- Baked-or-live: for a streamed scene the renderer knows (over half of
  its surfaces lightmap-baked, checked before exposure moves); otherwise
  it is a measurement (fill off → does the frame change?), not
  a flag; a scene that is half baked, half live is treated as live.
- The composition score is a heuristic over nine depth probes per view;
  on a scene with no auto tour only the centre views are tried.
