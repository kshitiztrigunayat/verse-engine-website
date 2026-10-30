# Export a flythrough video

Every streamed scene can become a client-ready MP4 or WebM — recorded from
the live engine, in the viewer's own browser, with nothing uploaded and no
server render farm. Two ways to get one: a button in the playground, or
`exportVideo()` in an embed.

**You need:** a scene that has a tour. Scenes compiled with auto-staging
already do (the server writes a ~30 s loop into `<id>.stage.json`: an orbit
for open-sky scenes, a walkthrough through the largest open rooms for
interiors). A recorded tour (`?tour=`) works too, and in embeds a scene
with no tour at all gets a synthesized orbit of its framing sphere.

## From the playground

1. Open the share link. Once the scene is up, a **Tour** chip appears —
   and beside it, **Export video**.
2. Click it and pick **duration** (defaults to the tour length),
   **resolution** (1080p / 720p / native) and go.
3. The file downloads as `<scene>-tour.mp4` (H.264, where the browser can
   mux MP4: Chrome/Edge 126+, Safari) or `.webm` (VP9 elsewhere). The chip
   is labelled with the container you will actually get.

During capture the engine pins render scale to 1 (no dynamic resolution),
blocks on-demand parking, and runs the render target at the output
resolution; everything restores afterwards, including on cancel.

For scripting and QA the same thing is one call in the page console:

```js
await window.__verseExportVideo({ duration: 10, fps: 30, height: 1080, format: "mp4", download: true });
// resolves the Blob; download:false keeps it in memory
```

## From an embed

The capture runs **inside the engine iframe** (that is where the canvas
lives) and the finished bytes transfer to your page as a `Blob`, so your
page decides: download, upload to your own storage, or preview inline.

```html
<div id="viewer"></div>
<button id="make-video">Export video</button> <button id="cancel" hidden>Cancel</button>
<progress id="bar" max="100" value="0" hidden></progress>
<script src="https://HOST/embed.js"></script>
<script>
  const viewer = Verse.embed(document.getElementById("viewer"), { scene: "docs-demo-718035483f84" });
  const bar = document.getElementById("bar"), cancel = document.getElementById("cancel");
  viewer.on("export-progress", (p) => (bar.value = p.percent));

  document.getElementById("make-video").onclick = async () => {
    bar.hidden = cancel.hidden = false;
    try {
      const r = await viewer.exportVideo({ duration: 10, fps: 30, height: 1080 });
      if (!r.cancelled) {
        // r.blob is yours. Download it…
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(r.blob), download: r.name });
        a.click();
        // …or upload it: fetch("/my/upload", { method: "POST", body: r.blob })
      }
    } catch (e) {
      console.warn("export failed:", e.message);   // "no scene loaded yet", "an export is already running"
    } finally {
      bar.hidden = cancel.hidden = true;
    }
  };
  cancel.onclick = () => viewer.cancelExport();     // the pending promise resolves { cancelled: true }
</script>
```

### Options

| Option | Default | Meaning |
| --- | --- | --- |
| `duration` | tour length | seconds, clamped 1–600 |
| `fps` | `30` | clamped 5–60 |
| `height` | `1080` | output height in px; `0` = the canvas's native height |
| `format` | auto (MP4 where supported) | `"mp4"` or `"webm"` |
| `bitrate` | ~10 Mbps at 1080p, scaled by area | video bits per second |

Resolves `{ blob, mimeType, name, width, height, frames, cancelled }`. One
export runs at a time; `export-progress` events fire per captured frame and
an `export-done` `{ id, size, cancelled, error? }` event summarises the run
for analytics (the bytes ride the promise, not the event).

### Without the SDK

If you talk to the iframe yourself, three messages do the job:
`verse:export-video` `{ id, duration?, fps?, height?, format?, bitrate? }`
down; `verse:event` `{ name: "export-progress", detail: { id, percent,
frame, total } }` up while capturing; finally `verse:export-video-done`
`{ id, bytes (transferred ArrayBuffer), mime, name, width, height, frames,
cancelled }` — or `{ id, error }` on refusal (busy, no scene, recording
unsupported). `verse:export-video-cancel` `{ id }` cancels.

## Getting a better video

- Pick the camera path first. Record your own with the editor's ⏺
  **Record tour** (`&edit=1`), publish it with `POST /v1/tour`, and open the
  scene through the resulting `?tour=` link before exporting.
- 1080p at 30 fps is the sweet spot for listings and review decks; `height:
  0` captures the panel's native resolution when you need 4K from a 4K
  display.
- The export records exactly what the viewer renders, so quality knobs
  apply: see [Tune quality knobs](tune-quality.md) — `?scale=1` is pinned
  for you, `?ssr=1` and `?hdr=0` are worth setting explicitly for a video
  destined for SDR screens.
