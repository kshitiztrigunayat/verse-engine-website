# Floor plan to 3D home

Upload the floor plan from a project brochure and get a furnished 3D home
in about a minute. Buyers can walk through it on their phone, and you can
share it on WhatsApp.

**You need:** the plan as a PNG, JPEG, WebP or PDF. A screenshot of the
brochure page is fine. Any hints you add (carpet area, BHK) make it more accurate.

## Make one

1. Open the app (`/app`) and press **Floor plan → 3D** on the upload screen.
2. Pick the plan image. Optionally add:
   - **Carpet area (sq ft)**: the most useful hint, because it sets the
     scale. Built-up and super built-up areas work too; say which one it is.
   - **Plan width (m)**: the outside width of the flat, if you know it.
     This wins over the area.
   - **BHK**: caps how many rooms are called bedrooms.
   - **Style**: Modern Indian, Scandinavian, Luxury or Minimal. This sets
     the floors, wall paint, wood and fabrics.
   - **City** and **Name**: used for the title and the share message.
3. Press **Read plan**. After a few seconds the plan comes back as a
   drawing, with each room coloured by type, its name and its area.
4. Check it:
   - **Tap a room** to rename it or change its type (Bedroom, Kitchen,
     Pooja room…).
   - **Rotate 90°** or **Flip** if the plan was read sideways or mirrored.
     The entrance door is drawn in green, with a green **IN** marker.
   - **Doors.** Doors the reader added (the plan didn't show them) are
     highlighted in orange. Press **Edit doors** and tap a wall to add a
     0.9 m door. Tap a door, window or open gap to switch it between the
     three, remove it or make it the entrance. Tap **IN**, then a door or an
     outside wall, to move the entrance. Every change re-checks that each
     room can be reached and names the ones that can't. **Add doors for
     me** adds the fewest doors that connect them. With the keyboard,
     openings and the IN marker are buttons. In Edit doors a room's panel
     lists **+ Door to …** for each neighbouring room.
5. Press **Generate 3D home**. When it is ready you get the link, an
   **Open** button, **Share on WhatsApp** and **Copy link**.

The link opens standing at the entrance of the living room. There is one
hotspot per room with its name and area, and a short guided tour through
the rooms.

## What it builds

- Walls at 3 m with real openings. Doors are 2.1 m high and drawn open, so
  you can walk through. Windows run from a 0.9 m sill to 2.1 m and have
  frames and glass.
- Floors, ceilings and skirting. Floor materials follow the room type:
  tiles in bathrooms and the kitchen, outdoor tiles on balconies, wood or
  marble elsewhere, depending on the style.
- One ceiling light per room.
- Furniture by room type:

  | Room | Furniture |
  | --- | --- |
  | Living | sofa, coffee table, TV unit, rug |
  | Bedroom | bed, side tables, wardrobe |
  | Kitchen | counter, fridge |
  | Dining | table, chairs |
  | Bathroom | WC, vanity, shower |
  | Study | desk, chair |
  | Pooja | mandir unit |
  | Balcony | chairs, table |
  | Utility | washing machine |
  | Foyer | shoe rack |

  Furniture stands against a wall. It stays out of door swings and keeps a
  0.75 m walkway, and no two pieces overlap. A piece that does not fit is
  left out; nothing is squeezed in.
- **Before publishing**, the generator walks the home on a 10 cm grid,
  starting at the entrance. If any room cannot be reached, it does not
  publish. Instead it names the room, and the plan editor highlights it
  (usually a door that was read as a window, or a wall that was read
  through a doorway).

## How well it reads plans

Two readers are used:

- **The plan reader** always runs. It needs no AI and no network. It finds
  the walls (solid, grey or hatched), the gaps in them, and the rooms
  between them. A gap whose lines run along it is a window; a gap with a
  drawn door leaf is a door. Measured on the test set (6 flats from 1 to
  4 BHK, each drawn in 3 brochure styles — clean, tinted with furniture,
  and a noisy hatched scan):

  | | Measured | Target |
  | --- | --- | --- |
  | Wall overlap (IoU) | 0.86 | ≥ 0.85 |
  | Rooms found | 95 % | ≥ 90 % |
  | Doors | 92 % | ≥ 85 % |
  | Windows | 94 % | ≥ 85 % |
  | Scale error, no hints | 2.4 % | ≤ 5 % |
  | Room types, no AI | 67 % | ≥ 60 % |

  The reader cannot read text, so it guesses room types from size and
  layout. For example, the biggest room the entrance opens into is the
  living room, and small closed rooms are toilets.
- **The AI reader** runs only when the operator has turned it on (see
  below). It reads the labels printed on the plan ("M. BED", "TOI",
  "KIT", "POOJA"), the dimension text (feet-and-inches or metres) and the
  entrance. Where the plan reader's rooms agree with the AI's, the plan
  reader's geometry is kept and the AI supplies names and types. Where
  they disagree (photos, colour-filled brochures, line drawings), the plan
  is built from the AI's rooms. The scale comes from the printed room
  dimensions, measured against the room outlines in pixels.

  Measured with the real Anthropic API (`claude-haiku-5-5`, the default)
  on 28 plans. 18 are the synthetic test plans above. 10 are
  brochure-style plans made for the test: a colour brochure, a tinted
  plan with wood floors and a watermark, a line drawing, a "SAMPLE FLAT"
  watermark, a low-resolution plan in metres, a large 4 BHK, two phone
  photos of the printed page (turned 4° and 7°, keystoned, uneven light),
  a turned noisy scan, and a two-unit page. These are rooms found, room
  types right, doors, windows, wall overlap and scale error:

  | Plans | Reader | Rooms | Types | Doors | Windows | Walls | Scale error |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | Synthetic, clean (6) | Plan reader | 96 % | 71 % | 94 % | 100 % | 0.88 | 2 % |
  | | AI only | 100 % | 100 % | 74 % | 66 % | 0.68 | 2 % |
  | | **Both** | **99 %** | **100 %** | **94 %** | **100 %** | **0.87** | **< 0.5 %** |
  | Synthetic, tinted (6) | Plan reader | 96 % | 71 % | 94 % | 100 % | 0.85 | 2 % |
  | | AI only | 100 % | 100 % | 96 % | 98 % | 0.77 | 1 % |
  | | **Both** | **99 %** | **100 %** | **94 %** | **100 %** | **0.88** | **1 %** |
  | Synthetic, scan (6) | Plan reader | 94 % | 59 % | 88 % | 83 % | 0.83 | 3 % |
  | | AI only | 100 % | 100 % | 59 % | 55 % | 0.72 | 1 % |
  | | **Both** | **99 %** | **100 %** | **88 %** | **90 %** | **0.81** | **1 %** |
  | Brochure-style (10) | Plan reader | 49 % | 29 % | 51 % | 46 % | 0.35 | 152 % |
  | | AI only | 100 % | 100 % | 67 % | 66 % | 0.56 | 1 % |
  | | **Both** | **99 %** | **100 %** | **94 %** | **93 %** | **0.56** | **1 %** |
  | All 28 | Plan reader | 79 % | 53 % | 77 % | 77 % | 0.68 | 56 % |
  | | AI only | 100 % | 100 % | 73 % | 71 % | 0.66 | 1 % |
  | | **Both** | **99 %** | **100 %** | **93 %** | **96 %** | **0.75** | **1 %** |

  Per brochure-style plan, with both readers: every plan has 91–100 % of
  its rooms and 100 % of its types, and **every one builds** (the walk
  reaches every room). The weak spots are the phone photos (77–93 % of
  the doors, 78–83 % of the windows). The plan reader alone cannot read
  the line drawing, the metric plan, the wood-floor plan or the two
  photos at all.

  **Doors the readers miss.** A missed door leaves a room nobody can walk
  into, and the build refuses the plan. So before the plan is shown, the
  reader checks it the way the build does and adds the most likely door
  for every room that can't be reached: on a wall the room shares with a
  room you can reach, chosen by what the two rooms are (a toilet opens off
  the passage or a bedroom, not the living room or the kitchen; a pooja
  room off the living room or the foyer; one attached toilet per bedroom),
  at a standard width (0.75 m toilet, 0.8 m kitchen, 0.9 m bedroom, 1.2 m
  balcony), where the AI marked a door if it marked one near there. A page
  with two flats gets a front door per flat. Where the plan came from the
  AI's reading, a living room, bedroom, kitchen or toilet with no window
  gets one in the middle of its outside wall. Doors added this way are
  flagged `added: true` in the plan and highlighted on the edit step.

  **Open plans.** A kitchen open to the living room is drawn as a counter
  line, and an archway as a gap with thin lines across it. Readers used
  to take both for windows, which cut the rooms behind them off. Now a
  "window" between a living room / dining / kitchen and a kitchen /
  passage is an **open gap** (`kind: "open"`: no leaf, walked through like
  a doorway). One between a bedroom and a living room or passage is a
  door. A doorway of 1 m or more between a kitchen / living / dining and a
  living / dining / passage is an open gap too. On the AI's own geometry,
  where every room is outlined, a kitchen, dining or living room whose
  outline touches another's gets an open gap between them. The plan
  reader also re-searches wall gaps at the door scale (thin-walled
  drawings used to leak 2 m openings into the outside). It closes a wide
  window (up to 4.2 m) that encloses a room, and it puts the entrance on
  the living room's outside door.

  **The repair.** If a room still can't be reached, each cut-off part of
  the plan gets one door. It goes on the longest wall that part shares
  with the reachable rooms, choosing a believable pair first: a bedroom
  off the passage or the living room, a utility off the kitchen, and the
  living room, dining, passage, kitchen or foyer as the usual way in.
  Doors never go through a bathroom and never in an outside wall. A wrong
  entrance is moved to the living room's outside door first. Only a room
  no legal door can reach is left for the owner (the build's 422 names
  it). `/v1/plan2home/analyze` reports `repair: { added, entrance,
  unreachable }`. Before this,
  6 of the 10 brochure-style plans could not be built, and doors / windows
  were 84 % / 77 % on them (89 % / 88 % on all 28).

  **Real plans (16 Oct).** Production met real plans the test set did not
  have — 376 px brochure crops, colour-filled CAD exports, US listing plans
  with furniture in orange and blue, walls drawn as a grey fill between two
  outlines, tiled toilets, one image that was not a plan at all. Changes:

  - *The plan reader reads a plan up to four ways* and keeps the most
    plausible reading (rooms cover the outline, none swallows the plan, few
    slivers, every room reachable): the classic reading; one that ignores
    coloured fills (furniture, wood floors) for the walls but still reads
    blue window and brown railing lines; one for dark walls only (grey
    floors and tiles are not walls); and one for light-grey walls between
    two outlines. Small images are scaled up first. The door scale now
    comes from gaps that have a drawn leaf or swing, clustered by width, so
    a thick-walled drawing no longer hides its doors. It also finds doors
    between two wall ends with no wall along the door line, window glass
    drawn on the wall line, balconies fenced by railings, and seals wide
    sliding doors that left a room open to the outside.
  - *The AI reader* is told what real sheets hold (open kitchens with no
    wall, arches, furniture and tiles that are not walls, printed room
    areas, a total on the sheet, images that are not plans). It reports
    printed room areas, which set the scale when there are no dimensions.
    The merge fuses rooms the plan reader split (a bed or a label read as a
    wall), keeps the floor the model's outlines leave out, and re-reads
    every door's two rooms. A plan reader reading that looks implausible is
    not merged at all.
  - *Validation before build.* Every reading is checked: the rooms' total
    against the printed total or your carpet-area hint (15 %), each room
    against its printed area or dimensions, overlapping doors or rooms,
    rooms under 1.5 m² that are not a toilet or store, and rooms nobody can
    reach. Slivers join their neighbour, a balcony read a little off the
    wall is moved to it, a wall read twice keeps one door, and the front
    door is an outside door into the foyer / living / dining (added if the
    plan shows none). If the AI's reading still fails, the plan is read
    again by `claude-sonnet-5-5`, then `claude-opus-5-5`, each told what
    was wrong; the reading with the fewest problems wins (`ai.tries`).
    Whatever is still off is listed in **Check rooms** ("Check before you
    build"), each item selecting its room — never a dead end.
  - *Not a plan:* a photo of a room is refused with a message, not built.
  - *The walkthrough* plans again with tighter margins when a narrow hall
    with doors swung into it closed the walk.

  Measured on 13 real plans (private; their truth was written by reading
  each image) with `web/test/fix-verify-ih-real.mjs`: see the CHANGELOG for
  the table. The gate also runs against staging, where the AI reader is on
  (`IH_BASE`, `IH_GATE`).

  **Speed and cost** (Anthropic list prices): one AI read takes 12 s
  (median; 15 s at the 90th percentile, 19 s at worst). It uses about
  5,400 input and 2,600 output tokens, which is **$0.002 per plan**.
  `claude-sonnet-5-5` scored the same on rooms and types, lower on doors
  (86 %) and windows (89 %), took 8 s, and cost $0.023 per plan (12 ×
  more). If Haiku's answer cannot be used, the reader asks
  `claude-opus-5-5` once. On the four hardest plans, Opus found 92–100 %
  of the doors, against 27–73 % for Haiku. It costs $0.07 per plan and
  takes 13–26 s. In the test, no Haiku answer needed this retry.

  The eval is `web/test/plan2home/ai-eval.mjs`. It replays the recorded
  answers offline, and the plan2home gate enforces the numbers above with
  a margin.

### Known limits

- Walls must be horizontal or vertical. A diagonal wall is read as steps
  or skipped.
- One floor per upload. Duplexes and villas need one upload per floor.
- With no hint and no printed number, the scale comes from the doors (a
  typical door is 0.85–0.9 m), which can be 15 % off; with the AI reader,
  a scale that makes the bedrooms implausible is replaced by a typical
  bedroom size. Add the carpet area for a better result.
- Without the AI reader, room types are guessed from size and layout:
  kitchens, utilities, stores and passages are often mislabelled. Rename
  them in Check rooms.
- A sheet with two flats is read as both flats and their lobby.
- Without the AI reader, photographed, colour-filled and line-drawn plans
  are often not read. With it, a photo turned a few degrees (tested up to 7°) is
  straightened and read, but its doors and windows are less reliable than
  a flat scan's. Colourful 3D renders are not read well. Use the 2D plan
  page of the brochure.

## Privacy

The plan image stays on the server that you upload to. **The image is sent
to the Anthropic API only when the operator has set `ANTHROPIC_API_KEY`**,
and then only so the AI reader can read the labels. Without the key,
nothing leaves the server. The server log records the request size and
timing, but never the image or the AI's answer.

## Operator setup

| Variable | Default | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | unset | Turns on the AI reader. Without it, only the plan reader runs. |
| `VERSE_PLAN_MODEL` | `claude-haiku-5-5` | The model the AI reader uses. If it is overloaded or down, the reader tries `claude-sonnet-5-5` once (or `claude-haiku-5-5` if another model is set). |
| `VERSE_PLAN_RETRY_MODEL` | `claude-opus-5-5` | Asked once when the first model's answer cannot be used. `off` turns the retry off. |
| `VERSE_PLAN_ESCALATE` | `claude-sonnet-5-5,claude-opus-5-5` | Read the plan again with these models, in order, when a reading fails validation (areas off, rooms unreachable, overlapping doors, impossible rooms). `off` turns it off. |
| `VERSE_PLAN_ESCALATE_MS` | `50000` | No new reading starts after this long. |
| `VERSE_PLAN_PROMPT` | `v3` | The prompt version (`v2`, `v1` for comparison). |
| `VERSE_PLAN_EFFORT` | `medium` | Effort for the AI reader. `low` is about twice as fast, and finds fewer doors and windows (83 % and 82 %). |
| `VERSE_PLAN_TIMEOUT_MS` | `60000` | The longest the AI reader may take, including a retry. After that, the plan reader's result is used. |
| `VERSE_PLAN_DAILY_CAP` | `500` | AI reads per server per day. |
| `VERSE_PLAN_LIB_DIR` | `tools/plan2home-lib` | The CC0 furniture and material library (optional). |

The furniture and material library is optional. It is not in the
repository: run `node tools/plan2home-lib/fetch.mjs` to download it. The
fetch checks every file against the manifest. Without the library, the
furniture is built from simple shapes and the materials are flat colours.
Sources and licences are listed in [Attributions](../attributions.md).

The API is described in the [API reference](../api.md#floor-plan-to-3d-home).
