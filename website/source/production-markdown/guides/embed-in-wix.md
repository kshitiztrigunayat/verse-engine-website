# Embed in Wix

Put a Verse scene on a Wix page with an **Embed HTML** element, or one scene per listing with Velo and a collection field. The poster paints first; the 3D loads when the visitor scrolls to it.

**Status:** snippet and Velo page code validated locally (`node integrations/embeds/check.mjs`). Not yet run on a live Wix site.

## One scene on a page

1. In [Studio](/studio), open the scene → **Embed** → copy **HTML**.
2. Wix editor → **Add Elements (+) → Embed Code → Embed HTML** → **Code** → paste → **Update**.
3. Drag the element to the shape you want: Wix does not size an Embed HTML element to its content, so the snippet fills whatever box you give it (landscape for rooms, square for products).
4. Publish. The editor's preview may show a placeholder; the live page shows the scene.

Wix's **Embed a site** element works too: give it the embed URL (`https://verse.ctruh.com/embed?vpk=ingest/<scene-id>.vpk`). Pasting the share link into a **Video** element or rich text does not work (Wix only resolves providers on its own list).

## One scene per listing (Velo)

For dynamic pages where every item has its own scene:

1. Turn on **Dev Mode**. Add a field `verseSceneUrl` to the collection and put each item's share link in it.
2. On the dynamic page, add an Embed HTML element with the id `verseFrame` and paste `integrations/embeds/wix/html-component.html` as its code.
3. Paste `integrations/embeds/wix/velo-verse-embed.js` as the page code. It reads the current item's link from the dataset and sends it to the element, which frames the scene.

A **Wix Blocks** widget wraps the same two files with a `sceneUrl` property.

## Options

Add to the `src`: `&load=tap` (load only on tap), `&analytics=0` (count nothing), `&fs=0` (no fullscreen button). Private scenes: use the link with its share token from Studio → Embed → *Create an embed share link*; revoking it switches the embed off.

More: `integrations/embeds/wix/README.md`.
