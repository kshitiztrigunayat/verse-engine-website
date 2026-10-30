# Verse Engine 2.0 — release notes for humans

Verse Engine 2.0 is out, and the [changelog](../changelog.md) is long.
This is the short version, written for the people who will *use* Verse
rather than build it: what you can do now, what changed if you were already
using it, and what is still marked "beta".

## In one paragraph

Verse turns a heavy 3D model or scan into a link. Open the link and the
space streams in — first a soft version of the whole thing in a few
seconds, then detail wherever you look — in current browsers, on laptops
and phones, with no app to install. 2.0 is the first
release we call production: it is deployed, and its speed and colour
accuracy are measured by automated tests.

## What you can do now

**Share a space with a link.** Upload a `.glb` (or a scan) in the
playground, wait for the compile — a minute or two for a product, about
twenty minutes for a building — and copy the share link. Anyone can open
it in a current browser. The file is
digitally signed, and the viewer shows "signed" once it has verified it.

**Keep it private.** Sign in (the account is a token, like an API key),
flip a scene to *private*, and mint a share token per person. Each token
is a separate key you can revoke later without touching the others.
Strangers see nothing — not even that the scene exists.

**Collect comments inside the space.** Every share link doubles as a
review round. Your client clicks any spot and types a note; it is pinned to
that exact 3D position and everyone who opens the link sees the numbered
pin. You resolve or delete pins as the owner. No client account needed.

**Export a video.** One click records a flythrough — the automatic ~30 s
tour the compiler lays out, or one you recorded — to a 1080p MP4 or WebM,
inside the viewer's own browser. Nothing is uploaded.

**Walk through it.** Press *Walk*: real walls block you, stairs work,
the floor-plan minimap shows where you are. Measure a distance in two
clicks. Or tour together live, as avatars, with follow mode.

**Put it on your own website.** One script tag embeds the viewer; your
page needs no special headers or build step, and the embed reports events
(ready, loaded, progress, picks, dwell time) your page can act on.

**Publish from your tools.** Blender has a one-click *Publish to Verse*
panel, verified end to end. Unity and Unreal exporters exist and speak the
same protocol; they are marked beta until their first in-editor runs.
*(Update, 4.0: the Unity and Unreal plug-ins have since been verified in the real editors — Unity 6000.6.5f1 and Unreal Engine 5.8.3 — and are no longer beta.)*

## What changed if you were already using Verse

- The viewer defaults to **on-demand rendering** in embeds: a still scene
  costs essentially no battery. The playground still renders continuously.
- **HDR display output** is on automatically on HDR-capable screens for
  the top device tier. Add `?hdr=0` to any link destined for an SDR screen
  or a video export.
- **Share links never break.** Every URL ever issued (`/?vpk=…`,
  `?experience=`, `?tour=`) keeps serving the app; the bare domain now
  shows the product page, and `/app` is the playground.
- **Compiles are faster** since 2.0.1: about 1.8× on large scenes, with
  byte-identical output. If you run your own server, budget about 8 GB of
  memory for ingest; the two compile phases now genuinely overlap.
- **Errors are honest.** Every error the app itself returns carries an
  `X-Verse-Error: 1` header and a JSON message, so you can always tell an
  app error from a network hiccup.

## What is still beta

- **Unity and Unreal publishing.** Protocol-tested against a live server;
  the first in-editor smoke test is pending. The Blender add-on is the
  reference. *(Update, 4.0: the Unity and Unreal plug-ins have since been verified in the real editors — Unity 6000.6.5f1 and Unreal Engine 5.8.3 — and are no longer beta.)*
- **Gaussian splats** stream, but the walk-through, review and video
  tooling is still mesh-first.
- **The WebGL2 fallback** (older browsers, some in-app browsers) streams
  the same scenes since 2.1, without post effects. Gaussian splats still
  need WebGPU. *(Update, 4.0: the WebGL2 build now gets the studio
  lighting, shadows, bloom, optional ambient occlusion, reflection probes
  and real-time GI too.)*
- **Headsets.** The WebXR mode is experimental and has not yet been
  verified on a physical headset.
- **Materials.** Vertex colours, texture transforms and the
  `KHR_materials_*` extensions (clearcoat, transmission, sheen and
  similar) are not rendered yet.

## Where to read more

- The [changelog](../changelog.md) — every change, newest first; updated
  with each release.
- [How Verse streams a 3-million-triangle building into your browser in seconds](how-verse-streams-a-building.md)
  — the idea behind all of this, explained with diagrams.
- The [getting-started guide](../getting-started.md) — five minutes from a
  file to a link.
