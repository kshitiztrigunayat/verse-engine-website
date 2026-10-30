# Video on surfaces, sound in the room

A TV that plays in the lounge, a looping brand film on the lobby wall, a
fountain you can hear before you see it. In 2.7 a scene's owner puts a
**video on any surface** and **sound anywhere in the room**, and every
visitor — in the viewer, in a private share, in an embed — gets playing
screens that glow and audio that sits where its source is. WebGPU and WebGL2;
streamed scenes (the `.vpk` your upload compiles to).

## What you need

- A scene you own (signed in at `/studio`; upload or claim it).
- A video: **mp4 (H.264) or webm**, up to **200 MB**. Any size — the engine
  samples it at 512², so 720p is plenty; a 4K file only costs bandwidth.
- Optional sound: **mp3, m4a, ogg or wav**, up to **20 MB** per clip.

Files you upload are stored with the scene (`ingest/<id>.media/<n>.mp4`),
served under its visibility (a private scene's video needs the share
token, like its model) and deleted with it. You can also point at a file
already on the same host; cross-origin URLs are refused (the frame is
read back on the GPU and must not be tainted).

## Put a video on a surface

1. Open the scene with `?author=1` (the Author bar appears; sign in first).
2. Click **Media** in the scene chrome, then **Pick a surface**.
3. Click the surface — the panel shows *Material N — give it a video*.
4. Paste a same-origin URL **or** choose a file, then **Add**. The upload
   runs, the table saves, and the screen starts playing right away.
5. Adjust **Glow** (0 = the frame as is; 1 is the default, up to 4). The
   screen is self-lit either way — it reads the same in a baked room as in
   a live-lit one. Tick **Sound from this screen** to play the video's own
   track from the surface.

The video covers the material's whole UV range the way its baked texture
did: a screen modelled as one quad with 0–1 UVs shows the full frame; a
material shared by several objects shows it on all of them. Up to **four**
screens per scene.

## Place an ambient sound

1. **Media → Place ambient sound**, then click where the sound lives (the
   fountain's basin, the speaker on the shelf).
2. Paste a URL or choose a clip, **Add**.
3. Set **Radius** — the distance at which it fades to silence (linear) —
   and **Gain**.

## What visitors get

- Screens play muted and loop. A screen pauses when it is behind the
  visitor or farther than 40 m, and resumes the moment it is in view.
  Visitors with *reduce motion* set in their OS see one still frame.
- A **Sound** chip appears in the scene chrome whenever the scene has
  audio. Browsers will not play sound until the visitor clicks something:
  the chip is that click, and the global mute. Each source is positioned
  (HRTF) and follows the camera as the visitor walks.
- Everything is in the share link already — the table is stored with the
  scene and follows it through versions (a new upload keeps its screens).

## From code

```js
// Node / browser SDK — the same thing the Media panel does.
const clip = await verse.scenes.uploadMedia(id, mp4Bytes, "video/mp4");
await verse.scenes.setMedia(id, {
  media: [{ material: 3, url: `/${clip.path}`, emissive: 1.5, audio: true }],
  audio: [{ pos: [2, 1.2, -1], url: "/ingest/abc.media/2.mp3", radius: 6, gain: 0.8 }],
});

// Embed SDK — swap the table live (not saved), drive the mute.
viewer.setMedia({ media: [{ material: 3, url: "/ingest/abc.media/1.mp4" }], audio: [] });
viewer.on("media", (m) => console.log(m));
viewer.setAudioMuted(false); // after a click in your page
```

API: [`GET/PUT /v1/scenes/<id>/media`, `POST …/media/upload`](../api.md#media-surfaces-spatial-audio-2-7).
Embed: [`setMedia` / `getMedia` / `setAudioMuted`](../embed-sdk.md#setmedia-table-getmedia-setaudiomuted-muted).

## Limits, honestly

- Four screens per scene; frames are sampled at 512² and at most 30 fps,
  and a frame is dropped rather than queued when the previous one is
  still on its way to the GPU. Expect ~1–2 ms of render-worker time per
  playing screen per frame.
- A screen is self-lit, not a light: it does not light the room, is not
  reflected by the environment probe, and the cinematic path tracer
  renders the material's own base colour.
- Sound has no occlusion — a wall does not muffle it; use the radius.
- Media must be same-origin. Classic GLB scenes (not streamed) have no
  media surfaces.
- The owner's Media panel lives in the playground; embeds play the table
  and take `setMedia` from the host page but do not author.
