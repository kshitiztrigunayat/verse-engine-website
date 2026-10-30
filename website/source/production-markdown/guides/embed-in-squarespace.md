# Embed in Squarespace

Put a Verse scene on a Squarespace page with a **Code** block. The poster paints first; the 3D loads when the visitor scrolls to it.

**Status:** snippet validated locally (`node integrations/embeds/check.mjs`). Not yet run on a live Squarespace site; plan notes follow Squarespace's published plan table and may move.

## Code block

1. In [Studio](/studio), open the scene → **Embed** → copy **HTML**.
2. Edit the page → **Add Block → Code**. Keep the type on **HTML**, untick *Display source*, paste, save.

Code blocks are on every current plan. Code Injection (site-wide code) and some Embed block modes need the Business plan, so the Code block is the safe choice.

## Code block or Embed block?

| Block | With a Verse link |
|---|---|
| **Embed** block, URL mode | "Unable to load content": Squarespace resolves links through its own provider list, which does not know Verse |
| **Embed** block, Code snippet mode (`</>`) | Works: it takes the iframe as is |
| **Code** block | Works (use this) |

## Full-bleed

Fluid Engine (7.1): stretch the block across every column and set the section's width to **Full**. Classic 7.1 / 7.0: put the block in its own section; for edge to edge, a line of Custom CSS (Business plan) pulls it out of the content width (see `integrations/embeds/squarespace/README.md`). For a fixed-height hero, replace `aspect-ratio:16/9` with `height:70vh`.

## Products

A product's **Additional info** tab takes blocks: add a Code block there with the scene (square shape: `aspect-ratio:1/1`).

## Options

Add to the `src`: `&load=tap`, `&analytics=0`, `&fs=0`. Private scenes embed through a share link with its token (Studio → Embed → *Create an embed share link*).
