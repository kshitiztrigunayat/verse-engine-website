# Sell with WooCommerce: a 3D view on every product

Give each WooCommerce product its Verse scene. Shoppers get a **3D view** tab on the product page, or the 3D in place of the image gallery. The poster paints first; the 3D loads when the shopper scrolls to it.

**Status:** plugin code validated locally (PHP parsed, zip built: `node integrations/embeds/check.mjs`). Not yet run on a live WooCommerce store.

## 1. Install the Verse plugin

The same **Verse** plugin as for WordPress pages ([Embed anywhere](embed-anywhere.md)), version 1.1.0 or later: **Plugins → Add New → Upload Plugin** → `verse-embed-1.1.0.zip` → Activate. With WooCommerce active, the plugin adds its product features on its own.

## 2. Put a scene on a product

Products → edit the product → **Product data → Verse 3D**:

- **Scene link**: paste the share link from Studio (`https://verse.ctruh.com/?vpk=ingest/<scene-id>.vpk`). A private scene's link carries its share token (Studio → Embed → *Create an embed share link*).
- **Replace the image gallery**: tick it to show the 3D where the product photos go, for this product only.

Update the product. Its page now has a **3D view** tab next to Description.

## 3. Store-wide settings

WooCommerce → Settings → Products → **Verse 3D**:

| Setting | Effect |
|---|---|
| Replace the image gallery | On every product with a scene, the 3D view takes the gallery's place (the tab stays) |
| Shape | Square (default, products), 16:9, 4:3, 3:4, 9:16, 21:9 |
| Load the 3D | When the shopper scrolls to it, or on tap only |

## 4. Anywhere else: the shortcode

`[verse_product]` on a product page shows that product's scene. `[verse_product id="123" aspect="1:1" width="640" load="tap"]` shows product 123's scene in any post or page.

## Headless stores

The link is on the REST API for storefronts that do not render WordPress pages:

- `GET /wp-json/wc/v3/products/123` → `verse_scene_url` and `verse_embed_url` (the lazy embed card to frame).
- Store API `GET /wp-json/wc/store/v1/products/123` → `extensions.verse.scene_url` / `embed_url`.
- `GET /wp-json/wp/v2/product/123` → `meta._verse_scene_url` (writable with edit rights).

Frame `embed_url` in an iframe, or pass `scene_url` to `<verse-viewer src="…">` (`https://verse.ctruh.com/sdk/verse-viewer.js`).

## What shoppers get

The same embed card as everywhere: poster first, the 3D on view (or tap), a fullscreen button, the page still scrolling on phones. Views count under *Arrived via: embed* on the scene's [analytics page](analytics.md).

More: `integrations/embeds/wordpress/README.md`.
