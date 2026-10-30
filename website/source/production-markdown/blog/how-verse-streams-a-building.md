# How Verse streams a 3-million-triangle building into your browser in seconds

Open a link, and a whole apartment appears in your browser a few seconds
later. No app, no download, no "please wait
while we load hundreds of megabytes". That is what Verse Engine does, and this post
explains how — in plain language, with pictures, for anyone who has ever
waited for a 3D file to open.

## The problem: 3D files are enormous, and browsers are not built for them

A real building, scanned or modelled properly, is big. The flagship
interior in our demos has about **3 million triangles** and hundreds of
photo-real textures. A phone scan of a single room can be ten times that.
On disk such a scene is hundreds of megabytes to a few gigabytes.

The usual ways to show it all have the same flaw:
**someone has to download the whole thing before they see anything**.

- A video is small, but it is not the building — you cannot look where the
  camera did not go.
- A viewer app can handle the file, but now your client has to install
  software, and their phone probably cannot hold the scene in memory anyway.
- A web page can embed a 3D model, but web 3D expects *small* models. Drop
  a scanned building into it and the page freezes, then crashes.

```svg
<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three ways to share a building, each with a wait">
  <g font-size="13" fill="currentColor">
    <rect x="12" y="20" width="210" height="150" rx="12" fill="none" stroke="currentColor" stroke-opacity=".25"/>
    <text x="117" y="48" text-anchor="middle" font-weight="600">Video</text>
    <text x="117" y="78" text-anchor="middle" class="dim" fill="currentColor" opacity=".7">Small, but it is a</text>
    <text x="117" y="96" text-anchor="middle" opacity=".7">recording, not the place.</text>
    <text x="117" y="140" text-anchor="middle" opacity=".55" font-size="12">Look where the camera went.</text>

    <rect x="255" y="20" width="210" height="150" rx="12" fill="none" stroke="currentColor" stroke-opacity=".25"/>
    <text x="360" y="48" text-anchor="middle" font-weight="600">Viewer app</text>
    <text x="360" y="78" text-anchor="middle" opacity=".7">Install it. Download the</text>
    <text x="360" y="96" text-anchor="middle" opacity=".7">whole multi-hundred-MB file first.</text>
    <text x="360" y="140" text-anchor="middle" opacity=".55" font-size="12">Minutes of waiting, if it fits.</text>

    <rect x="498" y="20" width="210" height="150" rx="12" fill="none" stroke="currentColor" stroke-opacity=".25"/>
    <text x="603" y="48" text-anchor="middle" font-weight="600">Ordinary web 3D</text>
    <text x="603" y="78" text-anchor="middle" opacity=".7">Loads the file whole, then</text>
    <text x="603" y="96" text-anchor="middle" opacity=".7">the tab runs out of memory.</text>
    <text x="603" y="140" text-anchor="middle" opacity=".55" font-size="12">Fine for a chair. Not for a house.</text>
  </g>
</svg>
```

The wait is not a bandwidth problem that faster internet will fix. Even on
a fast connection, a phone cannot hold a building's worth of geometry and
textures in memory at once. The whole-file approach is a dead end.

## The idea: compile once, then send only what you look at

Verse borrows the trick that made streaming video possible. A film is not
sent to you as one file; it is prepared once into chunks of different
quality, and your player fetches the next few seconds at the quality your
connection can take. Verse does the same for *space* instead of *time*.

**Step 1 — compile.** When you upload a model, Verse does not shrink it.
It compiles it, once, into a format built for streaming. The scene is cut
into thousands of small pieces, and each piece is prepared at several
levels of detail — from a rough version that costs almost nothing to the
original, full-detail version. Textures are converted into the compact form
graphics chips read directly, and sorted by how much of the scene they
cover. The result is a single compiled file, cryptographically signed so
that a viewer can prove it has not been tampered with.

**Step 2 — stream what the camera sees.** When someone opens the link,
the viewer first fetches a few megabytes: the "table of contents" and the
roughest level of every piece. That is enough to draw the whole building
as a soft clay model, in the right colours, within a few seconds. Then,
every frame, the viewer works out which pieces are in front of the
camera, how big they appear on *this* screen, and asks the server for
exactly those pieces at exactly the detail that would look sharp — nothing
behind you, nothing too far away to matter. As you move, it fetches more
and lets go of what you left behind.

