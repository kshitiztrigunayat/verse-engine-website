# Browser Support Matrix

*Customer-readable. Which browsers get which experience, decided by
`web/playground/caps.js` at page load and reported in the status line.*

**A scene link opens in any current browser.** Browsers with WebGPU —
Chrome, Edge, Safari 26, Firefox on Windows and macOS — get the full
picture. Everything else that has WebGL2 (older iPhones and iPads, Firefox
on Linux and Android, most in-app browsers) gets a lighter build that
streams the same scene the same way, with walk, tour, review pins,
measuring and video export. It also gets the same studio
lighting, shadows, contact shadow, bloom, ambient occlusion, per-room
reflections, real-time GI and uploaded HDR backgrounds as WebGPU — measured
within mean ΔE76 0.3 of the WebGPU picture on products. Still WebGPU-only:
path-traced stills, screen-space reflections, the
scene-wide mirror probe, temporal upscaling and HDR display output.
Gaussian-splat captures need WebGPU.

Every page load lands in one of four tiers, chosen from what the browser
actually exposes — not from a user-agent guess — and the tier is
telemetered so we know what real traffic gets.

## Tiers

| Tier | Requirements | What renders |
|---|---|---|
| **A** | WebGPU adapter with desktop-class limits, `OffscreenCanvas` | Full pipeline: streamed virtualized geometry (scenes far larger than device memory), clustered lights, SSAO, bloom, temporal super-resolution ("4K mode"), HDR environments, mirror probes, glass, GPU picking, WebXR. |
| **B** | WebGPU adapter with mobile-class limits, `OffscreenCanvas` | Same pipeline with reduced budgets: smaller streaming pool, dynamic resolution scaling, thermal governor steps quality down before the device throttles. |
| **C** | No WebGPU; WebGL2 available | Classic GLB scenes AND streamed scenes. A shared streamed link opens with the same streaming as tier A/B: the level-of-detail cut is selected on the CPU, geometry and textures stream on demand into device-sized pools (phone class: 1K texture slots; desktop class: 2K slots and 4× MSAA), with sun shadows, picking, walk, tour, review and video export. Since 4.0: studio environment lighting, contact shadow, bloom, optional SSAO, 4× MSAA on desktop class, per-room reflection probes (phones at half resolution) and real-time GI; a frame-time governor steps bloom / AO / MSAA / shadow resolution down on a hot phone. No SSR, no ray-traced reflections, no TSR, no path-traced stills, no splats. |
| **–** | Neither | Poster image (if the page supplied one), a one-line explanation, and — only inside an in-app WebView — a "open in your browser" link. |

Two further capabilities shape the experience within a tier:

- **Cross-origin isolation** (`SharedArrayBuffer`): our origin sends the
  COOP/COEP headers, so on our pages the simulation runs in its own worker
  and publishes through a lock-free triple buffer. Where isolation is
  unavailable, the render worker runs a camera-only world — same visuals,
  slightly less input smoothness under load. Partner pages embedding via
  `embed.js` never need these headers: the engine runs in an iframe served
  from our origin.
- **Compressed texture formats**: the decode worker transcodes KTX2/Basis to
  whatever the device supports (BC7 / ASTC / ETC2, else RGBA8). Memory use,
  not visuals, is what changes.

## Browsers

