# React and Vue: `<VerseViewer>`

Typed wrappers over the [`<verse-viewer>`](web-component.md) web component for React 17+ and Vue 3. Props mirror the element's attributes, the viewer's events become callbacks (React) or component events (Vue), and a ref gives you the embed SDK API. Both are safe on the server: Next.js (app and pages routers), Remix, Gatsby, Nuxt 3.

**Status:** tested. Both wrappers render and upgrade the element in a real browser (React 18 UMD through an import map, Vue 3 ESM browser build), the scene loads through them and `onLoad` / `@load` fire with the scene id (`web/test/fix-verify-integrations.mjs`); `renderToString` SSR, prop → attribute mapping and the CJS builds are unit-tested (`sdk/react`, `sdk/vue`: `npm test`). The npm packages `@ctruhtech/verse-react` and `@ctruhtech/verse-vue` are built but **not yet published**.

## React

```sh
npm install @ctruhtech/verse-react
```

```tsx
import { VerseViewer } from "@ctruhtech/verse-react";

export function Listing() {
  return (
    <VerseViewer
      src="https://verse.ctruh.com/?vpk=ingest/palm-villa-0a1b2c3d4e5f.vpk"
      aspect="16:9"
      loading="lazy"
      onLoad={(d) => console.log("card loaded", d.id)}
    />
  );
}
```

**Props:** `src`, `scene`, `server`, `poster`, `loading` (`lazy` · `eager` · `tap`), `aspect`, `background`, `camera`, `look`, `variant`, `cfg`, `share`, `analytics`, `ar`, `guard`, `fullscreen`, `title`, `api`, plus the usual `className`, `style`, `id`. What each one does: [the attribute table](web-component.md#3-attributes).

**Callbacks:** `onLoad` (the card loaded, `{ url, id }`), `onReady` / `onLoaded` (SDK mode: the viewer is mounted / the scene is in), `onEvent(name, detail)` for every SDK event.

### The embed SDK from a ref

```tsx
import { useRef } from "react";
import { VerseViewer, type VerseViewerHandle } from "@ctruhtech/verse-react";

function Configurator() {
  const ref = useRef<VerseViewerHandle>(null);
  return (
    <>
      <VerseViewer ref={ref} scene="sofa-0437dfafa54a" api onEvent={(n, d) => console.log(n, d)} />
      <button onClick={async () => (await ref.current!.viewer()).setVariant("Oak")}>Oak</button>
    </>
  );
}
```

`ref.current.viewer()` loads `embed.js` from the Verse origin once and resolves the full [embed SDK](../embed-sdk.md) viewer; `ref.current.element` is the `<verse-viewer>` element itself.

### Next.js and other SSR

The component renders `<verse-viewer …attributes>` as HTML on the server and registers the element in an effect on the client. Nothing touches `window` during SSR, so it works in server components' children, in `getServerSideProps` pages and in Remix loaders alike. For a no-JavaScript fallback, `verseViewerStaticHtml(attrs)` returns the plain responsive `<iframe>`.

## Vue

```sh
npm install @ctruhtech/verse-vue
```

```vue
<script setup>
import { VerseViewer } from "@ctruhtech/verse-vue";
const onLoad = (d) => console.log("card loaded", d.id);
</script>

<template>
  <VerseViewer src="https://verse.ctruh.com/?vpk=ingest/palm-villa-0a1b2c3d4e5f.vpk" aspect="16:9" loading="lazy" @load="onLoad" />
</template>
```

Or once for the whole app:

```js
import { VerseViewerPlugin } from "@ctruhtech/verse-vue";
app.use(VerseViewerPlugin);
```

The plugin registers `<VerseViewer>` globally and tells Vue's compiler that `verse-viewer` is a custom element, so the raw tag works in templates too.

**Props:** the same list as React (`src`, `scene`, `server`, `poster`, `loading`, `aspect`, `background`, `camera`, `look`, `variant`, `cfg`, `share`, `analytics`, `ar`, `guard`, `fullscreen`, `title`, `api`). **Events:** `load`, `ready` / `loaded` (SDK mode), `event` (name, detail) for every SDK event.

### The embed SDK from a template ref

```vue
<script setup>
import { ref } from "vue";
import { VerseViewer } from "@ctruhtech/verse-vue";
const v = ref(null);
const oak = async () => (await v.value.viewer()).setVariant("Oak");
</script>

<template>
  <VerseViewer ref="v" scene="sofa-0437dfafa54a" api @event="(n, d) => console.log(n, d)" />
  <button @click="oak">Oak</button>
</template>
```

### Nuxt 3 and other SSR

The component renders the tag on the server and registers the element in `onMounted`. For a no-JavaScript fallback, `verseViewerStaticHtml(attrs)` returns the plain `<iframe>` (render it with `v-html`).

## Both

- **Private scenes.** Pass the share token: `share="<token>"`, or use the share link from Studio → Embed as `src` (the token is in it).
- **Self-hosted servers.** `server="https://verse.example.com"`, or an absolute `src` from that origin.
- **Several scenes on one page.** `loading="tap"` so only the scene the visitor chooses downloads the engine.
- **Analytics.** Views count as *Arrived via: embed* unless `analytics={false}` / `:analytics="false"`.
- **Other frameworks.** Svelte, Angular, Lit, Astro and Qwik use [the element](web-component.md) directly; it needs no wrapper.

See also: [`<verse-viewer>`](web-component.md), [Embed SDK reference](../embed-sdk.md), [Integrations](../integrations.md).
