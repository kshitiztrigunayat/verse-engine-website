# Sell with Magento / Adobe Commerce: a 3D view on every product

A small Magento 2 module, `Ctruh_VerseViewer`, adds a **Verse scene link** attribute to products and shows the scene on the product page under the image gallery. The poster paints first; the 3D loads when the shopper scrolls to it.

**Status:** skeleton. The PHP parses and the XML and JSON are well-formed (`node integrations/embeds/check.mjs`), but the module has not been run on a Magento install yet. Expect a first-run fix or two.

## Install

```sh
cp -r integrations/embeds/magento/Ctruh <magento>/app/code/
bin/magento module:enable Ctruh_VerseViewer
bin/magento setup:upgrade        # adds the product attribute
bin/magento setup:di:compile     # production mode
bin/magento cache:flush
```

## Use

Catalog → Products → a product → the **Verse 3D** group → **Verse scene link**: paste the share link from [Studio](/studio) (`https://verse.ctruh.com/?vpk=ingest/<scene-id>.vpk`). The attribute is store-view scoped, so each store view can show a different scene. The product page then shows the viewer under the gallery; products without a link show nothing.

## Settings (in the layout file)

`view/frontend/layout/catalog_product_view.xml`: `aspect` (`1:1` default; `16:9` for rooms), `max_width` (0 = the column), `load_on_tap`. To replace the gallery with the 3D view, uncomment the `remove="true"` line for `product.info.media.image`. Self-hosted Verse servers: add the host to `Block/Product/Viewer.php`'s `HOSTS`.

## Without the module

Page Builder → **HTML Code**, or a CMS block: paste the HTML from Studio → the scene → Embed.

## Headless (PWA Studio, GraphQL)

`verse_scene_url` is an ordinary product attribute: on REST under `custom_attributes`, and on GraphQL once it is added to `ProductInterface` (a `schema.graphqls` extension, not in the skeleton). Frame its embed URL, or hand it to `<verse-viewer src="…">` (`https://verse.ctruh.com/sdk/verse-viewer.js`).

## Private scenes

Use the share link with its token (Studio → Embed → *Create an embed share link*).

More: `integrations/embeds/magento/README.md`.
