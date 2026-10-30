# Help & troubleshooting

Short answers for when a link, an upload or a live tour does not do what
you expected. Start with the section that matches what you see.

## A link will not open

**On a phone.** Tap the link. Most links from WhatsApp, Instagram,
Facebook and other apps open inside that app's own browser, and the scene
works there too. If the page says 3D is not supported in this app, tap
**Open in your browser** and it opens in Safari or Chrome instead.

- If the scene asks you to tap to enter, tap it: that tap is what lets the
  phone go full screen and play sound.
- On an iPhone or iPad that says *Update your iPhone or iPad to iOS 17 or
  later*, the device is too old to show 3D. Update it in Settings ▸
  General ▸ Software Update, or open the link on another device.
- Low battery mode and a hot phone make scenes slower, not broken. Give it
  a few seconds.

**On a laptop or desktop.** Use a current Chrome, Edge, Safari or Firefox.
If the page says the browser is out of date, update it and open the link
again. Work computers sometimes switch 3D graphics off in the browser; if
the scene never appears on one computer but works on another, ask your IT
team whether graphics acceleration is allowed.

**The page says the scene is private.** Its owner has limited who can
open it. Ask them for a personal link (see [Privacy of links](#privacy-of-links)).

**The page says the scene is still being prepared.** Keep the page open;
it opens the scene by itself when it is ready.

**The page says the scene has expired or cannot be loaded.** Check the
link is complete (copy it again, all of it). Scenes uploaded without an
account are kept on a best-effort basis and can be cleared to make room;
scenes saved to an account are kept until their owner deletes them. Ask
whoever sent the link for a fresh one.

## The browser says graphics were stopped

After a long session, many open tabs or a large upload, a browser can stop
its graphics for every page at once. You will see *Your browser's
graphics have stopped* or *Graphics stopped in this browser*.

**Quit the browser completely and open it again**, then reopen the link.
Closing the tab is not enough — the whole browser has to restart. On a
Mac, use Quit (⌘Q); on Windows, close every window of that browser; on a
phone, swipe the browser away in the app switcher. Nothing is lost:
scenes, comments and settings are saved on our side.

If it happens again straight away, restart the computer or phone, and
check that the browser and the operating system are up to date.

## Slow networks

A scene starts with a picture and gets sharper as the rest arrives, so on
a slow connection you see something early and the detail fills in over
the next seconds. You do not need to wait for everything before looking
around.

- Move closer to the Wi-Fi router, or switch from Wi-Fi to mobile data (or
  back) if one of them is weak.
- Stay on the page: the parts already downloaded are kept, and opening the
  same scene again later is faster.
- On a very slow line, larger scenes take longer to reach full detail.
  Nothing is wrong with the scene if it is still getting sharper.

## Uploads that fail

When an upload or a build fails, the screen tells you what happened and
what to do next. Find the message here for the plain fix. Each message
also has a short code, which is what plug-ins and the API report
(`errorInfo.code`), so the code column helps if you are reading a log.

To start again: drop the file onto the upload screen or choose it, then
**Publish**. A file that failed for a reason on our side can usually be
sent again unchanged.

### Something about the file

| What you see | Code | What to do |
|---|---|---|
| This file is over the upload limit | `file_too_large` | Make the file smaller: export textures at 2K (2048 px) and turn on compression in your exporter. The limit is shown on the upload screen. |
| This file is empty | `empty_file` | Export the model again and check it has a size before you upload it. |
| We can't read this file type | `unsupported_format` | Export as GLB (or FBX or OBJ). See [What you can upload](guides/what-you-can-upload.md) for every file type we read. |
| This is already a compiled Verse scene | `already_compiled` | This file is the result of an earlier upload. Upload the original model, or just open the scene's link. |
| This is an old glTF 1.0 file | `gltf_version` | Export again as glTF 2.0 — every current 3D tool can. |
| This model points at files that weren't uploaded | `gltf_external_files` | Export one self-contained file: choose "glTF Binary (.glb)", which packs the textures inside. |
| This file looks damaged or incomplete | `corrupt_file` | The file was cut off or not fully saved. Export it again and upload the fresh copy. |
| There is no 3D geometry in this file | `no_meshes` | Make sure your objects are visible and selected when you export. |
| This model has lines or points we can't build | `unsupported_geometry` | Delete loose lines and points, or convert them to solid objects, and export again. |
| This file uses a compression we don't support yet | `unsupported_feature` | Export again without that compression. Draco and meshopt compression both work. |
| One of the textures can't be read | `bad_texture` | Save the textures as PNG or JPEG and export again. |
| This capture isn't a format we can read | `splat_invalid` | Upload the capture app's .ply or .splat export. An ordinary mesh should be exported as GLB. |
| This point cloud isn't a format we can read | `cloud_invalid` | Upload .ply, .las, .laz or .e57. A mesh should be exported as GLB. |
| This file isn't an IFC or USD we can read | `bim_invalid` | Export IFC2x3 or IFC4 from your BIM tool, or a single-file USD/USDZ. |
| This FBX or OBJ file isn't one we can read | `model_invalid` | Export FBX 2014–2020 or OBJ + MTL, and zip it together with its texture folder. |
| This point cloud has too many points | `cloud_too_many` | Thin the scan out in your scanning software and upload again. |
| This capture has too many splats | `splat_too_many` | Crop or reduce the capture in your splat editor and upload again. |
| This zip doesn't hold a model we can read | `zip_invalid` | Zip the model file itself — a .gltf with its .bin and textures, a .glb, or an .fbx / .obj with its .mtl and texture folder — and upload the .zip. A single .glb also uploads on its own. |
| This video is too short to build a space from | `capture_too_short` | Film for 20–60 seconds: walk slowly around the room holding the phone upright at chest height, turning to see every wall. |
| We need more photos of the room | `capture_too_few_photos` | Take 30–150 photos while walking around the room, each one overlapping the last by about half, and zip them together. Or send a 30-second video instead. |
| The video is too dark | `capture_too_dark` | Turn the lights on, open the curtains, and film again — 20–40 seconds, walking slowly around the room. |
| The video is too blurry | `capture_too_blurry` | Film again more slowly, in good light, and avoid quick turns. Walking a step, pausing, then turning works well. |
| We couldn't work out where the camera was | `capture_no_poses` | Film one room in one continuous shot: move slowly, keep about 2 metres from what you film, and let each view overlap the last. Don't edit or trim the video. |
| We couldn't find the floor | `capture_no_floor` | Film again holding the phone upright at chest height, tilted slightly down so the floor is in view. |
| Not enough of the room came out | `capture_empty` | Film the room again in one slow, steady walk around it, with the lights on. |
| We can't play this video | `capture_unreadable` | Send the video straight from your phone's camera app (MP4 or MOV), without editing apps in between. |
| These photos are in HEIC format | `capture_heic` | On the iPhone: Settings → Camera → Formats → Most Compatible, then take the photos again — or send a video of the room instead. |
| Room capture isn't available on this server yet | `capture_unavailable` | Try again later, or send a finished 3D file (GLB, a splat .ply) instead. |
| Building your space didn't finish | `capture_failed` | Send it again in a few minutes. If it keeps happening, we'll look into it. |

### The scene is too big to build

| What you see | Code | What to do |
|---|---|---|
| This scene needs more memory than our build server has | `out_of_memory` | Use fewer or smaller textures (2K), or split the scene into parts. Repeated objects like trees and chairs build lighter when exported as copies of one object. |
| This scene is beyond what one streamed scene can hold | `format_limit` | Split the scene into parts and upload them separately. |
| This scene took too long to build | `compile_timeout` | Simplify the scene — fewer or smaller textures, fewer triangles — or split it into parts. |
| Still over your plan's limit after preparing | `prepared_too_large` | We already compressed the textures and meshes and the scene is still bigger than your plan takes. Upgrade your plan, choose the harder compression when offered, or export with fewer or smaller textures. |
| The built scene didn't pass our checks | `output_invalid` | Splitting the scene into smaller parts usually gets it through. If not, write to hello@ctruh.com. |

### Limits on how often you upload

| What you see | Code | What to do |
|---|---|---|
| You've reached the upload limit for now | `rate_limited` | Wait a little and try again, or sign in for a higher limit. |
| Today's upload quota is used up | `quota_exceeded` | The allowance resets at midnight. Write to hello@ctruh.com if you need more. |
| This server needs an API key | `auth_required` | Add your key in the plug-in's settings, or ask whoever runs the server for one. |

### The connection dropped

| What you see | Code | What to do |
|---|---|---|
| The upload was interrupted | `upload_interrupted` | Check your connection and upload again. |
| The upload didn't finish | `upload_incomplete` | Upload again. |
| This upload session expired | `upload_expired` | The upload sat idle too long. Upload again. |
| We lost contact with the server | `network` | Check your connection. A build that had already started may still finish — try again in a minute. |
| We couldn't download the file from that link | `url_fetch_failed` | Use a direct download link and check it opens in a private browser window. |
| That link can't be fetched | `url_blocked` | The link must be a public web address. Upload the file itself instead. |
| The upload request wasn't valid | `bad_request` | Try again from the upload screen. Developers: check the request against the [API reference](api.md). |
| We can't find this build | `unknown_job` | Upload records expire after a while. If you have the scene's link, it still works; otherwise upload again. |

### Something on our side

Nothing is wrong with your file. Wait a few minutes and upload it again;
the team is alerted automatically.

| What you see | Code |
|---|---|
| Our build server is out of space right now | `storage_full` |
| The build queue is full | `server_busy` |
| Our server didn't answer | `server_unreachable` |
| We couldn't convert this file | `convert_failed` |
| The build stopped making progress | `compile_stalled` |
| The build was interrupted | `compile_interrupted` |
| Our server restarted during your build | `server_restart` |
| Our build service is unavailable | `compiler_unavailable` |
| We couldn't save the built scene | `storage_write_failed` |
| Something went wrong on our side | `internal` |

*The scene is live but unsigned* (`signature_failed`) needs nothing from
you: the scene opens and works normally.

If the same file fails twice for a reason on our side, write to
hello@ctruh.com with the file name and the message you saw.

## Live tours and voice on mobile data

A [live tour](guides/tour-together.md) works on mobile data: guests follow
the host, and a phone that drops from Wi-Fi to 4G rejoins on its own.

Voice is harder on mobile data. Voices go directly from one person's
phone to another's, and some mobile networks and office firewalls do not
allow that. When two people cannot hear each other, the tour panel says
so; the rest of the tour keeps working.

- Put one of the two people on Wi-Fi, or on a phone hotspot.
- If voice will not connect at all, keep touring and talk on a phone call
  instead.
- Allow the microphone when the browser asks. If you said no by mistake,
  allow it again in the browser's site settings and rejoin voice.
- Up to six people can talk at once; everyone else can still listen to the
  tour and follow along.

## Privacy of links

- **A share link is like a key.** Anyone who has it can open the scene.
  Scenes are not listed or searchable anywhere, but a forwarded link
  works for whoever receives it.
- **For a scene only certain people should see**, make it private and give
  each person their own link; you can cut one person off later without
  affecting the others. See [Share privately](guides/share-privately.md).
- **A live tour link** opens that tour's room for a day. Send it only to
  the people you want in the tour.
- **Nothing in a live tour is recorded.** Voice goes between the people in
  the tour, not through our server. Names typed into a tour are used for
  that session only.
- **Viewing statistics** that an owner sees count visits; they never
  include visitors' names or addresses.
- **Link previews** in chat apps show the scene's title and picture, so
  pick a title you are happy for recipients to see.

## Signing in

Verse signs you in with a six-digit code by email or WhatsApp ([how it works](guides/sign-in.md)).

- **No code arrived by email:** check spam, and that the address is spelled right. Ask again after 20 seconds; there is a short limit on how many codes one address can request an hour.
- **No code on WhatsApp:** check the number and country, and that WhatsApp is on that phone. Use email instead.
- **"That code has expired" or "too many tries":** codes last 10 minutes and five tries. Ask for a new one.
- **Signed in on the wrong device:** Account → Sign-in & security → Sign out everywhere.

## Still stuck?

Ask [Ask Verse, the site assistant](guides/ask-verse.md), or write to
hello@ctruh.com with the link, the device and browser you used, and what
you saw.
