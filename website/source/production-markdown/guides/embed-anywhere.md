# Embed anywhere: WordPress, Shopify, Webflow, any page

Put a Verse scene on a listing page, a product page or a blog post. Paste the link, or copy the code from Studio. The embed shows the scene's poster straight away, and the 3D viewer loads when a visitor scrolls to it. Pages stay fast, and a visitor who never scrolls that far downloads nothing of the engine.

## The quickest way: Studio → Embed

Open [Studio](/studio), find the scene and press **Embed**. One click copies the embed code and opens the Embed panel:

- **Shape**: Landscape 16:9 (rooms and walkthroughs), 4:3, Square (products), Portrait 9:16 (phone-first pages).
- **Width**: full width of the page's column, or capped at 960 / 640 / 480 px.
- **Load**: *When visible* (default) or *On tap*. On tap, nothing loads until the visitor taps the poster. Use it on pages with several scenes.
- **Copy**: the HTML, the WordPress shortcode and the link. Steps for Shopify are listed there too.
- **Preview**: the real embed at the shape you chose.

## Any website (plain HTML, Wix, Squarespace, Framer, Elementor)

Paste the HTML into the builder's HTML or embed block:

```html
<div style="position:relative;width:100%;aspect-ratio:16/9;margin:0 auto">
  <iframe src="https://verse.ctruh.com/embed?vpk=ingest/<scene-id>.vpk" title="Palm villa — 3D view" loading="lazy"
    allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; autoplay; clipboard-write" allowfullscreen
    style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:8px"></iframe>
</div>
```

The box fills its column at the shape you chose, on phones and desktops alike. Your page needs no special headers. The viewer runs on Verse's own site inside the frame, so your ads, analytics and other embeds are unaffected. The embed also works on a page that is itself cross-origin isolated (COOP/COEP).

Options on the `src`:

| Add | Effect |
|---|---|
| `&load=tap` | Load the 3D only when the visitor taps the poster |
| `&analytics=0` | Count nothing from this embed |
| `&guard=0` | The scene takes every gesture straight away. By default, vertical swipes and the mouse wheel scroll your page until the visitor taps or clicks the scene. |
| `&fs=0` | Hide the fullscreen button |
| `&look=studio:warm`, `&bg=ffffff` | The same look options as the share link |

## WordPress

Install the **Verse** plugin. Get `verse-embed-1.1.0.zip` from Ctruh (it is not in the WordPress plugin directory yet), then go to **Plugins → Add New → Upload Plugin** and activate it. Then use any of these:

- **Paste the link** on its own line, or into an **Embed** block: `https://verse.ctruh.com/?vpk=ingest/<scene-id>.vpk`. WordPress turns it into the viewer.
- **Shortcode**: `[verse url="https://verse.ctruh.com/?vpk=ingest/<scene-id>.vpk" aspect="1:1" width="640" load="tap"]`. Studio's Embed panel writes it for you.
- **Block**: **Verse 3D viewer** in the Embed category. It has fields for the link, shape, max width and when to load.

Why install the plugin instead of relying on discovery? WordPress can find Verse links without the plugin, but then it puts the frame in a sandbox that stops the 3D viewer. The plugin registers Verse as a trusted provider. Details: `integrations/embeds/wordpress/README.md`.

## Shopify (product pages)

The **Verse 3D viewer** app block goes on any product template of an Online Store 2.0 theme:

1. Online Store → Themes → **Customize** → a product template → **Add block** → **Verse 3D viewer**.
2. Paste the scene's link into **Verse link**. Pick the shape (Square suits products) and save.
3. For a different scene on each product, create a product metafield `verse.scene_url` (type URL), put each product's link there and leave the block's link empty.

The block ships as a Shopify theme app extension (`integrations/embeds/shopify/`). Ctruh installs it on your store with a private install link. There is no App Store listing yet.

## Webflow

Add a **Code Embed** element and paste the HTML from Studio. Custom code needs a paid Site plan, and the Designer may only show a placeholder, so check the published site. In a CMS collection, keep each item's embed URL in a plain-text field and insert it into the `src`.

Webflow's **Video** element does **not** take Verse links. It only accepts providers on Embedly's list, and Verse is not on that list yet. More: `integrations/embeds/webflow/README.md`.

## Link previews (WhatsApp, Slack, LinkedIn, iMessage, X, Facebook)

Every share link previews with the scene's title and poster. Verse share pages carry Open Graph and Twitter card tags, plus an oEmbed discovery link for tools that embed (WordPress, Notion-style editors). The poster is the one Verse captured when the scene was first opened, or the one you attached in Studio.

## Private scenes

A private scene embeds through a share link. In the Embed panel, press **Create an embed share link**. The token goes into the embed code, the shortcode and the link. To switch every embed of it off, revoke that share link (Studio → the scene → Visibility). Without a valid token, an embed, a link preview or an oEmbed lookup reveals nothing: the answer is the same as for a scene that does not exist.

## What visitors get

- **The poster first**, with the scene's name and a **View in 3D** button. The page paints immediately.
- **The 3D loads when it is on screen.** With *On tap*, it loads only after a tap.
- **On phones, the page still scrolls.** A vertical swipe over the scene scrolls your page. A sideways drag turns the scene, and a tap hands every gesture to the scene. On desktop, the mouse wheel scrolls the page until the visitor clicks into the scene (or holds Ctrl / ⌘).
- **A fullscreen button** in the top-right corner. iPhone Safari does not allow fullscreen inside frames, so there the button opens the full viewer in a new tab.
- **Your enquiry button** (set on the Studio analytics page, under "Enquiry button"), drawn over the 3D as on the share link.
- **Analytics**: embed views are counted under *Arrived via: embed* on your [analytics page](analytics.md). Use `&analytics=0` (or `analytics: false` in the JS SDK) to count nothing.

## For developers

- oEmbed: `GET https://verse.ctruh.com/oembed?url=<share link>&maxwidth=&maxheight=` ([API](../api.md#oembed)).
- The JS SDK (`embed.js`, [Embed SDK](../embed-sdk.md)) frames the same viewer and adds events and control (`viewer.on("loaded")`, `setVariant`, …). It takes the same `guard` and `fullscreen` options.
