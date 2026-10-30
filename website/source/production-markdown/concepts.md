# Concepts

Five ideas explain everything else in these docs: scenes are **compiled**,
compiled scenes **stream**, the viewer picks a **tier**, every scene is
**signed**, and a scene is addressed by one **id** that works everywhere.
This page is the mental model; the how-to guides are the hands.

## Compile, don't convert

A builder's model or a photogrammetry scan is far too heavy to send to a
browser whole. Verse does not shrink it — it **compiles** it once,
server-side, into a container built for streaming (`.vpk` for meshes,
`.vsp` for Gaussian-splat captures):

- The mesh is cut into thousands of small clusters, each simplified into a
  hierarchy of detail levels (coarse at the top, source detail at the
  bottom) with seams locked so neighbours never crack.
- Textures are encoded for the GPU (BC7 / ASTC-class via UASTC) and sorted
  by importance: the materials covering the most world surface get full
  streamed textures — up to 4096² for a "hero" tier, and base
  colour above 4096 (8K, 16K) as virtual-texture pages streamed at the
  resolution each pixel needs — and the long tail lives on a shared 1024²
  preview atlas.
- A walk-collision grid, a spawn point, an automatic ~30 s tour and a 2D
  floor plan are derived and written beside the file.
- The whole thing is laid out so that **the first bytes are the most useful ones**: a few MB of header and coarse levels open the scene; the
  rest is fetched by byte range only when a camera wants it.

Compile cost is roughly 8 seconds per source MB on the production box
(`estimateS` on the job record): a minute or two for a product, about
twenty minutes for a 3-million-triangle building. Draco, KHR quantization and KTX2 inputs are
normalized on the way in. Uploaded sources are deleted after compile; the
compiled scene is what is kept and served. (The one exception is a model
published in compatibility mode, where the uploaded GLB is the scene.)

## Streaming is a cut through a hierarchy

The viewer never downloads a scene. Every frame, a GPU pass decides which
clusters — at which detail level — would project to roughly one pixel of
error on *this* screen from *this* camera, and the residency loop fetches
exactly those by HTTP `Range` request, evicting what the camera left
behind. Consequences you will notice:

- **Scene size stops mattering.** A 30-million-triangle scan and a chair
  cost the viewer about the same per frame; the metrics wall holds both
  above 100 fps on the same laptop.
- **Latency matters more than bandwidth.** Refinement is a chain of small
  range requests, so a far-away viewer is RTT-bound. That is why an edge
  cache near the viewer (see the cache headers in the [API reference](api.md)) roughly halves
  time-to-sharp, and why private scenes — which never touch a CDN — are
  slower for remote reviewers by design.
- **First seconds are tuned deliberately.** Coarse clusters carry a baked
  flat colour, so the opening frames read as a soft clay model with correct
  colours while textures arrive, instead of shattered glass. The `?vgflat`
  knob exposes it.
- **Streaming is observable.** `progress` events report drawn/total
  clusters; the `?inspector=1` panel shows residency per level; the
  `stats` channel carries everything else.

Gaussian splats stream the same way at the chunk level (`.vsp`: full and
coarse subsets per chunk, chosen by projected size).

## Tiers: what each device gets

The viewer classifies the device once at boot and the whole stack adapts:

| Tier | Backend | Where | What changes |
| --- | --- | --- | --- |
| **A** | WebGPU, desktop-class GPU | laptops, desktops, high-end tablets | everything: SSR, reflection probes, HDR output, 4K hero textures, full post chain |
| **B** | WebGPU, mobile-class GPU | phones, mid tablets | smaller texture pools, lean post chain (no DoF/bloom), no SSR, no hero pool |
| **C** | WebGL2 | in-app browsers, older devices | a separate bundle, held to its own golden images on every release, that renders classic scenes and opens streamed scenes with a CPU-selected cut (compared against tier A per scene by `fix-verify-tierc-stream`); studio lighting, contact shadow, bloom, optional SSAO, per-room reflection probes and real-time GI; no SSR, ray-traced reflections, TSR or path-traced stills; splats need WebGPU |

Dynamic resolution scaling keeps frame time inside the display's budget on
every tier, and on-demand rendering parks the loop when nothing changes
(the default in embeds and on battery). The embed SDK reports the tier in
its `ready` event and a `degraded` event when it had to step down; the
final rung is a poster image with a link out, so an embed never shows a
blank box. The matrix of browsers and WebViews is in
[Browser support](browser-support.md).

