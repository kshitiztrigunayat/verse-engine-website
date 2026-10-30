# Embed in Ghost and HubSpot

Both take the plain HTML from [Studio](/studio) → the scene → **Embed**. Ghost also embeds the bare link; HubSpot gets a custom module with fields. The poster paints first; the 3D loads when the visitor scrolls to it.

**Status:** snippets and the HubSpot module files validated locally (`node integrations/embeds/check.mjs`). The Ghost link path relies on Verse's oEmbed discovery, which the server gate checks. Neither has been run on a live Ghost or HubSpot site yet.

## Ghost

**Paste the link.** Put the share link (`https://verse.ctruh.com/?vpk=ingest/<scene-id>.vpk`) on its own line in the editor and press Enter. Ghost turns it into an Embed card with the viewer.

This works because Ghost's editor resolves pasted links with oEmbed: when the host is not on its built-in list, it fetches the page and follows its oEmbed **discovery** tag. Every Verse share page carries that tag (`<link rel="alternate" type="application/json+oembed">`), pointing at `https://verse.ctruh.com/oembed`, which answers with the responsive iframe. Private scenes: paste the link *with* its share token; without one the lookup answers "not found". Members' emails get the poster and a link (email clients do not run iframes).

**HTML card.** Type `/html`, paste the HTML from Studio. Use it to set the shape, `&load=tap`, or a wider column (`kg-width-wide` / `kg-width-full` around the snippet).

## HubSpot

**Embed module.** In the page or blog editor, add an **Embed** module, type **Code**, paste the HTML from Studio. (URL mode and rich-text pasting go through HubSpot's provider list, which does not know Verse.)

**The "Verse 3D viewer" module.** Upload `integrations/embeds/hubspot/verse-viewer.module` to the Design Manager once (`hs upload verse-viewer.module "Ctruh/verse-viewer.module"` with the HubSpot CLI, or create the module by hand from `fields.json` and `module.html`). Editors then drag **Verse 3D viewer** onto any page or post and fill **Scene link**, **Shape**, **Load the 3D on tap**, **Max width**, **Corner radius**. Templates can pass a HubDB row's link with `{% module "verse" path="/Ctruh/verse-viewer.module" scene_link=row.verse_link %}`.

## Options

Add to the `src`: `&load=tap`, `&analytics=0`, `&fs=0`. Private scenes embed through a share link with its token (Studio → Embed → *Create an embed share link*); revoking it switches every embed off.

More: `integrations/embeds/ghost/README.md`, `integrations/embeds/hubspot/README.md`.
