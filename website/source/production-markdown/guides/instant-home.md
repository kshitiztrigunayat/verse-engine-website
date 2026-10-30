# Verse Home: a brochure plan to a home buyers walk, restyle and tour together

*You have the floor plan from a project brochure. A minute later you have a
furnished home that walks like a real one. It opens on any phone from a
WhatsApp link, changes style while people watch, and a group of buyers can
tour it together from one link.*

Verse Home combines three features:
[Floor plan to 3D home](floor-plan-to-3d.md),
[Restyle a space, live](restyle.md) and
[Tour together, live](tour-together.md).

## The flow

1. **Upload the plan.** Open the upload screen, choose **Floor plan → 3D**
   and drop the plan as a PNG, JPG, WebP or PDF. The plan can be a clean export,
   a tinted brochure page or a phone scan. Add the carpet area and the BHK
   if you know them. Both make the scale and the room types more reliable.
2. **Check the plan, then Generate.** The plan comes back as a drawing.
   Tap a room to rename it or change its type, and rotate or flip the plan
   if needed. Doors we added because the plan didn't show them are
   highlighted in orange ("We added 2 doors — check them"). To change
   doors, press **Edit doors** and tap a wall to add a 0.9 m door there.
   Tap any door, window or open gap to switch it between the three,
   remove it or make it the entrance. Tap the green **IN** marker, then a
   door or an outside wall, to move the entrance. The line above the plan
   re-checks after every change and names any room that cannot be reached
   from the entrance. **Add doors for me** puts in the fewest doors that
   connect them. A room that still cannot be reached is not published.
3. **Share.** The result shows the link, **Copy** and **Share on
   WhatsApp**. The link opens walking at the living-room entrance, with a
   pin for each room.
4. **Restyle.** Anyone who opens the link can use the **Restyle** chip
   (Original, Scandinavian, Japandi, Luxury Marble, Indian Contemporary,
   Industrial, Coastal, or plain words such as *marble floor*). The floors,
   walls, ceilings, skirting, counters, joinery and fabrics change in
   place.
5. **Tour together.** Tap **Tour together** on the link and send the
   invite. Buyers follow your camera from their phones, and when you
   restyle, everyone in the tour sees the change.

## What a generated home is made of

- **The shell.** Walls are 3 m high with real door and window openings.
  Doors have architraves and panelled leaves and are drawn open. A single
  leaf hangs on the jamb nearer the room's corner, so it opens back
  against the side wall. A
  WC-sized bathroom's door opens out. Windows have frames, glass, a stone
  sill and architraves. Living and dining rooms get a false-ceiling border
  with a warm LED cove. Other rooms get a slim cornice, and every room has
  recessed downlights and its own floor, ceiling and skirting.
- **Furniture, placed the way a stylist would.** In the living room the
  sofa sits on the longest solid wall with a rug under its front legs, a
  coffee table centred on the rug, a side table and lamp at one end and a
  floor lamp at the other. The TV unit faces the sofa on a slatted-wood or
  stone feature wall, with the TV mounted above it. Dining tables are
  centred under a pendant. Beds go against the longest wall without a
  window, with nightstands and lamps on both sides, a rug, and art at eye
  height above the headboard. Each bedroom has a wardrobe, and corners
  get plants and lounge chairs. Kitchens get a counter run with a sink and
  tap, a hob, a chimney hood, wall cabinets (never over a window), a
  backsplash and a fridge. Bathrooms get a WC, a vanity with a lit mirror
  and a shower. A glass enclosure (0.75–0.9 m) goes in where it fits. In a
  small WC the shower is a wet-room one: a rain head, a mixer and a floor
  drain on the open floor. A door that swings out of a small bathroom
  keeps only a 0.55 m approach inside it, not a full swing square. Living rooms, bedrooms, dining rooms and studies get
  curtains. The rules stay as before: door-swing keep-outs, 0.75 m
  walkways, no overlaps and every room reachable on foot. The premium
  checks add two more: nothing floats, and every wall piece hangs on a
  wall.
- **Light.** The generator bakes the light into the vertex colours with
  real rays (`plan2home-bake.mjs`, `makeRayBaker`): 40 cosine-weighted rays
  per vertex against the walls, furniture and floor and ceiling planes give
  soft contact shadows and ambient occlusion (corners, skirting, under a
  sofa, behind a bed). Rays that leave the flat through a window bring in
  daylight, and each room's lamps add warm pools. The occluder for a pack
  model is the model as drawn, not its furniture slot, and the shadow never
  goes below half brightness. A phone and a desktop render the same light
  without real-time GI, so the link opens with the studio fill
  (`gi=0;env=1.25;ev=0.35`). The bake takes 1–3 s of the build.