## Fidelity: two paths

Verse is measured against ground truth, not eyeballed. (This section is
about how faithfully *streamed* scenes reproduce their source. **Fidelity
mode** — a textured product or scan published as itself, at source
resolution, with no streaming — is a different thing:
[Fidelity mode](guides/fidelity-mode.md).)

- **Baked scenes** (archviz exports whose lighting is already in emissive
  lightmaps) must reproduce the bake **bit-faithfully**: unlit materials
  bypass tone mapping, post effects that would alter a bake are suppressed,
  and lightmaps are never encoded with a banding codec. The harness renders
  the source bake in Blender EEVEE and gates the streamed result at a 64×64
  mean ΔE76 below 6 per view (`web/test/fidelity.mjs`); our apartment
  scenes measure 0.6–2.5.
- **Lit scenes** (plain PBR with live lights) are compared with EEVEE given
  the same scene, sun and environment through the engine's own display
  transform; gate ΔE below 9 (`web/test/fidelity-lit.mjs`). At the last
  audit ten of eleven reference views measured 0.5–8.2; one view of a
  scratched-metal helmet sits at 12 and is open work.

Screen-space reflections, HDR output and the vertex-tangent path are each
gated separately so they can never drift the fidelity numbers; the
[quality knobs](guides/tune-quality.md) let you turn each one on or off per
link.

## Signed, and verified where it is viewed

Every compiled file is signed Ed25519 by the server that compiled it (a
descriptor in the header and a trailer after the directory for `.vpk`; an
80-byte trailer for `.vsp`). The browser fetches the origin's public key
(`GET /v1/pubkey`) and verifies with WebCrypto from the bytes it already
holds, then reports `signed: true | false | "unverified"` on the status
line and in the SDK's `signed` event. The trust anchor is the **page embedding the scene**, not the host serving the bytes — so a CDN, a mirror
or a copied file can never make a tampered scene verify, and a missing
signature never blocks loading. (The container's byte layout is an
in-repo document for the team; it is not published here.)

## One id, four surfaces

A finished compile returns a scene id — the `ingest/<id>.vpk` part of its
share link — and that id is the handle everywhere:

| Surface | How the id is used |
| --- | --- |
| **Share link** | `https://HOST/?vpk=ingest/<id>.vpk` — opens the playground viewer; `&share=<token>` for a private scene; `&tour=`, `&experience=` compose more |
| **Embed** | `<script src="https://HOST/embed.js" data-scene="<id>">` or `Verse.embed(el, { scene: "<id>" })` |
| **API** | `/v1/scenes/<id>/…` (ownership, visibility, share tokens, stats), `/v1/review/<id>` (pinned comments), `GET /v1/ingest/<id>` while the job record lives |
| **Studio** | the scene card at `/studio` — poster, link, embed snippet, analytics, visibility and share links |

Ownership is the one thing layered on top: scenes uploaded anonymously are
retained best-effort under a disk budget; scenes uploaded with (or claimed
by) an account are permanent, can be made private, and roll up analytics.
Accounts are token-only — the token is the credential, like an API key.

## Where the pieces run

```
your page / Blender / Unity / Unreal / curl
        │  HTTPS (plain JSON + raw bytes)
        ▼
 one Node service ── ingest API, signing, share links, review, rooms, telemetry, docs
        │  spawns             │  serves by byte range
   verse-compile          ingest/<id>.vpk  ──►  (optional CDN edge)
   (native Rust)                                      │
                                                      ▼
                                browser: main thread (UI only)
                                  ├─ sim worker  (camera, walk, collision)   ─┐ shared-memory
                                  └─ render worker (Rust→wasm, WebGPU/WebGL2) ─┘ triple buffer
```

The browser's main thread never renders (design law #1): the engine lives
in a render worker, the simulation in another, and they exchange frames
through a lock-free triple buffer in shared memory. That is why the page
stays responsive under the heaviest scene, and why the server must send the
cross-origin-isolation headers the engine iframe carries for you.

## Next

- [Getting started](getting-started.md) — five minutes to a streaming
  scene.
- [Help & troubleshooting](help.md) — when a link, an upload or a live
  tour does not behave.
- [Glossary](glossary.md) — the words (cluster, DAG, tier, VG, residency…).
