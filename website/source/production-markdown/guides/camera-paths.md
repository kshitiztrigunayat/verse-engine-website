# Camera paths: record a walkthrough

A camera path is a smooth track through your scene. Record one in a minute, share it as a link, or turn
it into a video.

## Record a path

1. Open your scene while signed in and choose **Path → Record**.
2. Walk or orbit to a view and tap **＋** (or press Enter) to drop a keyframe. Repeat around the scene.
3. Tune each key: drag to reorder, add a chapter label, set how long the move takes (or leave it automatic), a pause, an ease (smooth, ease in/out, linear), a field of view, and an optional look-at target.
4. **Preview**, then **Save**.

**From auto-tour** turns the scene's automatic tour into keys you can edit. On a phone the same
controls sit in a bottom sheet with a large ＋ button.

Paths are smooth splines at a constant speed. Walk paths stay at eye height on the floor and are pushed
out of walls; the panel warns you when a key sits inside solid geometry.

## Draw your path on the plan

In **Path**, press **✎ Draw on plan**. The floor plan opens beside the
scene (above it on a phone). Drag one line through the rooms in the order
you want to walk them, with a mouse, a pen or a finger:

- the line becomes a smooth walk at eye height, starting where you started
  the line;
- it slows down in each room (rooms come from the home's plan) and the
  first point in a room becomes a chapter named after it;
- the camera faces along the path and looks a little ahead;
- a part of the line on a wall, a bed or outside the home moves to the
  nearest free floor, and a line drawn straight through a wall is walked
  through the nearest door instead.

The preview starts as soon as you lift. Draw a second line to continue
from where the walk ends, **Undo** to remove the last line, **Clear** to
start again. **Save** keeps it as an ordinary camera path, already ticked
as the share-link default, so the share link's walkthrough and
[Plan to Film](#/guides/instant-home) use it. Any interior with a walk
grid works; Verse Homes also show their room names.

## Play it

Paths are saved beside the scene. A link such as `…?path=<id>` plays it with play/pause, a scrubber and
chapter buttons; `?path=default` plays the default path.

## Export a video

**Export** renders MP4 (H.264) or WebM (VP9) at 720p, 1080p or 4K and 30 or 60 fps. Every frame is drawn
at its exact time with the streamed view fully loaded first, so a slow device takes longer but never
produces a different video. 4K needs Pro or Scale; Free is 720p, Starter 1080p
(see [plans](#/guides/plans-and-pricing)). More in [Export a flythrough video](#/guides/export-video).

## Default paths (automatic)

Every scene gets a path without anyone recording one, planned right after the scene is built:

- **Interiors and buildings: Walkthrough.** An eye-height tour through every room, with a chapter per room (45 to 90 seconds).
- **Exteriors, sites and captures: Fly-through.** An establishing orbit, a reveal, a low pass along the most open street, then a rise that looks back, kept clear of roofs and towers (40 to 80 seconds).
- **Products: 360° view.** A slow hero orbit (24 seconds).

Visitors see a **Walkthrough**, **Fly-through** or **360° view** button. Add `?autoplay=path` to a link,
or `autoplay-path` to an embed, to play it on open.

Owners open **Path** to adjust it in place: drag a key to move it, change altitude on fly paths, add or
delete keys, set a segment's speed, keep level, look at a target, then Save. **Reset to auto** goes back
to the planned path. Once you edit it, it is yours and re-uploads keep it. Exteriors also get a
**Drone** mode: WASD and Q/E to fly, drag to look, wheel for speed (two on-screen sticks on a phone);
record a flight and it becomes an editable path.

The default path exports to MP4 or WebM like any other, and to a JSON camera file (position, rotation and
field of view per frame) for Blender, Unreal or After Effects.

The cinematic (path-traced) export is behind a flag and is not part of the public release.