```svg
<svg viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Compile once on the server, then stream only the visible pieces to each viewer">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-size="13" fill="currentColor">
    <!-- heavy file -->
    <rect x="16" y="70" width="150" height="110" rx="12" fill="none" stroke="currentColor" stroke-opacity=".3"/>
    <text x="91" y="100" text-anchor="middle" font-weight="600">Your 3D file</text>
    <text x="91" y="122" text-anchor="middle" opacity=".7">.glb or a scan</text>
    <text x="91" y="142" text-anchor="middle" opacity=".7">hundreds of MB</text>
    <!-- arrow -->
    <line x1="170" y1="125" x2="226" y2="125" stroke="currentColor" stroke-width="1.5" marker-end="url(#arr)"/>
    <text x="198" y="112" text-anchor="middle" font-size="11" opacity=".6">upload</text>
    <!-- compiled -->
    <g class="acc">
      <rect x="232" y="40" width="200" height="170" rx="12" fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-opacity=".6"/>
    </g>
    <text x="332" y="68" text-anchor="middle" font-weight="600">Compiled once</text>
    <g opacity=".9">
      <rect x="252" y="84" width="160" height="14" rx="3" fill="currentColor" fill-opacity=".9"/>
      <rect x="252" y="104" width="160" height="14" rx="3" fill="currentColor" fill-opacity=".55"/>
      <rect x="252" y="124" width="160" height="14" rx="3" fill="currentColor" fill-opacity=".35"/>
      <rect x="252" y="144" width="160" height="14" rx="3" fill="currentColor" fill-opacity=".2"/>
    </g>
    <text x="332" y="178" text-anchor="middle" font-size="11" opacity=".65">rough → full detail, piece by piece</text>
    <text x="332" y="196" text-anchor="middle" font-size="11" opacity=".65">signed · ready in minutes</text>
    <!-- arrows to viewers -->
    <line x1="436" y1="100" x2="518" y2="70" stroke="currentColor" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="436" y1="125" x2="518" y2="125" stroke="currentColor" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="436" y1="150" x2="518" y2="180" stroke="currentColor" stroke-width="1.5" marker-end="url(#arr)"/>
    <text x="477" y="130" text-anchor="middle" font-size="10" opacity=".6" transform="translate(0,-14)">only what each</text>
    <text x="477" y="130" text-anchor="middle" font-size="10" opacity=".6">camera sees</text>
    <!-- viewers -->
    <g class="good">
      <rect x="524" y="48" width="180" height="44" rx="10" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".6"/>
      <rect x="524" y="103" width="180" height="44" rx="10" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".6"/>
      <rect x="524" y="158" width="180" height="44" rx="10" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".6"/>
    </g>
    <text x="614" y="75" text-anchor="middle">Phone · a few MB</text>
    <text x="614" y="130" text-anchor="middle">Laptop · a few MB</text>
    <text x="614" y="185" text-anchor="middle">Tablet · a few MB</text>
  </g>
</svg>
```

Two consequences follow, and they are the whole point:

1. **The size of the scene stops mattering.** A 30-million-triangle scan
   and a single chair cost the viewer about the same per frame, because
   the viewer only ever holds what it is looking at. Our measurements
   table shows both above 100 frames per second on the same laptop.
2. **The first seconds are the good seconds.** Because the roughest level
   of everything arrives first, you see the *whole* space immediately and
   watch it sharpen, rather than staring at a progress bar and then
   getting everything at once.

The viewer also does something else quietly: it never does the heavy
lifting on the page itself. The engine runs in a background thread of the
browser, written in Rust and compiled to WebAssembly, so the page you are
on stays responsive even while the heaviest scene streams in.

## The proof: measured, not eyeballed

It is easy to make a 3D viewer that is fast by making it ugly, or
beautiful by making it slow. Verse is checked against ground truth on
both counts, automatically, and the numbers below come straight from the
test harnesses in the repository, last re-run on 2 October 2026 on an
Apple M5 Pro laptop in Chromium. No phone has been through the harness
yet, so there are no phone numbers here.

| What we measure | Result | Where it comes from |
| --- | --- | --- |
| Frame rate on a 30-million-triangle scan | **over 100 fps** on a laptop (101–118 measured) | `docs/metrics-wall.md` |
| Frame rate on the 3-million-triangle apartment | **120 fps** on the same laptop | `docs/metrics-wall.md` |
| Time to first picture, the apartment | **about 4 s** over the internet from the production server; under 1 s from a server on the same network | `docs/metrics-wall.md` |
| Colour accuracy of baked architectural scenes vs the source bake | mean colour error **ΔE 0.6–2.5** on our apartment scenes (gate: below 6) | `web/test/fidelity.mjs` |
| Colour accuracy of lit scenes vs a Blender reference render | **ΔE 0.5–8.2** on ten of eleven reference views (gate: below 9); one metal-helmet view is at 12 and is open work | `web/test/fidelity-lit.mjs` |
| Each renderer vs its own approved images | **0.000 %** pixel difference on the golden image suite, 4 of 4 | `web/test/golden.mjs` |

