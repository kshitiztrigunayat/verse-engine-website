# Experience manifests (`.verse.json`)

An experience is one JSON file that turns a folder of assets into a walkthrough URL: a base scene, extra GLBs placed into it, lighting, ambience, and the hotspots a buyer jumps between. The playground runs one with `?experience=<url>`; the embed SDK with `viewer.load("x.verse.json")`. All URLs resolve against the manifest and must be same-origin (the Verse origin never feeds foreign bytes to the parsers).

```json
{
  "name": "Purvankara 3BHK",
  "scene": "ingest/purvankara-d992a4ef9b5d.vpk",
  "props": [
    { "url": "props/sofa.glb", "position": [2.1, 0, -1.4], "yaw": 90, "scale": 1 }
  ],
  "environment": "env/evening.hdr",
  "ambience": { "particles": "dust@2,1.5,-1*1", "audio": "wind@0,2,0" },
  "dof": { "focus": 3.5, "aperture": 0 },
  "exposure": 0.8,
  "spawn": { "position": [0, 1.6, 3], "yaw": 180 },
  "hotspots": [
    { "id": "kitchen", "label": "Kitchen", "position": [4, 1.6, -2], "look": [4, 1.2, -6],
      "anchor": [4, 1.0, -5.5], "title": "Kitchen", "body": "Island in **quartz**, [brochure](https://…)",
      "image": "/ingest/poster-9a1b2c3d4e.png", "link": "https://example.com/kitchen" }
  ],
  "tour": {
    "steps": [
      { "hotspot": "kitchen", "eye": [4, 1.6, -2], "look": [4, 1.2, -6], "dwell": 4,
        "narration": "The kitchen opens onto the terrace.", "audio": "/ingest/exp-38fd878a72-media-9a1b2c3d.mp3" }
    ]
  },
  "sun": { "azimuth": 150, "elevation": 30, "intensity": 3 },
  "version": 2
}
```

