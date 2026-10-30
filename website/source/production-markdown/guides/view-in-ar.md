# See it in your room — View in AR on a phone

*A product-scale scene (a chair, a lamp, a watch, a chess set) can be placed
on a real table from its share link. Nothing to install: the scene's own
page shows **View in AR** on phones that can do it.*

## What the visitor gets

| Phone | What happens on **View in AR** |
| --- | --- |
| **Android, Chrome** (and other WebXR-capable browsers) | The page opens a WebXR AR session. A white ring follows the surfaces the camera finds; **tap** places the object on it, **one finger** turns it, **pinch** resizes it (the readout shows the factor), **Reset** picks it up again, **Exit AR** returns to the page. The object is the same streamed scene the page was showing — it keeps streaming detail while you look at it, and the room's light level nudges its exposure. |
| **iPhone / iPad, Safari** | The control is Apple's AR Quick Look link: Safari opens the scene's `.usdz` in AR with its own placement, scale and share sheet. |
| Desktop, or a phone without AR | No control is shown. |

The control appears only for **product-scale** scenes: the compile-time
staging says `kind: "object"`, or — for open / pre-`kind` scenes — the
scene is at most 6 m across. Interiors are walked through (and viewed in a
headset), never placed on a table.

## What the server builds

When a scene compiles, the ingest route also writes **`ingest/<id>.usdz`**
— the iOS AR Quick Look package — from the prepared GLB, right before the
source file is deleted. It is served exactly like the scene's other
artifacts (`model/vnd.usdz+zip`, immutable, same visibility: a private
scene's package needs the owner's cookie or the share token; it follows the
scene's version with `?v=`), and the finished job record says so:

```json
{ "status": "done", "vpkUrl": "…/ingest/chair-1a2b3c4d5e6f.vpk",
  "arUrl":  "https://HOST/ingest/chair-1a2b3c4d5e6f.usdz",
  "ar":     { "bytes": 13122418, "triangles": 76920, "textures": 9, "resized": 0, "seconds": 0.05 } }
```

or, when there is none, why: `"ar": { "skipped": "an interior is walked
through, not placed in a room" }`, `"… over the 150 MB AR cap"`, `"…
over the 5 M AR cap"`.

**Caps** (`web/playground/usdz.mjs`, `USDZ_LIMITS`): a prepared GLB of at
most **150 MB** and **5 M triangles**; PNG textures wider than **2048 px**
are downsampled in the package (JPEGs stay as encoded — `verse-prepare`
already caps them at 4096 on ingest). The three bundled demos convert in
under 0.1 s each (chess set 76.9 k tris → 12.5 MB; marble bust 17.5 k tris
→ 6.5 MB; antique camera 20 k tris → 18.7 MB); the package is text USDA
plus the images, so it is larger than the `.vpk`. `VERSE_AR=0` turns the
packaging off on a server.

The converter is pure Node — no native dependency, nothing to install on
the server — and the packages pass Apple's own validator
(`usdchecker --arkit`, which macOS ships). What it carries: every mesh
instance with its world transform, vertex normals and `st` texcoords,
`UsdPreviewSurface` materials with base colour, metallic-roughness, normal,
occlusion and emissive textures, alpha blend / mask, double-sided. What it
leaves out (honest list): animations and skins (bind pose only),
`KHR_texture_transform`, vertex colours, sparse accessors, KTX2 textures
(factors only — the compact atlas tier is not an image Quick Look reads).

## For developers

- **API:** `arUrl` / `ar` on the finished job record
  ([api.md § GET /v1/ingest/<job>](../api.md#get-v1-ingest-job)); the file
  itself at `GET /ingest/<id>.usdz`.
- **SDK:** `verse.scenes.arUrl(id, { share?, version? })` builds the link —
  put it in `<a rel="ar" href="…"><img src="poster.png"></a>` on your own
  page and Safari opens it in AR ([sdk.md](../sdk.md#scenes-arurl-id-share-version-get-ingest-id-usdz)).
- **Embed:** the viewer shows its own **View in AR** control inside the
  frame; the `stage` event's `ar` field tells your page which path the
  device has (`"webxr"`, `"quicklook"` or `null`), `viewer.enterAR()`
  starts it and `ar` events report what happened
  ([embed-sdk.md](../embed-sdk.md#enterar)). WebXR needs a tap *inside* the
  frame: a programmatic `enterAR()` on Android may report `state:
  "blocked"`; the in-frame button always works.
- **Links:** nothing to add — the share link shows the control on its own.

## How the WebXR path renders (and its honest limits)

The session reuses the headset plumbing (`web/playground/xr.js`): the
engine's mono loop is suspended, every XR frame's camera pose crosses to
the render worker as an `xr-frame` (the same pose for both "eyes" — the
stereo path is the engine's one external-camera path), and a WebGL2
presenter on the main thread samples the left half of the engine canvas
into the `XRWebGLLayer`. The camera feed shows through where the engine
painted its backdrop: the session sets the solid backdrop (`?bg=`'s lane)
to a chroma key (`#00ff00`, pure green) and the presenter keys it to alpha 0. That is
the v1 of a transparent clear — exact on the flat backdrop, with a
narrow halo possible on anti-aliased silhouettes against it; a true alpha
render target is the follow-up (backlog). Placement is a model matrix
folded into the view matrix (the object's base centre on the hit pose, the
turn and the pinch scale), so the engine streams and culls exactly as it
does on the page. Light estimation (`XRLightProbe`'s primary intensity)
nudges the engine's exposure by at most ±1.5 EV, smoothed.

Offered on browsers with WebGPU only — the stereo path renders the session;
the WebGL2 build shows no WebXR control (iOS Safari uses Quick Look on
every device). Temporal mode (`?temporal=`) is refused like VR.

## What is proven, and what needs a phone

`web/test/fix-verify-ar.mjs` (ports 8820–8829) proves, headlessly: the
package is built through the real ingest route, is a valid USDZ (stored
entries, 64-byte alignment, CRCs, the USDA first), references every
material and texture, is under the cap, passes `usdchecker --arkit`; an
interior gets none; the control is an `<a rel="ar">` with its `<img>` on an
emulated iPhone and absent on desktop; with `navigator.xr` stubbed, the
WebXR button appears, `requestSession` asks for `immersive-ar` with
`hit-test` required and `dom-overlay` + `light-estimation` optional, the
renderer switches to the AR clear mode (suspend → AR-size resize → chroma
key backdrop), stubbed frames produce `xr-frame` poses, a tap places, a
pinch scales, exit restores everything; the embed's `stage.ar` and
`enterAR()`.

**Only a phone can prove** that ARCore finds the plane and the keyed frame
composites cleanly over the camera feed, that Safari hands the link to AR
Quick Look and places the object at true scale, and what real-room light
estimates look like. Test plan for the first device pass: open
`/view?vpk=ingest/demo-chess-set.vpk` on an Android phone in Chrome → View
in AR → place on a table (the board should be 55 cm across); on an iPhone
→ View in AR → Quick Look opens; both paths on a private scene with
`?share=`.
