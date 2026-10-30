# Designer tools: Framer, Webflow, Figma

Put a Verse scene into the tools you design and publish in. None of them needs a build step or a token.

## Webflow: one embed (works today)

1. Site settings, Custom code, Head. Paste once and publish:

```html
<script src="https://verse.ctruh.com/embed.js" async></script>
```

2. Add an Embed element where the 3D should appear:

```html
<verse-viewer src="YOUR_SCENE_ID" aspect="16:9" autoplay-tour></verse-viewer>
```

Bind `src` to a CMS field to give every collection item its own scene.

## Framer: a code component

The component `VerseViewer` has a properties panel: scene id or link, autoplay tour, background, poster, shape, load on view or on tap, and corner radius. On the Framer canvas it shows the poster only, so editing stays quick; the published page runs the real viewer.

Install: Assets, Code, New code component, paste `VerseViewer.tsx` from `integrations/designers/framer`, save, drag it onto the page.

## Figma and FigJam: a preview plugin

Paste a scene link and the plugin inserts a frame with the scene's poster and a "View in 3D" link. Select the frame later and use "Open selected scene" to open it live. The plugin reads only public preview data and uploads nothing.

## Status

| Tool | Where | State |
| --- | --- | --- |
| Webflow embed | this page | works today |
| Framer component | `integrations/designers/framer` | ready to use; Marketplace listing pending |
| Webflow Designer Extension | `integrations/designers/webflow/extension` | scaffold; not yet run in a Webflow workspace |
| Figma plugin | `integrations/designers/figma` | ready to load in development; Community listing pending |

Free scenes show a small "Made with Verse by Ctruh" mark in every one of these. See also the [developer hub](/developers) and [Embed anywhere](embed-anywhere.md).
