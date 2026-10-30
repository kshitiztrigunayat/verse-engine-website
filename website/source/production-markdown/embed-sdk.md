# Embed SDK reference

The Verse Embed SDK is one script, `embed.js`, served from the Verse origin.
It mounts the engine in an iframe **from our origin** (the engine needs
COOP/COEP for `SharedArrayBuffer`; your page needs no header changes),
exposes a small typed API, and reports everything that happens as events.
This page is generated from the typed contract in `verse-embed.d.ts`; the
`.d.ts` is the source of truth and ships next to `embed.js`.

```html
<!-- one line -->
<script src="https://HOST/embed.js" data-scene="SCENE_ID"></script>

<!-- or programmatic -->
<div id="viewer"></div>
<script src="https://HOST/embed.js"></script>
<script>
  const viewer = Verse.embed(document.getElementById("viewer"), { scene: "SCENE_ID" });
  viewer.on("loaded", (d) => console.log(d.clusters, "clusters"));
  const hit = await viewer.pick(0.5, 0.5);
</script>
```

Degradation ladder, every step telemetered: iframe + WebGPU (tier A/B) →
iframe + WebGL2 (tier C) → poster + link-out (`degraded` event). Tier C
streams the same scenes without the post chain; Gaussian splats need
WebGPU. All scene
URLs are resolved on the **Verse origin** — the engine never fetches bytes
from a foreign host.

## Loading the script

