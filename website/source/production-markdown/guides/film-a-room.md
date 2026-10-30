# Film a room (beta)

Film a room with your phone and get a walkable 3D space you can share as a link. A 30-second video
typically comes back in two to three minutes.

## How to film

1. **Walk slowly around the edge.** Start in a corner and move at half your normal pace, phone upright at chest height, about 2 metres from what you film.
2. **Film the walls, ceiling and floor.** Tilt up to the ceiling and down to the floor now and then. Plain white walls and ceilings need to be seen to come out.
3. **20 to 40 seconds, good light.** Lights on, curtains open, one continuous shot. No zoom, no edits, nobody walking through.

The upload card shows these steps under **Film a room**, and checks your video's length and brightness
before sending it.

## Upload

- In the app: **Film a room**, then pick or drop the video (MP4, MOV, WebM or AVI), or a zip of 20 to 300 photos of the room.
- On WhatsApp: send the video to the Verse number. Progress notes come back, then the link.

The scene opens at eye height facing the room, with a tour along the path you filmed.

## If it did not work

Verse checks the video before spending any time on it and says what to change.

| Message | What to do |
| --- | --- |
| Too dark | Turn the lights on and film again. |
| Too short or too few photos | Film 20 to 40 seconds, or send at least 20 photos. |
| Too blurry | Move more slowly. |
| Could not work out the camera positions | Film the whole room, overlapping the same areas again. |
| Could not find the floor | Tilt down so the floor is in the video. |
| Photo format not supported (HEIC) | Export the photos as JPEG. |
| Capture is not available | The service is off on this server; try again later. |

After a successful capture you also get tips for the next one, such as filming the ceiling.

## Good to know

- A capture is a Gaussian-splat scene, so it looks like the room, not like a clean model. It is best for showing a real place; for a designed home, use [Floor plan to 3D home](#/guides/floor-plan-to-3d).
- Rooms build one at a time; for a whole home, film each room.
- Developers: see `POST /v1/ingest` in the [API reference](#/api).
