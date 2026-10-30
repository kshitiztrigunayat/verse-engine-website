# Embed the viewer

The whole engine drops into any web page with one script tag. It runs in
an iframe served from the Verse origin — which carries the
cross-origin-isolation headers the engine needs — so **your page needs no header changes**, works inside any CMS block, and degrades on its own:
WebGPU (tiers A/B) → WebGL2 (tier C) → poster image + link-out. The
WebGL2 build streams the same scenes, and with the same studio
lighting, shadows, bloom and reflection probes; screen-space and
ray-traced reflections, path-traced stills and Gaussian splats stay
WebGPU-only ([Browser support](../browser-support.md)).

**You need:** a scene id (the `ingest/<id>.vpk` part of a share link) and
a page you can put a `<script>` tag on. `HOST` is your Verse origin.

## 1. The one-line embed

```html
<script src="https://HOST/embed.js" data-scene="docs-demo-718035483f84"></script>
```

The viewer mounts into the script's parent element as a `div.verse-embed`
at 16:9, filling the parent's width. Useful attributes:

| Attribute | Effect |
| --- | --- |
| `data-poster="poster.jpg"` | shown until the engine arrives — and if it never does (ad-blocker, offline), the poster stays |
| `data-target="#viewer"` | mount into that element instead of the script's parent |
| `data-vpk="…"` / `data-model="…"` | a `.vpk` by URL, or a small GLB / splat loaded whole |
| `data-render="continuous"` | opt out of on-demand rendering (embeds park when nothing changes, so a still viewer costs ~zero battery) |
| `data-hdr="auto"` | opt in to HDR output on HDR displays; embeds default to SDR so your page's colours never shift uninvited |
| `data-review="1"` | enable client review pins (see below) |
| `data-share="…"` | share token for a private scene |

## 2. Programmatic mount: events and control

```html
<div id="viewer"></div>
<script src="https://HOST/embed.js"></script>
<script>
  const viewer = Verse.embed(document.getElementById("viewer"), {
    scene: "docs-demo-718035483f84",
    poster: "poster.jpg",
  });
  viewer
    .on("ready",    (d) => console.log("tier", d.tier, "first frame in", d.ttfi, "ms"))
    .on("loaded",   (d) => console.log(d.clusters, "clusters, streaming:", d.streamed))
    .on("signed",   (s) => console.log("signature", s.signed))   // true | false | "unverified"
    .on("progress", (p) => console.log("drawn", p.drawn, "of", p.total))
    .on("dwell",    (d) => analytics.track("3d-dwell", { ms: d.ms }))
    .on("error",    (e) => console.warn("verse:", e.message));
</script>
```

Events already emitted are replayed to late listeners, so attaching after
`ready` fired still delivers it. The full verb and event list — `walk()`,
`move()`, `pick()`, `setSun()`, `setMaterial()`, `play()`, `goTo()`,
`joinRoom()` and the rest — is the [Embed SDK reference](../embed-sdk.md);
the typed contract ships as `verse-embed.d.ts` next to `embed.js`.

## 3. A flythrough video button

The viewer can record its tour (the compile-time staged tour, or an orbit
when the scene has none) to MP4/WebM **inside the iframe** and hand the
bytes to your page. Nothing is uploaded:

```js
progress.hidden = false;
viewer.on("export-progress", (p) => (bar.style.width = `${p.percent}%`));
const r = await viewer.exportVideo({ duration: 10, fps: 30, height: 1080 });
if (!r.cancelled) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(r.blob),
    download: r.name,                       // "docs-demo-718035483f84-tour.mp4"
  });
  a.click();
}
cancelButton.onclick = () => viewer.cancelExport();   // resolves the promise with { cancelled: true }
```

Options and the message protocol for non-SDK integrations are in
[Export a flythrough video](export-video.md).

## 4. Review pins in the embed

Opt in with `review: true`; there is deliberately no built-in button — your
page decides how review mode is toggled, the same way it does for walk
mode:

```js
const viewer = Verse.embed(el, { scene: "docs-demo-718035483f84", review: true });
reviewToggle.onclick = () => viewer.setReviewMode(reviewToggle.checked);
viewer.on("review-posted",   (d) => console.log("new pin", d.id, d.pos, d.text));
viewer.on("review-selected", (d) => showSidebar(d));
const comments = await viewer.getComments();   // [{ id, t, pos, text, author?, resolved }]
```

Viewers comment anonymously (an optional name field). Owner moderation —
resolve and delete — stays in the playground and `/studio`; embeds never
show those controls. Details: [Collect client review
comments](collect-review-comments.md).

## Private scenes

A private scene needs its share token both for the bytes and for review
calls. Pass it once:

```js
const viewer = Verse.embed(el, {
  vpk: "ingest/docs-demo-718035483f84.vpk",
  share: "<32 hex shareToken>",
  review: true,
});
```

Minting tokens: [Share privately with tokens](share-privately.md).

## Styling and layout

Style `div.verse-embed` with CSS; it is a normal block element (the live
examples on this site set it to `position: absolute; inset: 0` inside a
16:9 box). Remove the element to tear the viewer down. The review composer
clamps to the iframe's bounds and scrolls internally, so embeds work down
to 320 px wide.

## Try it

The [Live examples](#/examples) page mounts four real embeds with the exact
snippet beside each one; `/embed-demo.html` is a standalone host page you
can view-source.
