# Embed in Framer

A Framer code component, **VerseViewer**, that frames a Verse scene with real property controls: scene link, shape, load on view or tap, poster, background, analytics. Or paste the plain HTML into an Embed element. The poster paints first; the 3D loads when the visitor scrolls to it.

**Status:** the component type-checks locally (`tsc --noEmit`, via `node integrations/embeds/check.mjs`). Not yet run inside Framer.

## The code component

1. Framer → **Assets → Code → "+" → New code component**, name it `VerseViewer`.
2. Replace the editor's contents with `integrations/embeds/framer/VerseViewer.tsx`, save.
3. Drag **VerseViewer** onto the canvas. In the properties panel, paste the scene's share link from [Studio](/studio) into **Scene link** (`https://verse.ctruh.com/?vpk=ingest/<scene-id>.vpk`).

| Control | Effect |
|---|---|
| Shape | 16:9, 4:3, Square, 3:4, 9:16, 21:9 (when the layer's height is *Fit content*) |
| Load | On view, or on tap |
| Poster | An image behind the frame until the card paints |
| Background | The box colour, also passed to the scene as `bg` |
| Analytics | Off counts nothing (`&analytics=0`) |
| Radius, Title | Corners; the frame's accessible name |

CMS: add a "Verse link" field to the collection and bind **Scene link** to it on the detail page. Nothing runs on your page but the iframe.

## The Embed element

**Insert → Utility → Embed**, type **HTML**, paste the HTML from Studio → Embed. Give the layer a height; the snippet fills it. Framer's Embed in **URL** mode does not take Verse links.

## Private scenes

Use the share link with its token (Studio → Embed → *Create an embed share link*). Revoking it switches the embed off.

More: `integrations/embeds/framer/README.md`.