- **Surfaces.** Floors, bathroom walls, counters, wood and the feature wall
  come from the shared CC0 material library
  (`web/playground/assets/library`), at world scale, with each set's own
  normal and roughness maps. Floors, wet walls, counters and joinery use
  the 1024² colour map, so they have at least 512 texture pixels per metre.
  The palettes are chosen per style (Modern Indian, Scandinavian, Luxury,
  Minimal).
- **Outside the windows.** You see a city skyline: a horizon band cut from
  a CC0 Poly Haven panorama on a backdrop about 40 m outside the flat, with
  no lawn. It is far enough that it barely shifts as you walk past a
  window, and it fades into haze below the horizon instead of ending in a
  hard edge. Each style looks out at its own time of day and its own part
  of the skyline: golden hour for Modern Indian, a clear day for
  Scandinavian, blue hour for Luxury and an overcast sky for Minimal. The
  sky colour behind the windows matches. A build can name another time
  (`"timeOfDay": "day" | "golden" | "dusk" | "overcast"` in the
  `/v1/plan2home/build` body).
- **Room views, shot like an architectural photographer would.** Each
  room's view (its pin, the tour stop and the hero still) is taken from a
  corner or just inside a doorway, at 1.3 m, with the camera level so
  walls stay vertical, looking across the room's longest diagonal. A view
  with an open door leaf in the frame is refused. Only a room with no
  leaf-free view at all falls back, first to a leaf at the frame's outer
  edge, then to one seen through a doorway 3 m or more away. So is a view that starts
  at a piece of furniture: a bedroom is shot across the room with the bed
  at three quarters, not from the foot of the bed. A WC-sized room is shot from
  its threshold or a step outside it, the way a photographer gains the
  distance the room lacks. Walking and the tour
  use a 26 mm lens (35 mm equivalent, measured on the diagonal, so a
  portrait phone gets the same lens) instead of the 55° vertical field of
  view, which was a 21 mm on a desktop and stretched the corners. A room
  view holds its 1.3 m height until you walk; walking rises to eye
  height. Where a photographer would use a shift lens, the view does
  too. Each view aims at its subject's height (about 0.85 m in a small
  bathroom, 0.9–1.0 m elsewhere). Through the walk lens the camera stays
  level and the frame slides down (up to 60 % of its half height), so a
  WC and basin a metre away are in the picture with the walls still
  vertical. The shift eases out as you walk and clears when you tilt the
  view. Pins follow the live lens and shift.
- **The furniture pack.** Sofas, beds, wardrobes, kitchens, bathrooms,
  curtains and lamps are procedural, so they restyle. Armchairs and lounge
  chairs, coffee and side tables, the TV unit, dining chairs, plants, the
  pendant, vases, art, books and bowls are CC0 Poly Haven models from
  `web/playground/assets/furniture` (22 models, 6.1 MB). They are embedded
  once and instanced.
