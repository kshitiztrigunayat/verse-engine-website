# Sell with BigCommerce: a 3D view on every product

Three ways to put Verse scenes on a BigCommerce store, from paste-and-go to one scene per product in the theme. The poster paints first; the 3D loads when the shopper scrolls to it.

**Status:** widget template, schema and the Stencil partial validated locally (`node integrations/embeds/check.mjs`). Not yet registered on a live store.

## 1. Paste

Page Builder → **Widgets → HTML**, paste the HTML from [Studio](/studio) → the scene → **Embed**. For one product: Products → edit → Description → the HTML view (`</>`) → paste. Square (`aspect-ratio:1/1`) suits products.

## 2. The "Verse 3D viewer" widget

A Page Builder widget with a settings panel (scene link, shape, load on tap, max width, corner radius). Once it is registered on the store, every editor drags it onto a page or a product layout and pastes the scene link.

Registering is one API call with the store's token (Settings → API accounts, *Content: modify*):

```http
POST https://api.bigcommerce.com/stores/{store_hash}/v3/content/widget-templates
{ "name": "Verse 3D viewer", "kind": "custom",
  "template": <integrations/embeds/bigcommerce/widget-template/verse-viewer.html>,
  "schema":   <integrations/embeds/bigcommerce/widget-template/schema.json> }
```

Or with BigCommerce's Widget Builder: `widget-builder publish` on the same folder (rename `verse-viewer.html` to `widget.html` first; Widget Builder expects that name).

## 3. One scene per product in the theme

1. Products → edit → **Custom Fields**: name `verse_scene`, value the scene's share link.
2. Add `integrations/embeds/bigcommerce/stencil-snippet.html` to the theme as `templates/components/products/verse-viewer.html` and include it from the product page: `{{> components/products/verse-viewer}}`. Push the theme.

Every product with the field shows its scene; the others show nothing.

## Headless (Catalyst)

The custom field is on the Storefront GraphQL API (`product.customFields`). Frame the link's embed URL in an iframe, or hand the share link to `<verse-viewer src="…">` (`https://verse.ctruh.com/sdk/verse-viewer.js`).

## Options

Add to the `src`: `&load=tap`, `&analytics=0`, `&fs=0`. Private scenes embed through a share link with its token (Studio → Embed → *Create an embed share link*).

More: `integrations/embeds/bigcommerce/README.md`.
