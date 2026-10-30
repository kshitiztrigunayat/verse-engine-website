# Author a guided tour

Turn a scene link into a presentation: numbered hotspots a buyer can tap
for a card, a guided tour that flies them from room to room with your
narration, the sun where you want it, and a floor plan they can tap to
walk anywhere. Everything is authored inside the viewer, on the real scene,
and saved as an experience the share link plays.

**You need:** a Studio account (sign in at `/studio`) and a scene you own
(upload it signed in, or **Claim** it). Authoring works on streamed scenes
(`ingest/<id>.vpk`).

## Open the Author bar

From Studio, open the scene card's **Experiences** panel and press **New
experience** — or add `&author=1` to any link of a scene you own:

```
https://HOST/?vpk=ingest/<id>.vpk&author=1
```

The Author bar appears on the right (bottom sheet on a phone). If you are
not signed in, the status line says so; sign in at `/studio` and reload.

## Drop hotspots

1. Walk or orbit to where the thing is.
2. Press **Drop hotspot**, then click the surface you want the pin on —
   the kitchen island, the window, the wardrobe. The click lands the pin;
   the view you were looking from becomes the hotspot's jump view (what
   **Go there** and the tour use).
3. Fill the card: a **Title**, **Text** (plain text; `**bold**`,
   `*italic*` and `[links](https://…)` work), an optional **image URL**
   from this origin (a published poster works) and an optional **link**.
4. **↑ / ↓** reorder — the numbers on the pins follow. **Set view**
   re-captures the jump view from the current camera; **Go** jumps there.

## Record the tour

For each hotspot, stand where the camera should rest and press **Record
step**. The step keeps that camera pose; set its **dwell** (seconds at
rest), write the **narration** the visitor reads while the camera rests,
and optionally attach an **audio clip** (mp3, m4a, ogg, wav or webm, up to
2 MB — it uploads when you save). The tour plays the steps in hotspot
order, flying between them at a walking pace, and leaves the visitor
standing at the last step. **Preview tour** plays it now.

## Keep the sun

Open **Sun** on the toolbar: move **Azimuth**, **Elevation** and
**Intensity**, or enter a **date, time, latitude, longitude and UTC
offset** and press **Place sun** — the sun lands where it would really be
(set **North** if the plan is rotated; the default puts north at −Z). The
link's `?sun=` updates as you drag, so a bare link can carry a sun too.
Leave "Save the current sun" ticked and the experience keeps it.

On lightmap-baked scenes the bake keeps its own light: only live-lit
surfaces and the shadows they receive move.

## Save and share

- **Save** publishes the experience (its own link shows under the
  buttons: `/?experience=/v1/experience/<id>`). Save again after edits —
  the same link updates in place.
- **Set as link default** makes the scene's plain share link
  (`/?vpk=ingest/<id>.vpk`, the one on the Studio card and in embeds) play
  this experience. Studio's **Experiences** panel lists every experience
  of the scene, opens, edits, and switches or clears the default.

## What visitors get

Numbered pins over the scene; tap one for the card and **Go there**.
**Play tour** on the toolbar runs the guided tour with your narration (text
and audio). **Plan** orbits the home from above with the floor plan open —
tap a room to walk there. **Dollhouse** frames the whole building; press it
again to return. On phones the same controls are on the toolbar.

In an embed, `viewer.playTour()` starts the tour and `hotspot`,
`hotspots`, `tour-step` and `tour` events report what happened;
`hotspots: false` keeps the layer off ([embed SDK](../embed-sdk.md)).

## Limits (honest)

- Pins are projected without depth: a pin behind a wall still shows (it
  fades with distance).
- The plan teleports to the staged floor height — one storey per plan.
- Audio autoplay follows the browser: if a clip does not start by itself,
  the player under the narration has a play button.
- Bake-dominant scenes are not detected automatically; the Sun panel's
  note applies.