- Every material follows the restyle naming contract (see
  [Restyle](restyle.md#for-generators-and-modellers-the-naming-contract)).
  The soft goods, joinery and surfaces restyle. Hero models, art, plants,
  glass and lamps are never touched.

### Where the furniture pack comes from (deploys)

The pack is committed, so a deploy needs no network and no extra build
step. `web/playground` is copied into the image as before, and
`.dockerignore` only drops GLBs directly under `assets/`, not this
sub-folder. It is deterministic: `manifest.json` holds each shipped file's
sha256, and the generator checks it on load. A missing or altered file
falls back to the procedural piece for that role and never fails a
build. The size is capped at 12 MB by `pack.mjs` (6.1 MB today). To change
it:

```
node tools/plan2home-lib/fetch.mjs   # raw CC0 sources from polyhaven.com → ~/VerseTestAssets/plan2home-lib (local only)
node tools/plan2home-lib/pack.mjs    # Blender headless → web/playground/assets/furniture (commit the result)
```

The licence record is in `docs/attributions.md`.

## Plan to Film: a 30-second film of the home

Tap **Film** on any Verse Home (or **Make a 30 s film** on the build's done
card, or **Make a film** after the home arrives on WhatsApp) and pick
**9:16** (1080 × 1920, the default: for phones and stories) or **16:9**
(1920 × 1080). The film is made in your browser from the home itself, and
nothing is uploaded:

1. your floor plan as a sheet on a softly lit desk, with a slow push-in
   (the picture you uploaded; a home built without one shows its plan
   drawing);
2. the plan becomes glowing indigo lines, the walls rise from it, and the
   furnished home fades in under them, seen from above;
3. the camera comes down over the entrance to eye height (1.5 m) and walks
   the home's walkthrough route, one short clip per room in route order,
   slowing for about a second in each room, with a quick cut from one room to the next (never a double exposure). Each room is shot from near the doorway it is entered by, looking at its furniture, at least 0.8 m from any piece and 0.5 m from the walls. The route is the scene's
   default camera path (the automatic walkthrough, or a path you drew on
   the plan), so the camera never passes through a wall;
4. a cut to just above the last room, seen through the cutaway, and out into an aerial view of the whole home;
5. an end card with the home's name, its link as text and as a QR code,
   and the Verse by Ctruh mark.

The film is 30 seconds at 30 fps: MP4 (H.264) where the browser can encode
it, WebM elsewhere, about 15 MB at 1080 × 1920 so it fits a WhatsApp video.
Every frame waits for the streamed textures to be in, so no frame is
blurred, and the same home always gives the same film. A computer takes 1
to 3 minutes (measured on a recent laptop); a phone makes it at 720 × 1280. **Cancel** stops it at any
time. Your plan sets the resolution and the mark, as for any
[video export](export-video.md).

The WhatsApp bot does not send the video itself: **Make a film** replies
with the home's link with `&film=1`, which opens the film sheet on the
phone, and **Share** sends the finished film on.

For scripting: `await window.__versePlanFilm({ format: "9:16", download: false })`
resolves the film (`blob`, `width`, `height`, `frames`, `film.clips`).
The gate is `web/test/fix-verify-planfilm.mjs`.

## Change the sofa, the floor, the walls (swaps)

Tap **Change** in the viewer. The sheet lists what this home can swap,
with two or three curated options each, all from the CC0 library:

| Category | Options |
| --- | --- |
| Sofa | Tan leather, Taupe weave, Ivory bouclé |
| Bed (headboard) | Walnut panel, Charcoal leather, Ivory bouclé |
| Dining table | Walnut, White marble, Light oak |
| Flooring (dry rooms) | White marble, Natural oak, Terrazzo |
| Wall paint | Warm white, Soft greige, Sage green |
| Curtains | Ivory linen, Taupe, Navy |
| Rug | Cream wool, Navy wool, Terracotta |
| Kitchen counter | Black marble, White marble, Terrazzo |

Tap a thumbnail to apply it, or tap something in the room while the sheet
is open to jump to its category. **Undo** steps back. A choice rides in the
link's `?style=` (`x.sofa=leather-tan`), the same way a Restyle look does,
so the link you share opens with it. The device also remembers the last
look for each home, so a reload keeps it. A Restyle preset changes the
room around the pieces you chose.

**Say it.** Press and hold the mic in the sheet (phone or desktop) and
say "show me a leather sofa", "make the floor marble", "try a lighter wall
colour", "change the bed", "undo" or "what other options are there?". You
can also type it. The words go to Ask Verse, which calls its `swap` and
`swap_undo` tools. Without an AI key, a built-in grammar (`swaps.js`)
answers. The reply is shown and read out. Every spoken change also has a
button to tap.

## How fast

In short: a floor plan becomes a shareable 3D home link in about 2 s of
compute (1.4–1.7 s measured: the warm median on an M5 Pro over 8 repeats,
CV reader, 16 Oct 2026; the first upload after a server start takes
2.3–5.9 s), and in about 15 s end to end with the AI reader.

These times were measured by `web/test/fix-verify-instanthome.mjs` on a
laptop with no AI key (CV reader only), after the premium pass:

| Step | Synthetic PNG (2BHK) | Scanned JPEG (3BHK) |
| --- | --- | --- |
| Read the plan | 0.18 s | 0.36 s |
| Generate (furnish, bake, pack) | 0.31 s | 0.27 s |
| Compile + publish | 2.3 s | 1.9 s |
| Upload → link ready | **2.8 s** | **2.5 s** |

- **Through the UI**, from upload to the result: 3.6 s on a desktop
  and 4.1 s on an emulated iPhone 13.
- **With the AI reader**, on real brochure plans and recorded Haiku 5.5
  answers (`web/test/instanthome-ai-e2e.mjs`, with no key and no network),
  upload to link ready took 2.8–3.0 s. A live model adds its own latency
  on top (a median of about 12 s), so the real figure is about 15 s.
- **The gate** fails if any of these is over 60 s.
- **Opening a link**, the first picture arrives in about 0.5 s on a
  desktop and 1.2–2.2 s on a phone. The link settles in about 5–6 s.
- **Phone memory** is 50–96 MB for a 1BHK to a 3BHK (the target is under
  150 MB, the budget 256 MB).
- **Sizes**: a home is a 7–11 MB GLB and a 13–20 MB `.vpk`, which
  streams. Before the premium pass the `.vpk` was 2–3 MB.

## Limits

- A noisy scan can lose a door. The reader adds the most likely one and
  highlights it. A room that no door can legally reach (one with no
  shared wall, or one reached only through a bathroom) is named in the
  plan editor, and you fix it there before you generate. If a room marked
  Bathroom is really a passage, change its type and the repair works.
- The light is baked into the vertex colours, so it does not change if you
  move a piece in an editor. The real-time GI stays off for generated
  homes.
- Very small rooms (a 1.4 m toilet, a 2 × 2 m bedroom) get fewer pieces
  than the stylist minimum. The gate counts only rooms of 4 m² or more,
  and bedrooms under 7 m² need two pieces.
- The view is one panorama graded to four times of day. It is a fixed
  picture, so it does not change while you watch, and its towers do not
  move against each other as you walk (they all sit at the same 40 m).
- A WC cubicle under about 0.9 m wide with its door in a long wall has no
  room for a fixture outside the door's approach, so it stays empty.

## Gate

`web/test/fix-verify-instanthome.mjs` runs on a real GPU (WebGPU on the
desktop, WebGL2 on an emulated iPhone 13). Without a GPU (a Linux
container), run the WebGL2 tier on SwiftShader:

```
cd web/test && QA_GPU=swiftshader QA_CHROME=/path/to/chrome QA_TIERS=c \
  QA_EXTRA_Q="&texfmt=0&watchdog=120000" QA_PORT=10520 node fix-verify-instanthome.mjs
```

`texfmt=0` streams RGBA textures (BC7 crashes SwiftShader's GPU process),
`watchdog` gives a slow software frame time before the viewer restarts its
render worker, and stills are read back from the canvas. Tier A and the
tier A/C parity checks are reported as not run. `instanthome-premium.mjs`
takes the same variables (`--q "&tier=c&texfmt=0&watchdog=120000"`, and
`QA_PHONE_DPR=2` to halve the phone's pixels).

The gate checks:

- the naming contract on 24 generated homes;
- upload → link ready ≤ 60 s for a synthetic PNG and a scanned JPEG, over
  HTTP and through the UI;
- that the link opens walking at the spawn, is textured, and has the
  Restyle chip and Tour together;
- that no room is dark;
- phone memory ≤ 256 MB;
- desktop vs phone mean ΔE76 ≤ 3;
- that every Restyle preset changes the floors and the walls, and that
  Original restores the first frame;
- a three-person tour, in which both guests follow the host and receive the
  host's restyle;
- that no page shows an error;
- the premium pass, across all six synthetic layouts:
  - furniture per room type (living room ≥ 5 pieces, bedroom ≥ 3, or 2
    under 7 m², kitchen ≥ 2, bathroom ≥ 2);
  - zero overlaps, and nothing floating: pieces stand on the floor, props
    on their part's drawn top, wall pieces hang on a wall and pendants
    hang from the ceiling;
  - baked AO in every floor's vertex colours;
  - the furniture pack's models in use;
  - every room view within mean ΔE76 ≤ 3 between phone and desktop.

Screenshots go to `web/test/out/instanthome/`. The hero set (a 1BHK, a
2BHK and a 3BHK; living room, kitchen, master bedroom and bathroom on a
desktop and an iPhone 13; a preset sheet) is made by
`web/test/instanthome-premium.mjs` into `web/test/out/instanthome/premium/`.
`web/test/instanthome-ai-e2e.mjs` times upload to link ready on real
brochure plans, with the AI reader answering from recorded replays.
