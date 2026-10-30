# 3D on product pages: WooCommerce, Magento, BigCommerce, Salesforce

Put the Verse 3D viewer in your product gallery. Each product gets one Verse link, and each variant can have its own. When a shopper picks a colour or a finish, the viewer switches to that variant's scene. The product image is shown first, and the 3D loads when the shopper scrolls to it, so product pages stay fast.

| Store | What you install | How it shows |
|---|---|---|
| **WooCommerce** | A WordPress plugin | First slide of the product gallery, or in place of the featured image |
| **Magento 2 / Adobe Commerce** | A module (`ctruh/module-verse`) | First frame of the product gallery (fotorama), or in place of the main image |
| **BigCommerce** | An app (OAuth install) | Before, or in place of, the main product image |
| **Salesforce Commerce Cloud** | SFRA: the `int_verse` cartridge. Composable Storefront (PWA Kit): a React component | First slide of the image carousel / next to the image gallery |
| **Shopify** | The Verse 3D viewer app block | See [Embed anywhere](embed-anywhere.md#shopify-product-pages) |

**Status.** WooCommerce is verified on a real store. Magento, BigCommerce and Salesforce Commerce Cloud are built and tested against stand-ins; their store listings (Adobe Commerce Marketplace, BigCommerce App Marketplace, Salesforce AppExchange) are pending, so for now you install them from the code in `integrations/commerce/`.

## The link

In [Studio](/studio), open the scene and copy its share link, for example `https://verse.ctruh.com/?vpk=ingest/<scene-id>.vpk` or `https://verse.ctruh.com/view?glb=ingest/<scene-id>.fidelity.glb`. For a private scene, create an embed share link. It carries the scene's token (`&share=…`).

- **One scene per variant**: give each variant its own link.
- **One scene, several materials**: if the model has material variants (KHR_materials_variants, see [Build a configurator](build-a-configurator.md)), use the same link with `&variant=<name>` for each variant, for example `…&variant=Midnight%20Blue`.
- **No link on a variant**: the variant shows the product's scene.

Every integration accepts **https links to your Verse server only**: `https://verse.ctruh.com`, or your own server if you [run one](run-your-own-server.md). Anything else is refused when you save it and is never shown to shoppers. That includes `http:` links, links to other sites and `javascript:`.

## WooCommerce

1. Get `verse-for-woocommerce-1.0.0.zip` from Ctruh. Then go to **Plugins → Add New → Upload Plugin** and activate it. It needs WooCommerce 8.2 or newer and WordPress 6.5 or newer.
2. Go to **WooCommerce → Settings → Products → Verse 3D**. Set the server (keep `https://verse.ctruh.com`), where it goes in the gallery (*first slide*, *instead of the featured image*, or *not in the gallery*), when it loads (*when visible*, *on tap* or *straight away*) and the shape.
3. Edit a product and paste the link into the **Verse 3D link** box on the right. For variable products, go to **Product data → Variations**, open a variation and fill in **Verse 3D link**.

With *not in the gallery*, put `[verse_product]` wherever you want the viewer (for example in the description), or `[verse_product id="123" load="tap" aspect="16:9"]`. The plugin works with WooCommerce's order storage (HPOS) and the block checkout. Uninstalling it removes its settings and every product's Verse link.

## Magento 2 / Adobe Commerce

1. Install the module. With Composer: `composer require ctruh/module-verse` once it is on the Marketplace, or copy `Ctruh/Verse` to `app/code/Ctruh/Verse`. Then:
   ```sh
   bin/magento module:enable Ctruh_Verse && bin/magento setup:upgrade && bin/magento cache:flush
   ```
2. Go to **Stores → Configuration → Catalog → Verse 3D Viewer**. Set the server, load mode and gallery position. They can differ per store view.
3. Edit a product. In the **Verse 3D** group, fill in **Verse 3D link** (store-view scope). For configurable products, give the child products their own links. Swatches and drop-downs switch the viewer to the chosen child.

The module adds your Verse server to the storefront's Content Security Policy (`script-src`, `frame-src`, `img-src`).

## BigCommerce

1. Install the **Ctruh Verse 3D** app from the link Ctruh sends you. It adds the storefront script to your store (Script Manager) by itself.
2. Open the app in your control panel. Check the server and placement, then paste a Verse link next to each product and, if you want, next to each variant. Save.
3. The viewer appears before the main product image on the product page. Choose *Only where the theme has `<div data-verse-mount>`* to place it yourself in your Stencil theme.

The links are stored on your products as metafields. Uninstalling the app removes its script and its data.

## Salesforce Commerce Cloud

**SFRA (Storefront Reference Architecture)**

1. Upload the `int_verse` cartridge and add it to the front of your storefront's cartridge path: `int_verse:app_storefront_base`.
2. Import `metadata/` (Administration → Site Development → Import & Export). It adds the product attribute **Verse 3D link** (`verseLink`) and the **Ctruh Verse 3D** site preferences. Turn on *Show the Verse 3D viewer*.
3. Add one line to your PDP template, right after the image carousel: `<isinclude template="product/components/verseViewer" />`.
4. Fill in **Verse 3D link** on masters and variants (a variant without one shows the master's scene).

There are no controllers or hooks. The viewer is moved into the carousel and follows the variation choice in the browser.

**Composable Storefront (PWA Kit)**

```jsx
import { VerseProductViewer } from "@ctruhtech/verse-pwa-kit";
// in your product detail page, next to <ImageGallery>:
<VerseProductViewer product={product} server="https://verse.ctruh.com" />
```

`product` is the page's product. Once the shopper picks a variant, it is the selected variant, and the viewer follows it. The component reads `c_verseLink` and is built on `@ctruhtech/verse-react` ([developers](../developers.md#verse-viewer)).

## Content Security Policy

If your store sends a CSP, allow your Verse server in `script-src` (it serves `embed.js`), `frame-src` (the viewer runs in a frame on the Verse server) and `img-src` (posters). Magento's module does this for you. None of the integrations add inline scripts to your pages.

## What shoppers get

The same viewer as every Verse embed ([Embed anywhere](embed-anywhere.md#what-visitors-get)): the poster first, the 3D when it is on screen, page scrolling that still works on phones, a fullscreen button and, for product-size scenes, [View in AR](view-in-ar.md) on phones. The viewer runs on the Verse server inside a frame, so it never runs code on your store's pages.