| Key | Meaning |
| --- | --- |
| `scene` (required unless `scenes`) | `.vpk` streams through the meshlet DAG; `.glb`/`.gltf` loads whole. Loads first; everything else waits for it. |
| `scenes` | up to 8 `{url, position, yaw, scale}` streamed objects in one experience (apartment + clubhouse). The first is the base — camera framing and the walk grid come from it; the rest stream additively at their world offsets, rotated `yaw` degrees about +Y. The playground's URL-knob twin is `?vpk=<base>&vpk2=url@x,y,z*yawDeg*scale;url@…` — each `;`-separated entry places one extra `.vpk` (`@x,y,z` offset in metres, `*yawDeg` rotation, `*scale` uniform; all optional, defaults `0,0,0` / `0` / `1`). |
| `props` | Up to 64 GLBs appended to the scene after it reports in. `position` metres, `yaw` degrees about +Y, `scale` uniform. Props are static (their own animations, skins and morphs are ignored in v1) and do not join the walk-collision grid. |
| `environment` | An `.hdr` on this origin, applied as the image-based light. |
| `ambience` | The `?particles=` / `?audio=` knob strings: `kind@x,y,z*scale;…`. |
| `dof` | Depth of field: focus distance (m) and aperture (px·m, 0 = off). Tiers A/B. |
| `exposure` | EV stops applied in linear space before the tonemap, clamped ±4; omitted = default look (0 EV). Authored via the editor's Exposure slider, applied on load through the same `set-exposure` verb as `?exposure=` and the embed's `setExposure(ev)`. |
| `spawn` | Where walk mode starts: eye position + yaw. Replaces the occupancy-derived spawn search. |
| `start` | Optional, 4.0: `"walk"` opens the visitor standing at `spawn` in walk mode once the scene has loaded (generated floor-plan homes use it). Absent = the scene's own opening camera. |
| `hotspots` | Up to 64 `{id, label, position, look}`. A jump enters walk mode at `position` facing `look`, so the collision walk continues from there. **Version 2** adds the pin and its card: `anchor` (the surface point the numbered pin hangs on — defaults to `position`), `title` (120 chars), `body` (2000 chars of plain text with `**bold**`, `*italic*` and `[text](https://…)` links), `image` (same-origin URL) and `link` (http/https). A hotspot with any of these renders as a pin + info card instead of the v1 button strip. |
| `tour` | Version 2: the guided tour — `steps` (up to 64) of `{hotspot?, eye, look, dwell, narration?, audio?}`. `eye`/`look` are the camera pose (defaults: the named hotspot's `position`/`look`); `dwell` seconds the camera rests there (0.5–60, default 4); `narration` text (2000 chars, same rich-text subset) and `audio` a same-origin clip (`POST /v1/experience/<id>/media`, ≤ 2 MB). Playback flies between steps at ~2 m/s (≥ 1.2 s a leg) on the engine's camera path, shows the narration per step, and leaves the walker standing at the last step. Steps whose `eye` cannot be resolved are dropped; an empty list reads as no tour. |
| `sun` | Version 2: `{azimuth, elevation, intensity}` in the engine's S5 convention (degrees; azimuth from +X toward +Z, elevation 2–90, intensity 0–20, default 2.8) — the same triple as `?sun=` and the embed's `setSun`. Applied on load; a `?sun=` knob in the link still wins because it applies after. |
| `exterior` | 2.7: the exterior kit's state — `{ sky: {on, turbidity, exposure, clouds: {coverage, density}}, weather: {kind, intensity, wind}, fog: {on, density, height, falloff, colour}, ground: {kind, size, material, y, colour, heightfield, amplitude, center} }` (every field optional; the viewer fills defaults and clamps). `ground.heightfield` is the scene's `ingest/<id>.ground.png`. The Author bar writes it when "Save the exterior" is ticked; share-string knobs in the link win because they apply after. |
| `lights` | 2.7.2: the light studio's share string (`all=1.2;env=1.5;ev=0.8;soft=3;l0=…;e3=…`, see `lights.js`), written by **Make it look good** for a signed-in owner and applied with `sun` / `exterior` when the manifest mounts; a `?lights=` on the link wins because it applies after. |
| `version` | `2` for manifests carrying the keys above; absent/`1` reads exactly as before (no pins, no tour, no sun). The parser never rejects a version it does not know — unknown keys are ignored. |

Runtime contract: the `experience` event fires when the manifest is parsed; `loaded` when the base scene is up; each prop that fails leaves the rest loading and reports through `error`. On GPU-context recovery the engine replays the base GLB and its props itself; a streamed base is re-streamed by the worker.

Authoring (2.7): the playground's `?author=1` **Author bar** (a signed-in Studio session; [guide](guides/author-a-guided-tour.md)) writes version-2 manifests — click a surface to drop a hotspot (the pick lands `anchor`, the current view becomes `position`/`look`), reorder, fill the card, record a tour step per hotspot (pose from the current view, dwell, narration, audio), keep the sun — and saves through `POST /v1/experience` then `PUT /v1/experience/<id>`; "Set as link default" (`PUT /v1/scenes/<id>/experience`) makes the plain share link `/?vpk=ingest/<id>.vpk` play it. Viewers and embeds read edited manifests through `GET /v1/experience/<id>` (`?experience=/v1/experience/<id>`), never the year-immutable static copy. Studio lists a scene's experiences under **Experiences**.

The playground's `?edit=1` editor writes these manifests — capture spawn/hotspots from the camera, tap to place props and ambience, then Download or Publish (`POST /v1/experience` → `ingest/exp-<id>.verse.json` + share link). Manifests publish with root-relative URLs so they resolve from `ingest/`. The Scenes section authors `scenes` directly: add streamed `.vpk` objects at x/y/z/yaw/scale offsets with immediate additive preview; the base scene becomes entry 0 on export, and removing a scene — like removing a prop — re-previews on reload. 📸 Poster captures the viewport and publishes it (`POST /v1/poster` → `ingest/poster-<id>.png`) for the embed's `data-poster`.

Auto-staging: ingest scenes compiled with a walk-collision grid ship `ingest/<id>.stage.json` (a compiler-picked `spawn` in exactly this manifest's format, plus a 20–60 s auto tour in the `/v1/tour` sample format, planned through free space on the collision grid for interiors) and `ingest/<id>.plan.svg` (a deterministic floor plan the minimap uses as its base layer) — see `docs/api.md`. The `?edit=1` editor seeds its draft spawn from the stage manifest and shows "Auto-staged ✓"; an explicit `spawn` here always wins over the auto one.

Not yet: gizmo manipulation of placed items and scenes (offsets are numeric); walk grids of SCALED scene placements (translation + yaw grids contribute; scale sits out of collision).