| Attribute | Effect |
| --- | --- |
| `data-scene="<id>"` | auto-mounts and loads `ingest/<id>.vpk` (a share link's scene id) |
| `data-vpk="<url>"` | auto-mounts a streamed `.vpk` by URL |
| `data-model="<url>"` | auto-mounts a `.glb`/`.gltf`/`.splat`/`.ply`, fetched whole |
| `data-poster="<url>"` | image shown before the engine arrives, and on fallback |
| `data-quality="4k"` | temporal super-resolution on tiers that support it |
| `data-render="continuous"` | opt out of on-demand rendering (embeds default to `demand` — see the `render` option) |
| `data-hdr="auto"` | opt in to HDR display output (embeds default to SDR — see the `hdr` option) |
| `data-bg="0b0d12"` | solid backdrop in your page's colour instead of the studio environment (see the `bg` option) |
| `data-target="<css selector>"` | mount into that element instead of the script's parent |

With any of `data-scene` / `data-vpk` / `data-model` the SDK mounts
immediately and exposes the viewer as `window.Verse.instance`. Without them
nothing happens until you call `Verse.embed()`.

**`<verse-viewer>`:** the same script also defines a custom element
— `<verse-viewer src="<scene id>" poster="…" autoplay-tour></verse-viewer>`
— lazy, responsive, with DOM events (`load`, `progress`, `error`,
`hotspot`, `view-change`) and `setCamera()` / `playTour()` /
`screenshot()`. `autoplay-path` (or `Verse.embed(el, { autoplayPath: true })`,
or `?autoplay=path` on a share link) plays the scene's default camera path
— its automatic walkthrough / fly-through, or the owner's edit of it — as
soon as it opens. Attributes, events and React / Vue wrappers:
[developers.md](developers.md#verse-viewer). Options it adds to
`Verse.embed()` too: `tier` (`"a"` | `"c"`), `aspect` (`"16:9"` … or
`"fill"`), `engaged` (scroll guard starts engaged), `onEvent(type,
detail)`; and `viewer.destroy()` unmounts.

## `Verse.embed(target, options)`

Mounts a viewer into `target` (an `HTMLElement`) and returns a
[`VerseViewer`](#verseviewer-verbs). The mount is a `div.verse-embed`
filling the target's width at a 16:9 aspect ratio; style it with CSS.

### `VerseEmbedOptions`

| Option | Type | Meaning |
| --- | --- | --- |
| `scene` | `string` | ingest scene id — loads `ingest/<scene>.vpk` from the Verse origin |
| `vpk` | `string` | full or relative URL to a streamed `.vpk` |
| `model` | `string` | URL to a `.glb`/`.gltf` (or `.splat`/`.ply`), fetched whole — small scenes, classic mode |
| `glb` | `string` | (2.8) a [Fidelity mode](guides/fidelity-mode.md) scene — `ingest/<id>.fidelity.glb` from the job record's `glbUrl` — opened on the reference-grade classic path: exact textures, studio lighting, Khronos PBR Neutral tone mapping, both tiers |
| `look` | `string` | (2.8) with `glb`: the studio preset and backdrop, `studio:neutral\|warm\|dark[,bg:rrggbb]` (the `look` the upload chose; `bg` below still wins) |
| `poster` | `string` | poster image shown before the engine arrives (and on fallback) |
| `quality` | `"4k"` | enables temporal super-resolution on tiers that support it |
| `analytics` | `boolean` | collect events into `viewer.events()` (default `true`). `false` also keeps the viewer's look-and-stall analytics feed off (2.5: no position samples leave the iframe) |
| `variant` | `string` | Configurator (2.5): open on a named material variant of the scene's `KHR_materials_variants` table (same as `setVariant` after load) |
| `lights` | `string \| VerseLightsState` | Light studio (2.7): open with a look — the `?lights=` string a share link carries, or a state object (same as `setLights` after load) |
| `exterior` | `{ sky?, weather?, fog?, ground? }` | Exterior kit (2.7): open with a look — the share-string knobs as the viewer writes them (`sky: "3,1,0.4,0.6"`, `weather: "rain,0.7,2"`, `fog: "0.02,0,8fa3bf,0.2"`, `ground: "grass,60"`); use `setExterior` after load for the object form |
| `cinematic` | `boolean` | Cinematic stills (2.7): path-trace the frame whenever the camera is still (WebGPU tiers; WebGL2 keeps the raster and the `cinematic` event says `refusal: 7`). Default `false` |
| `cfg` | `string \| { group: option }` | Configurator depth (2.7): open on a configuration from the owner's schema — the `?cfg=` string (`fabric:oak,legs:black`) or an object (same as `setConfiguration` after load) |
| `render` | `"demand" \| "continuous"` | frame scheduling; embeds default to `"demand"` — the engine renders only while something changes (camera, tours, animations, streaming, peers) and parks otherwise, so a still viewer costs the host page ~zero battery. `"continuous"` restores the classic every-vsync loop |
| `bg` | `string` | What sits behind the model (2.8 forms): `"#rrggbb"` paints one solid colour (exact; the studio environment still lights the model); `"transparent"` draws nothing so your page shows through; `"grad:rrggbb,rrggbb"` a vertical gradient; `"studio:neutral"` / `"studio:warm"` / `"studio:dark"` a studio environment as the backdrop (and the lighting); `"image:ingest/<id>.bg.jpg"` / `"hdr:ingest/<id>.bg.hdr"` the scene owner's uploaded backdrop. Omit for the default (the owner's saved background, else the environment). Every tier. A gradient, picture or `transparent` opens the canvas with an alpha surface — set it here rather than only later through `setBackground` |
| `hdr` | `"auto" \| 1 \| 0` | HDR display output. Embeds default to **SDR** so the host page's colors never shift uninvited. `"auto"` uses the float16 extended-range swapchain when the display reports `dynamic-range: high` and the device is tier A; `1` forces it; `0` (default) pins SDR |
| `review` | `boolean` | Client review pins: the "click a spot, leave a note" workflow, rendered inside the iframe. Default `false` — opt in per embed (`data-review="1"` on the auto-mount tag). See [Client review pins in embeds](#client-review-pins-in-embeds) |
| `share` | `string` | capability token (32 hex chars) for a private scene — same token as the playground's `?share=` link. Required for `scene`/`vpk`/`model` on a private scene, and for `review: true` on one |
| `hotspots` | `boolean` | Owner-authored hotspots + guided tour (2.7): numbered pins, info cards and a "Play tour" control from the scene's default experience (set in the Author bar / Studio) or a loaded `.verse.json`. Default `true`; `false` (`data-hotspots="0"`) keeps the layer off and makes `playTour()` a no-op |
| `guard` | `boolean` | guest manners, default `true`: vertical swipes and the mouse wheel scroll the host page until the visitor taps / clicks into the scene; `false` gives the scene every gesture from the start (`?guard=0`) |
| `fullscreen` | `boolean` | the fullscreen button, default `true`; on iPhone it opens the full viewer in a new tab (no Fullscreen API inside frames there). `false` hides it (`?fs=0`) |

Give exactly one of `scene` / `vpk` / `model`, or none and call
`viewer.load()` later (for example with an experience manifest).

```js
const viewer = Verse.embed(el, { vpk: "ingest/scene.vpk", poster: "poster.jpg", quality: "4k" });
```

## `VerseViewer` verbs

Every verb posts a message into the engine iframe; none of them throw, and
verbs sent before the engine is ready are simply not delivered — attach to
`ready` first when timing matters.

### `element`

The mount element (`div.verse-embed`) the iframe lives in — remove it to
tear the viewer down.

### `load(url)`

Load a scene. `.vpk` streams; `.glb`/`.gltf` and `.splat`/`.ply` fetch
whole; a `.verse.json` experience manifest composes scene + props +
ambience; a `.tour.json` recorded tour loads its scene and replays the
camera path (a `tour` event fires when playback starts). All same origin.
Replaces whatever is loaded.

```js
viewer.on("ready", () => viewer.load("samples/experience-test.verse.json"));
```

### `camera({ orbit?, zoom? })`

Nudge the camera: `orbit` is `[dx, dy]` in pixels, `zoom` a scale factor.

```js
viewer.camera({ orbit: [40, 0] });   // turn 40 px worth
viewer.camera({ zoom: 0.9 });        // move in 10 %
```

### `setCamera({ position, target? })`

Place the orbit camera: eye at `position`, orbiting and facing `target`
(default the origin), world metres. Stops a playing tour and leaves walk
mode; the visitor's drag continues from there. A `view-change` event
(`{ position, forward }`, ≤ 4 Hz, only when the camera moved) reports
where the camera is — after this call, and whenever the visitor moves.

```js
viewer.setCamera({ position: [3, 2, 4], target: [0, 1, 0] });
viewer.on("view-change", ({ position }) => console.log(position));
```

### `screenshot(opts?)`

The current frame as a PNG `Blob` — `saveStill()` with the `"viewport"`
preset unless `opts.preset` says otherwise.

### `walk(on)`

First-person walk mode on/off. Collision walk over the scene's occupancy
grid; the visitor uses WASD / arrows, a joystick on touch.

```js
viewer.walk(true);
```

### `move({ forward?, strafe?, up? })`

Analog walk vector, each component in `[-1, 1]` — drive walk mode from your
own joystick or gamepad.

```js
gamepadLoop(() => viewer.move({ forward: -pad.axes[1], strafe: pad.axes[0] }));
```

### `setDepthOfField(focus, aperture)`

Cinematic depth of field: `focus` distance in metres, `aperture`
in px·m; aperture `0` disables. Tiers A/B, non-temporal mode only.

```js
viewer.setDepthOfField(3.5, 12);
viewer.setDepthOfField(0, 0); // off
```

### `addEmitter({ kind, position, scale? })` / `clearEmitters()`

Preset GPU particle emitter at a world position (tier A/B). `kind` is
`"fire" | "smoke" | "fountain" | "dust"`.

```js
viewer.addEmitter({ kind: "fire", position: [0, 0.2, -2], scale: 1.5 });
viewer.clearEmitters();
```

### `spawnProp(opts)` / `throwProp(opts?)` / `clearProps()`

Dynamic rigid props: a ball or box that falls, bounces and
collides with the scene. glTF scenes only — a `prop` event with `id: -1`
means the scene cannot draw props.

| Field | `spawnProp` | `throwProp` | Meaning |
| --- | --- | --- | --- |
| `shape` | `"ball" \| "box"` | same | default `"ball"` |
| `position` | `[x, y, z]` | — | spawn point (default `[0, 1, 0]`) |
| `velocity` | `[x, y, z]` | — | initial velocity |
| `speed` | — | `number` | m/s along the view direction (default 8) |
| `size` | `number` | `number` | radius / half-extent in metres (default 0.15) |
| `color` | `[r, g, b]` | `[r, g, b]` | 0–1 |

```js
viewer.spawnProp({ shape: "box", position: [0.4, 2, 0], size: 0.15, color: [1, 0.4, 0.2] });
viewer.throwProp({ speed: 10 });
viewer.clearProps();
```

### `goTo(id)`

Jump to a hotspot of the loaded experience manifest. Enters walk
mode at the hotspot's position facing its `look` target; emits `hotspot`.

```js
viewer.on("experience", (x) => buildButtons(x.hotspots, (h) => viewer.goTo(h.id)));
```

### `stopTour()`

Stop a playing recorded tour (`.tour.json`) or the owner's guided
tour (2.7); input returns to the viewer. Recorded tours start via
`load("….tour.json")` and announce themselves with the `tour` event.

```js
viewer.on("tour", (t) => showSkipButton(() => viewer.stopTour()));
```

### `playTour()`

Play the owner's guided tour (2.7): the camera flies between the recorded
steps (~2 m/s, at least 1.2 s a leg), rests `dwell` seconds at each while
that step's narration (text + optional audio clip) shows inside the
iframe, and ends with the walker standing at the last step. Events:
`tour` `{ playing: true, steps }` at the start, `tour-step` per step,
`tour` `{ playing: false, completed }` at the end. Without a tour (or with
`hotspots: false`) it only emits `tour` `{ playing: false, steps: 0 }`.

```js
viewer.on("hotspots", (h) => (playBtn.hidden = h.tour === 0));
playBtn.onclick = () => viewer.playTour();
viewer.on("tour-step", (s) => caption.textContent = `${s.step + 1} / ${s.of}`);
```

### `autoLook(opts?)` / `undoAutoLook()`

Auto look (2.7.2): "Make it look good" in one call — the best first view
(composition-scored over the auto tour's waypoints and the room's centre),
exposure, a sampled sun, fill and soft shadows, the physical sky for
exteriors, every quality knob the tier has (SSAO, SSR, glass; Cinematic on
WebGPU when the traced frame agrees with the raster look) and the
walkthrough. Resolves a `VerseAutoLookResult`: `before` / `after`
(median, p5, p95), `view`, `composition`, `sun` + `sunSamples`, `ev` /
`env` / `all` / `soft`, `sky`, `quality`, `walkthrough` and `lights` — the
`?lights=` string to put in a link. The same object arrives as an
`auto-look` event; `auto-look-step` reports each step. `{ walkthrough:
false }` lights without starting the tour; `{ replay: true }` applies
what the iframe URL carries and walks. Baked scenes get exposure and the
quality knobs only. `undoAutoLook()` restores the state before the call.
See the guide: [make-it-look-good.md](guides/make-it-look-good.md).

```js
const look = await viewer.autoLook();
shareLink.search = `?scene=…&lights=${encodeURIComponent(look.lights)}&auto=1`;
viewer.on("auto-look-step", (s) => (progress.textContent = s.name));
```

### `setSun(azimuth, elevation, intensity?)`

Time-of-day sun: `azimuth`/`elevation` in degrees, `intensity`
(default `2.8`). Shadows and shading move together.

```js
viewer.setSun(120, 15, 2.0);   // late-afternoon light from the south-east
```

### `setExposure(ev)`

Exposure control: EV stops applied in linear space before the
tonemap, clamped to ±4. `0` is the default look. Pass `"auto"` for a
one-shot scene-adaptive nudge that measures the current frame and lands
its average luminance near mid-gray (clamped ±2 EV, never continuous —
dark-authored scans brighten once, with no visible pumping). Auto is a
no-op on tier C (WebGL2 has no readback path); manual EVs work on every
tier. The playground's URL twin is `?exposure=<ev>` / `?exposure=auto`.

```js
viewer.setExposure(1.5);      // +1.5 EV — lift a dark-textured scan
viewer.setExposure("auto");   // measure once, land near mid-gray
```

### `setClipPlanes(planes, opts?)`

Inspection (2.7): section cuts. Up to six world-space clip planes, each
`[nx, ny, nz, d]` or `{ normal, distance }`; a surface point stays iff
`dot(normal, p) + distance >= 0`. Geometry on the cut side is discarded
per fragment and its clusters are culled (nothing is streamed for what a
cut removes); the faces the cut reveals fill with `opts.cap` (sRGB hex,
default terracotta `#e8734a`). Six axis-aligned planes with inward
normals make a section box. Streamed (`.vpk`) scenes only — classic GLB
meshes are not clipped; an empty list restores the uncut view. The
playground's URL twin is `?clip=`. Fires a `clip` event with the live
count.

```js
viewer.setClipPlanes([[0, -1, 0, 1.2]]);                 // take the roof off: keep y ≤ 1.2
viewer.setClipPlanes([{ normal: [1, 0, 0], distance: -2.5 }], { cap: "#ffb000" });
viewer.setClipPlanes([]);                                // uncut
```

### `measure(mode, opts?)`

Inspection (2.7): the measure tool inside the iframe. `"distance"` (two
taps), `"polyline"` (taps, Enter to finish) or `"area"` (corners, Enter
to close) turn clean clicks into surface-snapped points (the GPU pick plus
its normal); the viewer draws the lines, points and a dimension label.
`measure` events report every tap (`complete: false`) and each finished
measurement (`complete: true`, `value` in metres or square metres,
`label` formatted in `opts.units` — `"m"`, `"cm"` or `"ftin"`). `"off"`
ends the mode, `"clear"` removes the drawn measurements; Escape cancels
the one in progress. Turning the tool on takes the clicks away from
review mode.

```js
viewer.measure("distance", { units: "ftin" });
viewer.on("measure", (m) => { if (m.complete) console.log(m.label, m.points); });
```

### `enterAR()`

"See it in your room" (2.7, [guide](guides/view-in-ar.md)): open the
scene in AR on a phone — a WebXR AR session (Android Chrome: hit-test
reticle, tap to place, one finger turns, pinch scales, light estimation)
or iOS AR Quick Look (the scene's `.usdz`), whichever the device has. The
viewer shows its own **View in AR** control inside the frame for
product-scale scenes; the `stage` event's `ar` field tells your page which
path applies (`"webxr"`, `"quicklook"` or `null` — not product-scale, or
no AR here), and `ar` events report what happened. WebXR needs a user
gesture *inside* the frame, so a programmatic `enterAR()` on Android may
come back as `ar { state: "blocked" }`; wire your own button to it on iOS
(Quick Look follows the link) and let the in-frame control do the rest.

```js
viewer.on("stage", (s) => { if (s.ar) showYourArBadge(s.ar); });
viewer.on("ar", (e) => console.log(e.mode, e.state, e.scale ?? "", e.reason ?? ""));
yourButton.onclick = () => viewer.enterAR();
```

### `setMaterial(opts)` / `resetMaterials()`

Live material variant by glTF material index; omitted fields keep
their current value. `resetMaterials()` restores the originals.

| Field | Type | Meaning |
| --- | --- | --- |
| `index` | `number` | material index (see `pick().material`) |
| `baseColor` | `[r, g, b, a?]` | 0–1 albedo (alpha optional) |
| `metallic` | `number` | 0–1 |
| `roughness` | `number` | 0–1 |
| `emissive` | `[r, g, b]` | emissive color |

```js
const hit = await viewer.pick(0.5, 0.5);
viewer.setMaterial({ index: hit.material, baseColor: [0.8, 0.2, 0.2] });
viewer.resetMaterials();
```

### `setVariant(name)`

Configurator (2.5): switch the scene's `KHR_materials_variants` by name;
`null` restores the file's defaults. The variant names arrive on the
`stage` event (`detail.variants`); the outcome comes back as a `variant`
event (`ok: false` = unknown name, or the scene has no variants). Streamed
scenes: the switch happens at the material table (every surface of the
default material takes the variant material's colour *and* texture, in a
frame, with no re-stream), on both GPU tiers. The link form is
`?variant=<name>`.

```js
viewer.on("stage", (s) => renderSwatches(s.variants)); // ["Oak", "Walnut"]
viewer.setVariant("Walnut");
viewer.on("variant", (v) => console.log(v.name, v.ok));
```

### `setLights(state)`

Light studio (2.7): re-light the scene without a recompile, on both
tiers. `state` is a `?lights=` string or an object — `all` (every light,
the sun and every emitter), `env` (image-based ambient), `ev` (exposure
stops), `soft` (sun shadow penumbra, in shadow texels; also the path
tracer's sun disc), `sun: { az, el, intensity }` (null = the scene's
default), `lights: { [index]: ×}` per `KHR_lights_punctual` light and
`emissive: { [material]: ×}` per emissive material. Multipliers are 0–16,
1 = as authored. The detected lights' names arrive on the `stage` event
(`detail.lights.punctual` / `.emissive`, in the index order used here);
the outcome comes back as a `lights` event with the full state and the
share-link `query`. WebGL2 honours everything except per-light
multipliers on streamed scenes (its streamed raster has no punctual
lights).

```js
viewer.on("stage", (s) => renderLightRows(s.lights.punctual, s.lights.emissive));
viewer.setLights({ all: 1.2, env: 0.6, emissive: { 3: 2 } });
viewer.on("lights", (l) => (shareLink.search = `?scene=…&lights=${encodeURIComponent(l.query)}`));
```

### `setExterior(state)` / `getExterior()`

Exterior kit (2.7), both tiers: a **physical sky** (Preetham daylight
driven by `setSun`, turbidity, exposure, a procedural cloud layer — or
`model: "atmosphere"`, a single-scattering clear sky that also warms the
sun, with `aerial: 1` for clear-air aerial perspective) that
also feeds the ambient of live-lit surfaces, **weather** (rain or snow as
a camera-anchored particle sheet; rain also wets upward-facing surfaces —
WebGPU and WebGL2 streamed scenes), **height fog**, and a **ground**
plane / heightfield around the model that the walker stands on. `state` is
a nested partial patch (unmentioned fields keep their values), a full
state, or `null` for everything off; the outcome comes back as an
`exterior` event with the full state and the share-string `query`.
`getExterior()` returns the last reported state (null before the first
event). `ground.heightfield` is the scene's `ingest/<id>.ground.png`
(uploaded with `PUT /v1/scenes/<id>/ground` — `scenes.setGround` in the
JS SDK).

```js
viewer.setSun(140, 25, 3);
viewer.setExterior({
  sky: { on: true, turbidity: 3, clouds: { coverage: 0.4 } },
  weather: { kind: "rain", intensity: 0.6, wind: [3, 0] },
  fog: { on: true, density: 0.015, height: 0, colour: "9fb0c8" },
  ground: { kind: "plane", material: "grass", size: 120 },
});
viewer.on("exterior", (e) => (shareLink.search = `?scene=…&sky=${e.query.sky}&weather=${e.query.weather}`));
```

### `setMedia(table)` / `getMedia()` / `setAudioMuted(muted)`

Media surfaces + spatial audio (2.7, streamed scenes, both tiers). A
scene's owner-authored table (videos on surfaces, ambient sounds —
[guide](guides/video-and-audio.md)) mounts on load; `setMedia` replaces it
live without persisting (`null` clears): `{ media: [{ material, url,
loop?, emissive?, audio? }], audio: [{ pos, url, radius?, loop?, gain? }] }`
with same-origin URLs (an `/ingest/<id>.media/<n>.mp4` from the upload
route, or any path on the viewer's origin). `getMedia()` is the table the
viewer last reported. Screens play muted and loop; a screen pauses when
it is behind the visitor or farther than 40 m and resumes in view;
`prefers-reduced-motion` shows one poster frame. Sound (a screen's own
track with `audio: true`, and the emitters) is positioned at the surface /
the point and follows the camera, and starts only after a gesture inside
the frame: the viewer's **Sound** chip is that gesture, `setAudioMuted`
the same switch for the host page. Events: `media` (the table that
mounted — `surfaces[].bound` says the material was found — and each
play / pause with `material`, `playing`, `visible`; `error` per source)
and `audio` (`muted`, emitters loaded / failed).

```js
viewer.setMedia({ media: [{ material: 3, url: "/ingest/abc.media/1.mp4", emissive: 1.5, audio: true }], audio: [] });
viewer.on("media", (m) => m.material != null && console.log(`screen ${m.material} ${m.playing ? "playing" : "paused"}`));
soundButton.onclick = () => viewer.setAudioMuted(false);
```

### `setCinematic(on)` / `saveStill(opts?)`

Cinematic stills (2.7): with Cinematic on, a still camera on a lit
streamed scene is path-traced progressively (global illumination, soft
shadows, emissive area lights, glass) and converges in place; moving the
camera returns to the raster instantly. `cinematic` events report the
accumulation (`active`, `samples`, `converged`, or a `refusal` with its
`reason` — 2 needs a streamed scene, 3 baked scene, 4 over the triangle
budget, 5 several objects, 6 animating, 7 needs WebGPU). `saveStill`
resolves `{ blob, width, height, spp, ms }`: `preset: "viewport"` is the
live frame (traced when Cinematic has converged, raster otherwise),
`"1080p"` / `"4k"` a tiled path-traced export at that size (`spp`
samples per pixel, default 64 — ~5 s for 1080p at 64 spp on a laptop
GPU, 4K about four times that). One still at a time; the `still` event
mirrors the summary.

```js
viewer.setCinematic(true);
viewer.on("cinematic", (c) => (hud.textContent = c.active ? `${c.samples} spp` : c.reason));
const { blob } = await viewer.saveStill({ preset: "1080p", spp: 64 });
```
### `setConfiguration(selection)`

Configurator depth (2.7): pick options by group from the owner's
configuration schema (`{ fabric: "oak" }`, merged onto the current pick —
groups you omit keep theirs). The schema arrives on the first
`configuration` event after load (`detail.groups`: ids, names, options
with swatch/price/SKU); every change — this call, `?cfg=`, the panel in a
full viewer — emits another one with the selection, the `cfg` string for
a share link, the price total (display only) and the SKUs. `ok: false` on
the event means a group or option you named does not exist (the rest was
applied). A scene without a schema has `groups: []` and the call is a
no-op. Build your own swatches from the event and keep the viewer
headless, or just open with `cfg`.

```js
viewer.on("configuration", (c) => {
  renderGroups(c.groups, c.selection);          // your UI
  priceEl.textContent = c.priced ? `${c.total} ${c.currency}` : "";
  shareLink.search = c.cfg ? `?cfg=${c.cfg}` : "";
});
viewer.setConfiguration({ fabric: "walnut", legs: "none" });
```

### `getConfiguration() → Promise<VerseConfiguration>`

The current pick in the same shape as the `configuration` event.

### `joinRoom(room, { voice?, name? })` / `leaveRoom()` / `follow(id)`

Live tours: join a named presence room — every viewer in the
room sees the others as in-world avatars, and the roster arrives as
`presence` events. `follow(id)` glues the camera to a viewer from the
roster; `follow(null)` stops following. Poses are ephemeral on the server
(memory-only, 10 s TTL). The older `joinRoom({ room, name })` form still
works.

**Voice (2.7).** `voice: true` (open mic) or `"ptt"` (push-to-talk) joins
the room's peer-to-peer audio: the browser asks for the microphone, each
talker holds one WebRTC connection per other talker (a mesh — **6 talkers
per room**, the seventh gets a `room` notice and no audio), signalling
rides the room's SSE stream and `POST /v1/room/<room>/signal`, STUN only
(no TURN: a pair behind symmetric NATs gets a `room` `notice` instead of
audio). Nothing is recorded and no audio reaches the server. Playback is
spatial — each voice sits where its avatar stands — until `setVoice({
spatial: false })`.

```js
viewer.joinRoom("showflat-42", { name: "Alex", voice: true });
viewer.on("room", (r) => r.state === "voice-failed" && toast(r.message));
viewer.on("speaking", (s) => roster.mark(s.id, s.speaking));
viewer.on("peer", (p) => p.state === "hand" && toast(`${p.name} raised a hand`));
viewer.setVoice({ muted: true });              // or { pushToTalk: true, talking: held }
viewer.setVoice({ peer: someId, peerMuted: true }); // for me only
viewer.leaveRoom();
```

### `present(on?)` / `setVoice(opts)`

Presenter mode (2.7). `present(true)` takes the floor: everyone else in
the room follows your camera (smoothed) behind an in-frame veil with
**Take control** and **Raise hand** buttons, and your `playTour()` /
`stopTour()` / `goTo()` / `setVariant()` / `setLights()` /
`setClipPlanes()` calls are broadcast and applied on every follower.
Your pick point is drawn for them as a laser dot. `present(false)` gives
the floor back; a second viewer calling `present(true)` takes it over
(the previous presenter is told through a `room` event). The roster's
`peer.flags.presenter` / `hand` / `muted` say who is who.

`setVoice({ on?, muted?, pushToTalk?, talking?, spatial?, peer?, peerMuted? })`
drives the voice knobs; `on: false` leaves voice, `on: true` joins it
later than `joinRoom`.

### `addSound(opts)` / `clearSounds()`

Positioned ambience (HRTF): a synthesized `kind` (`"fire" | "water" |
"wind"`) or an audio `url` (CORS-readable), at `position`; optional `gain`,
`refDistance`, `loop`. Audio starts on the visitor's first gesture, as
browsers require.

```js
viewer.addSound({ kind: "water", position: [2, 0, -1], gain: 0.6 });
viewer.addSound({ url: "/audio/loop.mp3", position: [0, 2, 0], loop: true });
```

### `play(clip?)` / `pause()` / `seek(t)` / `setSpeed(speed)`

Animation. Clips are listed by index on the `loaded` event's
`animations`; the first clip auto-plays. `seek` takes seconds within the
current clip; a negative `speed` plays backwards.

```js
viewer.on("loaded", (d) => {
  console.log(d.animations); // ["Idle", "Wave"]
  viewer.play(1);
  viewer.setSpeed(0.5);
});
```

### `pick(x, y) → Promise<VersePickResult>`

GPU pick at normalized viewport coordinates (`[0, 1]`, y down). Resolves
with `{ hit, position, material, cluster }`; `hit` is `false` on sky /
outside geometry. Rejects after 5 s if the engine never answers (tier C).
Also delivered as a `pick` event.

```js
const r = await viewer.pick(0.5, 0.5);
if (r.hit) console.log("material", r.material, "at", r.position);
```

### `setBackground(bg)` / `getBackground() → Promise<string>`

(2.8) The background spec in effect — the same forms as the `bg` option.
`setBackground("transparent")` on an embed that opened with a solid or
default backdrop asks for an alpha canvas the frame does not have: the
`background` event then says `reload: true` and the frame keeps its
current backdrop — open the embed with `bg` set for those. Emits
`background` `{ bg }`.

```js
viewer.setBackground("ffffff");              // exact white
viewer.setBackground("studio:dark");          // dark-contrast studio, lights the model
console.log(await viewer.getBackground());    // "studio:dark"
```

### `setEnvironment(src, name?) → Promise<void>`

Swap the lighting environment for a Radiance `.hdr` — an `ArrayBuffer` or a
URL (fetched by the host page, so it may be cross-origin if CORS allows).
Emits `environment`.

```js
await viewer.setEnvironment("/env/evening.hdr");
```

### `exportVideo(opts?) → Promise<VerseExportResult>` / `cancelExport()`

Export video: records the scene's tour — the compile-time staged
tour when the scene has one, otherwise a synthesized orbit of the framing
sphere — to MP4/H.264 where the browser can mux it, WebM elsewhere. The
capture runs **inside the engine iframe** (that is where the canvas
lives); the finished bytes transfer to your page as a `Blob`, so the
embedding page decides download/upload/preview. One export at a time —
a second call rejects with "an export is already running"; so does an
export before any scene loaded. `export-progress` events fire per
captured frame; `cancelExport()` resolves the pending promise with
`{ cancelled: true }`.

| Option | Default | Meaning |
| --- | --- | --- |
| `duration` | tour length | seconds, clamped 1–600 |
| `fps` | `30` | clamped 5–60 |
| `height` | `1080` | output height px; `0` = native canvas height |
| `format` | auto (MP4 where supported) | `"mp4"` \| `"webm"` |
| `bitrate` | ~10 Mbps at 1080p, area-scaled | video bits/s |

Resolves `{ blob, mimeType, name, width, height, frames, cancelled }`.

```js
viewer.on("export-progress", (p) => (bar.style.width = `${p.percent}%`));
const r = await viewer.exportVideo({ duration: 10, height: 1080 });
if (!r.cancelled) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(r.blob),
    download: r.name,
  });
  a.click();
}
```

### `setReviewMode(on)` / `getComments() → Promise<VerseReviewComment[]>`

Client review pins (embed parity): see
[Client review pins in embeds](#client-review-pins-in-embeds) below.
`setReviewMode(on)` toggles the "click a spot, leave a note" workflow
inside the iframe — a no-op when the embed was not created with
`review: true` (no review machinery exists in the iframe at all).
`getComments()` resolves the current comment list for the loaded scene
(`[]` when review was never enabled, or nothing has been posted yet).

### `getProperties(id?)` / `setVisible(ids, visible?)` / `isolate(ids)` / `select(id, { frame? })`

Object properties (2.7) on scenes that came in as IFC or USD (see
[docs/api.md → IFC and USD](api.md#ifc-and-usd-2-7)). `getProperties(id)`
resolves one object by IFC GlobalId / USD prim path / glTF node index —
`{ node, id, type, name, storey?, description?, tag?, props, bounds?, visible }`
— or `null`; with no argument it resolves the whole index
(`{ count, source, storeys, types, nodes }`), or `null` on a scene without
properties. `setVisible(ids, false)` hides objects (both tiers; hidden
objects are dropped before the renderer's visibility test), `setVisible("all")`
shows everything, `isolate(ids)` keeps only those. `select(id)` fires a
`select` event like a click would; `{ frame: true }` orbits the camera onto
the object; `select(null)` clears.

```js
const index = await viewer.getProperties();
viewer.setVisible(index.storeys.find((s) => s.name === "Level 2").nodes, false);
viewer.on("select", ({ object }) => render(object));
```

### `on(type, fn) → VerseViewer`

Subscribe to an event; chainable. **Already-emitted events are replayed to
late listeners**, so attaching after `ready` fired still delivers it.

### `events()`

Every event captured so far, as `Array<{ type, t, …detail }>` — the
analytics feed (disable capture with `analytics: false`).

## Events (`VerseEventMap`)

| Event | Payload | When |
| --- | --- | --- |
| `ready` | `{ tier, ttfi }` | engine booted; `tier` is `"A"`, `"B"` or `"C"`, `ttfi` ms to first frame |
| `loaded` | `{ name, clusters?, streamed?, animations?, splats? }` | scene finished loading (streamed scenes keep refining afterwards); `animations` lists clip names for GLBs, `splats` the count for splat scenes |
| `progress` | `{ drawn, total }` | ~1 Hz streaming / culling progress for HUDs |
| `pick` | `VersePickResult & { id }` | a pick completed (also delivered via the `pick()` promise) |
| `environment` | `{ name }` | lighting environment swapped |
| `view` | `{}` | viewer entered the viewport (50 % visible) |
| `dwell` | `{ ms }` | cumulative on-screen time, emitted when the viewer scrolls away |
| `interact` | `{}` | first user interaction (conversion signal) |
| `error` | `{ message }` | engine or load failure |
| `degraded` | `{ tier?, reason? }` | tier downgrade: WebGL2 fallback, or `reason: "iframe-unavailable"` when the frame never reported (poster stays) |
| `signed` | `{ name, signed }` | streamed scenes, after `loaded`: `true` = Ed25519 signature verified against this origin's `/v1/pubkey`; `false` = unsigned or altered; `"unverified"` = this browser could not check. Never blocks loading |
| `prop` | `{ id, count }` | a prop was spawned or thrown (`id: -1` — scene cannot draw props) |
| `experience` | `{ name, props, hotspots: [{ id, label }] }` | an experience manifest was parsed; props load next |
| `hotspot` | `{ id, label?, title?, index? }` | the viewer jumped to a hotspot (`goTo` or the host's own UI) or, 2.7, opened a pin's card (`label`/`title`/`index` set then) |
| `hotspots` | `{ count, tour }` | 2.7: the authored layer mounted — pins on screen and guided-tour steps available (`0` = no "Play tour") |
| `tour-step` | `{ step, of, hotspot }` | 2.7: the guided tour reached a step (`hotspot` is its pin id or `null`) |
| `stage` | `{ kind, walk, view, variants, version, lights, ar }` | the scene's staging manifest arrived: `variants` lists the configurator's variant names (2.5), `version` the scene version being served, `lights` the detected punctual light and emissive material names (2.7); `ar` (2.7) which AR path this device has for the scene — `"webxr"`, `"quicklook"` or `null` (not product-scale, or no AR here) |
| `ar` | `{ mode, state, scale?, reason? }` | (2.7) View in AR: WebXR `started` → `placed` (with the pinch `scale`) → `ended`; Quick Look `opened`; `blocked` with the `reason` (no user gesture in the frame, not product-scale, no package) |
| `variant` | `{ name, ok, names }` | a `setVariant` (or `?variant=`) was applied (2.5): `name` null = defaults, `ok` false = unknown name / no variants |
| `lights` | `{ state, query }` | the light studio changed (2.7): the full state and its `?lights=` string |
| `exterior` | `{ state, query }` | the exterior kit changed (2.7): the full state and the share-string knobs `{ sky, weather, fog, ground }` (null when that feature is off) |
| `auto-look` | `VerseAutoLookResult` or `{ undone: true }` | Auto look (2.7.2) finished, or was undone |
| `auto-look-step` | `{ name, … }` | one Auto look step landed (`frame`, `measure`, `exposure`, `probe`, `sun`, `lights`, `fill`, `exterior`, `quality`, `walk`) |
| `background` | `{ bg, reload? }` | (2.8) a backdrop was applied — `bg` is the spec in effect; `reload: true` when a gradient, picture or `transparent` was asked for on an opaque canvas |
| `media` | `{ media?, audio?, surfaces?, material?, playing?, visible?, error? }` | (2.7) the media table mounted (`surfaces`: which materials were bound), or one surface started / paused / failed |
| `audio` | `{ muted?, emitters?, emitter?, ready?, error? }` | (2.7) spatial sound: the global mute changed, or an emitter loaded / failed |
| `cinematic` | `{ active, samples, width, height, triangles, refusal, reason, converged }` | Cinematic (2.7) state changed: tracing / converged / refused (see `setCinematic`) |
| `still` | `{ id, width, height, spp, ms, error? }` | a `saveStill` finished (2.7); the bytes ride the promise |
| `configuration` | `{ selection, cfg, total, priced, currency, skus, groups, ok? }` | Configurator depth (2.7): the owner's schema loaded, or the pick changed (`setConfiguration`, `?cfg=`, the panel). `ok` false = a `setConfiguration` named an unknown group/option |
| `tour` | `{ name?, seconds? } \| { playing, steps?, completed? }` | a recorded tour (`.tour.json`) started playing — the camera loops the recorded path (`seconds` per loop) until `stopTour()` or viewer input; 2.7 guided tours use the same event with `playing: true` (`steps`) at the start and `playing: false` (`completed`) at the end |
| `presence` | `{ count, peers: [{ id, name, flags? }] }` | live-tour roster changed — feed it to your own roster UI and `follow(id)`; 2.7 peers carry `flags` (`presenter`, `hand`, `muted`, `voice`, `laser`) when set |
| `room` | `{ room, state, … }` | 2.7: `joined` (`id`), `left`, `voice` / `voice-failed` (`message`), `presenter` (`presenter` id or null, `me`, `name`), `control` (you took control from the presenter), `action` (a presenter action was applied here: `action`, `detail`, `from`), `notice` (voice cap reached, no direct connection to a peer) |
| `peer` | `{ room, id, name?, state, flags }` | 2.7: a peer `join`ed, `leave`d, `update`d its flags (mute, presenting, hand) or raised a `hand` |
| `speaking` | `{ room, id, speaking, me }` | 2.7 voice: a peer (or this viewer, `me`) started / stopped speaking — detected locally on the received audio |
| `export-progress` | `{ id, percent, frame, total }` | video export progress, per captured frame |
| `export-done` | `{ id, size, cancelled, error? }` | export summary (the bytes ride the `exportVideo()` promise) |
| `review-posted` | `{ id, pos, text }` | client review (`review: true` only): a new pin was posted |
| `review-selected` | `{ id, pos, text }` | client review: an existing pin was opened |
| `measure` | `VerseMeasureEvent` | inspection (2.7): a measure-tool tap (`complete: false`) or a finished measurement (`id`, `mode`, `points`, `value`, `units`, `label`) |
| `clip` | `{ count }` | inspection (2.7): the clip-plane set changed — `count` live planes |
| `objects` | `{ count, source, storeys, types }` | (2.7) the scene's IFC/USD object index loaded |
| `select` | `{ object, origin }` | (2.7) an object was selected — by a click (`origin: "pick"`), `select()` (`"api"`) or `?select=` (`"link"`); `object` null = cleared. `pick` events carry `object` too |
| `visibility` | `{ hidden }` | (2.7) objects were hidden or shown; how many are hidden now |

```js
viewer
  .on("ready",    (d) => hud.tier.textContent = d.tier)
  .on("progress", (p) => hud.bar.style.width = `${(100 * p.drawn) / p.total}%`)
  .on("dwell",    (d) => analytics.track("3d-dwell", { ms: d.ms }))
  .on("signed",   (s) => badge.hidden = s.signed !== true)
  .on("error",    (e) => console.warn("verse:", e.message));
```

### `VersePickResult`

| Field | Type | Meaning |
| --- | --- | --- |
| `hit` | `boolean` | `false` when the pick landed on sky / outside geometry |
| `position` | `[x, y, z]` | world-space position of the picked surface point |
| `material` | `number` | material index in the scene's material table |
| `cluster` | `number` | internal cluster id (stable within one `.vpk` build) |
| `normal` | `[x, y, z] \| null` | the hit triangle's world-space normal, facing the viewer (2.7); `null` on a miss |

## Client review pins in embeds

Client review is available inside the embed SDK, default **off**.
Set `review: true` (or `data-review="1"` on the auto-mount script tag) and
a viewer gets the exact same "click a spot, leave a note" workflow the
playground has — rendered *inside the iframe*, over your scene, no
playground chrome involved:

- A viewer toggles review mode with `viewer.setReviewMode(true)` (there is
  no built-in chip/button in the embed — that is the host page's UI to
  build, same as walk mode).
- While on, a clean click/tap does a GPU pick and opens a small composer
  at that spot; posting pins a numbered marker and fires `review-posted`.
- Existing pins render as the same numbered DOM markers the playground
  uses, projected from the camera pose each frame; clicking one opens its
  detail popover and fires `review-selected`.
- The composer/detail popover clamps to the iframe's own bounds and
  scrolls internally if it would overflow — it fits down to a 320px-wide
  embed.
- `viewer.getComments()` reads the current list without opening the UI —
  handy for a host-side counter/list.

**Auth**: embed comments are anonymous by default — only the optional
free-text "your name" field identifies an author, there is no signed-in
viewer concept in an embed. A private scene needs the same `share` token
as loading the scene itself; pass it once and both the scene bytes and
the review reads/posts use it:

```js
const viewer = Verse.embed(el, {
  vpk: "ingest/scene.vpk",
  share: "a1b2…32 hex chars…",
  review: true,
});
viewer.on("ready", () => viewer.setReviewMode(true));
viewer.on("review-posted", (d) => console.log("new pin", d.id, d.pos, d.text));
```

**Not in embeds**: owner moderation (resolve/delete, the "show resolved"
toggle's underlying data, the open/total counts on `/v1/account/scenes`)
stays playground/studio-only — an embed viewer, even the scene's own
owner browsing their own page, only ever sees the anonymous composer.
Moderate from the playground or studio instead. See the
[parity table](api.md#playground-embed-parity) in `api.md`.

## TypeScript

```ts
import type { VerseViewer, VerseEventMap } from "./verse-embed";
declare const viewer: VerseViewer;
viewer.on("loaded", (d) => d.clusters); // d: VerseEventMap["loaded"]
```

`verse-embed.d.ts` declares `window.Verse: VerseGlobal` (`embed()` and the
optional auto-mounted `instance`). Copy it into your project or reference it
from the Verse origin.

## Ingest from JavaScript

Uploading is a separate, tiny module — `verse-sdk.js` wraps `POST
/v1/ingest` and the job polling, then mounts the result:

```js
import { VerseClient } from "https://HOST/verse-sdk.js";
const verse = new VerseClient({ endpoint: "https://HOST", apiKey: "vk_…" });
const { url } = await verse.ingest(glbArrayBuffer, { name: "chair" });
verse.mount(document.querySelector("#viewer"), url);
```

Protocol details: [Ingest API](api.md).