| Browser | WebGPU | Typical tier | Notes |
|---|---|---|---|
| Chrome / Edge 113+ on Windows, macOS, ChromeOS | yes | **A** | Reference platform: our automated suites run in Chromium on macOS, and have run on Windows on Intel Arc and NVIDIA ([below](#verified-on-windows)). |
| Chrome 121+ on Android 12+ | yes (ARM, Qualcomm and Intel GPUs; Imagination GPUs from Chrome 139 on Android 16) | **B**; **C** on Qualcomm Adreno without timestamp queries | Limits and thermals drive the reduced budgets. Qualcomm Adreno phones (e.g. Galaxy S23, Z Flip5) open on WebGPU when the adapter offers `timestamp-query` — the engine then fences every render pass, which on a real Galaxy S23 (Adreno 740, Chrome 149) kept textured scenes at 30 fps with no device loss (7 of 8 runs, October 2026); without it they open on the WebGL2 build. An early device loss still falls back to WebGL2 (below). `?tier=c` / `?tier=a` force either build. |
| Samsung Internet 24+ | yes | **B**; **C** on Qualcomm Adreno without timestamp queries | Follows Chrome on Android. |
| Safari 26 on macOS 26 (Tahoe) | yes | **A/B** | Limits vary by machine. Safari 18 and earlier: tier C. |
| Safari — and every other browser — on iOS / iPadOS 26 | yes | **A/B** (phone budget) | All iOS browsers use Safari's engine, so Chrome on an iPhone behaves the same. Since 19 Oct 2026 iPhones and iPads open on WebGPU with a phone-class memory budget (the early-October crash was tier A's desktop-sized pools, charged by WebKit to the tab); `?tier=c` pins the WebGL2 build, and a device whose WebGPU device dies early falls back to it and is remembered. iOS 17 and 18: tier C. **iOS 16 and earlier** (Safari before 17 cannot draw WebGL on an OffscreenCanvas): the viewer says "Update your iPhone or iPad to iOS 17 or later" instead of loading. |
| Safari on visionOS 26 | yes | untested | Not verified by us on the device; not a supported target in 4.0. |
| Firefox 141+ on Windows; 145+ on Apple-silicon Macs, 147+ on Intel Macs | yes | **A** | Not yet covered by our automated suites. |
| Chrome on Linux | from Chrome 144 on recent Intel GPUs; otherwise behind a flag | **A** or **C** | |
| Firefox on Linux and Android | not yet | **C** | Streams on the WebGL2 build. |
| Older Chrome / Firefox / Safari without WebGPU | no | **C** | Streams on the WebGL2 build (no screen-space reflections, temporal upscaling or path-traced stills). |
| Anything without WebGL2 | no | **–** | Poster + link-out. |

*WebGPU availability as of 2 October 2026, from
[caniuse.com/webgpu](https://caniuse.com/webgpu) and the WebGPU working
group's [implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)
page. The two disagree on Firefox (caniuse lists it as off by default);
the row above follows the working group's page.*

*What we have run ourselves: Chromium on macOS, on every release, with both builds; Chromium on Windows 11 on an Intel Arc and an NVIDIA GPU (October 2026, [below](#verified-on-windows)). Real phones (October 2026, BrowserStack): iPhone 15 on iOS 17 and iOS 26, iPhone 13 on iOS 16.3 (update message, by design), iPad Air 13 on iOS 18, Galaxy M32 (Android 11) — all Safari/Chrome, tier C on Apple devices; Galaxy S23 Chrome (Adreno 740: WebGPU lost its device until the pass-fence fix; with it WebGPU renders, and the WebGL2 build renders too) and Pixel 8 Chrome (Mali-G715: WebGPU renders). Other phone rows follow the browsers' published WebGPU status; no headset has been verified.*

*A WebGPU device that is lost within the first minute of a session (or twice in one session) reloads the page into the WebGL2 build, and that browser's GPU is remembered for two weeks so later visits open on WebGL2 directly.*

### Verified on Windows

One laptop, both of its GPUs: Windows 11 (26200), Intel Core Ultra 7 356H,
headless Chromium 151 (Playwright's full build), WebGPU on Dawn / D3D12 and
WebGL2 on ANGLE / D3D11. The adapter was confirmed per run from
`navigator.gpu.requestAdapter().info` and WebGL's `UNMASKED_RENDERER`
(`web/test/tools/gpu-probe.mjs`); Chrome 155 and Edge 155 were confirmed
to create a WebGPU device on both GPUs, but the gates ran on Chromium.

| Platform | Tier A (WebGPU / D3D12) | Tier C (WebGL2 / ANGLE D3D11) | Verified (16 October 2026) |
|---|---|---|---|
| Windows 11 + Intel Arc (Intel Graphics 0xB0A0, Xe3-LPG — the Core Ultra 7 356H's integrated GPU) | ✓ | ✓ | materials: 88 / 89 — the one miss, IridescentDishWithOlives tier C desktop (ΔE 6.04 vs 6), is known, fails on macOS too, fixed in 4.0 |
| Windows 11 + NVIDIA (GeForce RTX 5060 Laptop GPU, Blackwell) | ✓ | ✓ | materials: 88 / 89 — the one miss, IridescentDishWithOlives tier C desktop (ΔE 6.05 vs 6), is known, fails on macOS too, fixed in 4.0 |

Compressed textures on both: BC7 (`texture-compression-bc`; Windows GPUs
expose no ASTC / ETC2, so those transcode legs are skipped, not failed).
Not covered on this machine: the private test scenes (a shoe scan, a
villa, an archviz flat) and the old structure compile (private fixtures — every leg that needs
them reported skipped), Firefox, and a visible (non-headless) window.
Known open item: in 1 of 7 appshell runs on the Intel GPU, Chrome lost the
GPU for the rest of the browser session ("Graphics stopped in this
browser"); not reproduced in the 4 runs since (3 with GPU-process
logging), and no driver reset in the Windows event log.

*Tier is decided per session at load; the same browser can land in A or B
depending on the adapter's reported limits.*

## In-app WebViews

Most direct-to-consumer links open inside an app, not a browser. These
WebViews frequently lack WebGPU, sometimes lack `SharedArrayBuffer`, and
throttle aggressively. The engine detects them and reports the app name in
telemetry (`inApp`), so a downgrade is visible rather than silent.

| WebView | Detected as | What usually happens |
|---|---|---|
| Instagram | `instagram` | Tier C on most devices (the WebGL2 build streams the scene); poster + "open in your browser" when WebGL2 is missing. |
| Facebook / Messenger | `facebook` | Same as Instagram. |
| WhatsApp | `whatsapp` | Same. |
| TikTok | `tiktok` | Same; the most aggressive throttling seen. |
| Pinterest, Snapchat, LINE, X/Twitter | `pinterest`, `snapchat`, `line`, `twitter` | Same. |

Only inside a WebView does the fallback offer "open in your browser" — that
is the one situation where it is genuinely the fix, and the engine avoids
nagging real browsers with it.

## What every tier gets

| Capability | A | B | C | – |
|---|---|---|---|---|
| Classic GLB scenes (`?model=`) | ✓ | ✓ | ✓ | poster |
| Streamed scenes (`?vpk=`, every streamed upload's link) | ✓ | ✓ | ✓ (CPU-selected detail, no post chain) | poster |
| Fidelity-mode products (`/view?glb=…fidelity.glb`, [guide](guides/fidelity-mode.md)) | ✓ | ✓ | ✓ (same prefiltered studio environment as WebGPU) | — |
| Walk mode + collision | ✓ | ✓ | ✓ | — |
| Upload | ✓ (streamed, with a link) | ✓ (streamed, with a link) | ✓ (streamed, with a link) | — |
| Temporal super-resolution ("4K mode") | ✓ | ✓ | — | — |
| SSAO, bloom | ✓ | ✓ | ✓ (stepped down by the frame governor on a hot phone) | — |
| HDR environment (`.hdr` drop, uploaded HDR backgrounds) | ✓ | ✓ | ✓ | — |
| Per-room reflection probes  (default, `?refl=0` off) | ✓ | ✓ | ✓ (phones at half resolution) | — |
| Ray-traced reflections (held back; `?rt=1` is ignored) | — | — | — | — |
| Real-time GI for unbaked interiors (`?gi=0` off) | ✓ | ✓ | ✓ | — |
| Virtual texturing for 8K / 16K textures (`?vt=0` off) | ✓ | ✓ | ✓ | — |
| Scene-wide mirror probe, screen-space reflections | ✓ | ✓ | — | — |
| Streamed glass, punctual lights | ✓ | ✓ | — | — |
| GPU picking / SDK `pick()` | ✓ | ✓ | ✓ on streamed scenes; classic scenes reject after 5 s | — |
| WebXR (stereo + controllers: thumbstick walk, snap turn, trigger/pinch teleport) — experimental, not yet verified on a headset | ✓ | ✓ | — | — |
| glTF node animation clips (play/pause/seek) | ✓ | ✓ | ✓ | — |
| Skinned meshes + morph targets (GPU) | ✓ | ✓ | bind pose | — |
| Depth of field, order-independent transparency | ✓ | ✓ | — | — |
| GPU particles (fire/smoke/fountain/dust) | ✓ | ✓ | — | — |
| Dynamic props (rigid balls/boxes) | ✓ | ✓ | ✓ | — |
| Sun control, material variants | ✓ | ✓ | ✓ | — |
| Measure tool (picking) | ✓ | ✓ | ✓ on streamed scenes | — |
| Floor-plan minimap | ✓ | ✓ | ✓ | — |
| Gaussian splats (.splat / 3DGS .ply) | ✓ | ✓ | — | — |
| Streamed splats (.vsp chunked LOD) | ✓ | ✓ | — | — |
| Spatial audio (Web Audio HRTF, follows the camera) | ✓ | ✓ | ✓ | — |
| Telemetry, service-worker warm start | ✓ | ✓ | ✓ | ✓ |

| Exact sRGB output encode, ACES / Neutral / AgX curves | ✓ | ✓ | ✓ | — |
| Display-P3 canvas on a wide-gamut display (`?gamut=auto\|p3\|srgb`) | ✓ (`colorSpace`) | ✓ | ✓ (`drawingBufferColorSpace`, Chrome 104+ / Safari 15.2+) | — |
| HDR canvas on an HDR display (`?hdr=auto\|1\|0`: rgba16float + extended tone mapping; P3 + HDR = extended Display-P3) | ✓ | ✓ | SDR fallback | — |

Colour output is decided per session and reported in `window.__verseColor`
(`{ p3, p3Display, requested, hdr }`). Auto = the page's own media
queries: `(color-gamut: p3)` → Display-P3 canvas, `(dynamic-range: high)` →
HDR canvas (tier A only). A browser that ignores the request keeps the
sRGB canvas and the shaders encode for what it actually got, so a wrong
guess can never over-saturate. Golden captures pin sRGB.

Engine download (brotli): 522 KB for the WebGPU build, 449 KB for the WebGL2 build (raw WebGL2, no wgpu, build-time-translated GLSL); the JPEG / WebP / HDR codec module is fetched only when the engine has to decode one of those.

## Reasons in the status line

When a session lands below tier A, `caps.reasons` lists why — these are the
strings you will see in telemetry and in the fallback panel:

`no-offscreencanvas` · `not-cross-origin-isolated` · `no-navigator-gpu` ·
`no-webgpu-adapter` · `webgpu-request-failed` · `no-webgl2` ·
`ios-webgl-default` (iPhone / iPad, only while caps.js `IOS_WEBGPU_DEFAULT` is off) · `android-adreno-no-timestamps`
(an Adreno phone without timestamp queries) · `webgpu-remembered-bad` (this
browser's GPU lost its WebGPU device recently).

## Testing

- `web/test/qa-suite.mjs` includes tier-C forcing (`?tier=c`); splats are
  refused there with a message.
- `web/test/fix-verify-tierc-stream.mjs` opens each streamed scene on both
  builds with the same camera and compares the pictures.
- `web/test/fix-verify-claims.mjs` keeps this page, the product page and
  the upload screen in step with the engine: what this page says a browser
  without WebGPU gets must match `STREAMED_SCENES_NEED_WEBGPU` in
  `web/playground/caps.js`, which must match the WebGL2 renderer.
- `web/test/golden.mjs` renders both builds headlessly and compares to
  committed goldens per platform (`GOLDEN_PLATFORM=darwin` diffs another
  machine against the Mac set; `GOLDEN_NO_APPROVE=1` fails on a missing
  golden instead of approving the current render).
- On a multi-GPU machine, `node --import ./tools/gpu-select.mjs <gate>` (run from `web/test`) with
  `VERSE_GPU=nvidia|intel` (high-performance / low-power) pins every gate's
  Chromium to one adapter; on Windows it also uses the full Chromium build,
  because the default `chrome-headless-shell` cannot create a WebGPU device
  there (no DXC DLLs).
- Physical-device rows on the metrics wall (`docs/metrics-wall.md`) are
  emulated until the launch hardware is in hand — treat the mobile tiers
  above as verified in emulation, not on-device.