A word on that ΔE number: it is a standard measure of how different two
colours look to a human eye. A ΔE of 1 is about the smallest difference a
trained eye can see side by side; a ΔE of 5 is noticeable but still "the
same colour" to most people. A baked interior — where the designer's
lighting is already in the textures — lands under 3, which means what you
see in Verse is what the designer saw in Blender. Scenes lit live by the
engine are compared with a reference *renderer*, a different piece of
software with its own lighting model, and sit higher.

```svg
<svg viewBox="0 0 720 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Measured colour error: baked interiors 0.6 to 2.5, lit scenes 0.5 to 8.2 on passing views, under the gate of 9">
  <g font-size="12" fill="currentColor">
    <text x="16" y="26" font-weight="600" font-size="13">Colour error vs Blender reference (ΔE, lower is better)</text>
    <line x1="40" y1="90" x2="690" y2="90" stroke="currentColor" stroke-opacity=".3"/>
    <g opacity=".6">
      <text x="40" y="112" text-anchor="middle">0</text>
      <text x="203" y="112" text-anchor="middle">3</text>
      <text x="365" y="112" text-anchor="middle">6</text>
      <text x="528" y="112" text-anchor="middle">9</text>
      <text x="690" y="112" text-anchor="middle">12</text>
    </g>
    <g class="good">
      <rect x="67" y="66" width="417" height="22" rx="6" fill="currentColor" fill-opacity=".35"/>
      <rect x="73" y="66" width="102" height="22" rx="6" fill="currentColor" fill-opacity=".9"/>
    </g>
    <text x="276" y="56" text-anchor="middle" font-size="12">Baked apartments 0.6 – 2.5 · lit scenes 0.5 – 8.2</text>
    <g class="acc">
      <line x1="528" y1="52" x2="528" y2="98" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/>
    </g>
    <text x="536" y="60" font-size="11" opacity=".8">release gate: below 9</text>
    <text x="16" y="140" font-size="11" opacity=".6">ΔE 1 ≈ smallest visible difference · ΔE 5 ≈ noticeable, still "the same colour" · source: web/test/fidelity.mjs, fidelity-lit.mjs</text>
  </g>
</svg>
```

## What is new in 2.0

Version 2.0 is the first production release, and most of what this post
describes shipped in it. In everyday terms:

- **A link is the product.** Upload once; share a URL that opens in
  current browsers, on laptops and phones. Make it private and hand out
  per-person access you can revoke later.
- **Clients can comment in the space.** Anyone with the link can click a
  spot and leave a note pinned to that exact position — no account needed.
  You resolve or delete pins from the same link.
- **Video, without a render farm.** One click records a flythrough of the
  scene to an MP4 or WebM in the viewer's own browser. Nothing is uploaded.
- **Embed it anywhere with one line.** A single script tag puts the viewer
  on your own site, with events your page can listen to.
- **Publish from the tools you already use.** Blender has a one-click
  "Publish to Verse" button; Unity and Unreal exporters are in early-access
  beta and not yet verified in the real editors. *(Update, 4.0: the Unity and Unreal plug-ins have since been verified in the real editors — Unity 6000.6.5f1 and Unreal Engine 5.8.3 — and are no longer beta.)*
- **It looks right.** Physically based materials, reflections, HDR output
  on screens that support it, and a dedicated full-resolution path for the
  handful of surfaces in a scene that deserve it.
- **Compiles are faster.** The 2.0.1 update made large-scene compiles
  about 1.8× faster with identical output (the flagship interior went from
  15.9 to 8.8 minutes on our development laptop; on the hosted server it
  takes about 20).

The full list, with the engineering detail, is in the
[changelog](../changelog.md); the human version is in the companion post,
[2.0 release notes for humans](2-0-release-notes-for-humans.md).

## What is next

Three things are at the top of the list.

- **Shorter time-to-sharp for far-away viewers.** Streaming is a chain of
  small requests, so distance to the server matters more than bandwidth. An
  edge cache close to the viewer roughly halves the time until a scene is
  fully sharp; making that the default for every deployment is next.
- **Scans as first-class citizens.** Gaussian-splat captures from a phone
  already stream through the same pipeline; the next step is the same
  walk-through, review and video tooling for them that meshes already have.
- **In-editor publishing everywhere.** The Blender button is verified end
  to end; Unity and Unreal are a smoke test away from the same. *(Update, 4.0: the Unity and Unreal plug-ins have since been verified in the real editors — Unity 6000.6.5f1 and Unreal Engine 5.8.3 — and are no longer beta.)*

If you want to try it yourself, the [getting-started guide](../getting-started.md)
takes about five minutes, and the [live examples](/docs/#/examples) run the
real engine on this very docs site. If you only want the one-sentence
version: *Verse turns a heavy 3D file into a link that opens in seconds,
in the browser — and we measure it to make sure.*
