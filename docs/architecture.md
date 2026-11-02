# Architecture and maintenance

## Stack and routing

The site is a **single-page app served from one HTML document**. `dist/index.html` is the shell (header, navigation dialog, footer, mount points). A small client-side router (`dist/js/router.js`) fetches a JSON payload for the requested route from `dist/content/`, swaps the page fragment into `#app-main`, updates the title, description, canonical and robots tags, loads the stylesheets that route needs, and mounts the route's behaviour module.

- Native ES modules, no bundler or framework. Node.js is needed only for the build, the local preview and the checks.
- Three.js r180 renders the landing illustration; GSAP 3.13 + ScrollTrigger drive its scroll story; Lenis 1.3 gives desktop smooth scrolling. All are vendored in `dist/vendor/`.
- Production hosts must rewrite every extension-less path to `/index.html` (see `vercel.json`) and serve real files as-is. Unknown routes render the in-app 404 view with HTTP 200.

## Repository layout

| Path | Purpose |
| --- | --- |
| `website/dist/index.html` | Generated shell. Do not edit by hand; edit `source/templates/shell.html` |
| `website/dist/content/` | Generated: one `<route>.json` per route (meta + HTML fragment) and `manifest.json` |
| `website/dist/css/` | `landing.css` (story + landing sections, in cascade order), `site.css` (shared pages), `studio.css`, `challenge.css` |
| `website/dist/js/` | App runtime (below) |
| `website/dist/assets`, `vendor` | Fonts, images, media, vendored libraries. Paths are root-absolute |
| `website/source/` | Content snapshots, generators, templates, Playground markup |
| `website/tools/verify.mjs` | Static and HTTP verification of the built app |

## Runtime modules (`dist/js/`)

| Module | Responsibility |
| --- | --- |
| `main.js` | Entry. Wires the menu, router, link interception and the page transition |
| `router.js` | Route table, payload loading, style swapping, meta updates, mount/dispose lifecycle, history and scroll handling |
| `transition.js` | Globe-to-logo intro and in-app page transition (canvas `#cnv-transition`) |
| `menu.js` | Navigation dialog (`#menu-dialog`); emits `verse:menu` |
| `core.js` | DOM helpers, `loadScript`, `go()` (navigation request event `verse:navigate`) |
| `pages.js` | Widgets on content pages: pricing calculator, code tabs, copy buttons, About tabs, docs search and feedback, email forms |
| `challenge.js` | Challenge entry form mockup (validates, never submits) |
| `studio.js`, `signin.js` | Verse Playground and its prototype sign-in |
| `landing/index.js` | Landing story: timeline, chapters, device morph, plug-in tabs, CTA; exports `mount()` which returns its dispose function |
| `landing/model.js`, `world-data.js` | Point-cloud renderer, reveal shader, camera fitting, particle geometry |
| `landing/device-morph.js`, `enhancements.js`, `showcase.js`, `plugins.js` | Device outline interpolation, possibilities gallery, FAQ/footer motion, plug-in workbench |

A route behaviour module exports `mount(context)` and may return a (promise of a) dispose function. The router runs disposers before leaving a route, so modules must remove any document/window listeners, tickers and observers they create. Element-level listeners vanish with their DOM.

Route kinds (`payload.kind`): `landing` (header only), `page` (header + footer; `pages.js` is mounted), `app` (Playground and sign-in render into `#app-standalone` with no shared chrome) and `notfound`. Stylesheet sets per kind are defined in `router.js`.

## Ids

Interactive elements and key regions have stable, kebab-case ids with a type prefix: `btn-`, `lnk-`, `inp-`, `sel-`, `txt-`, `frm-`, `sec-`, `nav-`, `dtl-`, `sum-`, `dlg-`, `hdr-`, `ftr-`, `asd-`, `art-`, `fig-`. Ids written by hand in templates and markup are kept (for example `btn-menu-open`, `nav-main`, `site-header`, `app-main`, `ch-form`). The build adds the missing ones deterministically from labels, names and hrefs, de-duplicated against the shell, so scripts and tests can target ids instead of class chains or text.

## Build

`npm run build` (from `website/`) runs `source/build.mjs`:

1. **Stage**: copies `source/templates/landing.html` and `docs-overview.html` into the throwaway `.build/stage` tree.
2. **Generate**: the page generators (`build-production-pages.mjs`, which imports `build-site-pages.mjs`, then `build-challenge-page.mjs`) write a complete multipage site into the stage (`VERSE_DIST`).
3. **Compile**: `build-spa.mjs` converts the stage into `dist/index.html`, `dist/content/*.json`, `sitemap.xml`, `robots.txt`, `pricing-data.json` and `code-samples.json`, and deletes legacy per-route HTML from `dist/`.

Set `SITE_ORIGIN=https://your-domain` to change the origin used in canonicals, Open Graph URLs, the sitemap and robots.txt. The default is the design-site origin.

`dist/css`, `dist/js`, `dist/assets` and `dist/vendor` are hand-maintained runtime sources; the build never regenerates them.

## Content inputs

| Input | Used for |
| --- | --- |
| `source/templates/landing.html` | Landing story markup and SVG artwork (retained by the generators) |
| `source/templates/shell.html` | The single HTML document |
| `source/approved-pages.json` | Approved prototype marketing copy and initial page structure |
| `source/production-plans-api.json` | Captured public plans API, seats, rates, packs, FAQ and callback information |
| `source/production-pricing.json` | Plan-comparison HTML and pricing context |
| `source/production-plugins.json` | Core and AEC package metadata, requirements, checksums, install instructions |
| `source/production-samples.json` | Sample thumbnails, descriptions and destinations |
| `source/production-docs.json` and `production-markdown/` | Documentation navigation and the 88 article bodies |
| `source/studio/index.html`, `signin.html` | Playground and sign-in markup (the small-screen gate lives here) |

These are public-source snapshots, not a CMS. Refresh them deliberately, rebuild and verify.

## Editing recipes

**Change a landing headline:** edit the chapter in `source/templates/landing.html`, rebuild. Keep chapter ids, `data-chapter`, `data-jump`, tab ids and canvas/device hooks unless you update `landing/index.js` too.

**Change the shared header, footer or navigation dialog:** edit the helpers in `source/build-site-pages.mjs`, rebuild, and check the landing, a content page and the menu on a phone.

**Change a documentation article:** edit its Markdown in `source/production-markdown/`, rebuild. A new article also needs a navigation entry in `production-docs.json` with its `data.page` key.

**Change pricing / release a plug-in / change samples:** update the matching snapshot together with its dependent fields (see the previous recipes in `docs/integrations-and-release.md`), rebuild, verify.

**Add a route with behaviour:** add the page to a generator, register a module in the `MODULES` map in `router.js` (route path -> dynamic import) and export `mount()` from it.

**Change the particle world:** geometry in `landing/world-data.js`, camera and reveal fitting in `landing/model.js`, scroll mapping in `landing/index.js`. Recheck the table supports, interior visibility and building centering in every device outline at desktop and phone widths.

## Useful debugging paths

- `/?motion-off` uses the static readable story and skips the intro animation.
- `/?poster` is a retained poster capture mode.
- The canvas host exposes `data-vertex-count` (illustration point count, not the product benchmark); `data-progress` and `data-scroll-progress` on `.story` expose the resolved chapter and scroll values.
- `node tools/verify.mjs --http=http://127.0.0.1:4173` fetches every route and payload from a running preview server.

## Verse Playground (`/studio`)

Every "Explore Verse Engine" call to action links to `/studio`, a client-side workspace modelled on the production Studio: Scenes, Analytics, Webhooks, Plug-ins & API, and the three-step New scene flow (Upload, Review, Preview & Share). Markup lives in `website/source/studio/` (`index.html`, `signin.html`), behaviour in `dist/js/studio.js` and `dist/js/signin.js`, styles in `dist/css/studio.css`. The build compiles the markup into the `/studio` and `/signin` route payloads, which render into `#app-standalone`. Below 820px wide (and touch devices up to 1024px) a "Your screen is too small" gate blocks the Playground and the sign-in page.

The Playground uses hash sub-routes (`/studio#/analytics`) inside the `/studio` route; the app router ignores hash-only changes. State (scenes, webhooks, placeholder API keys) is kept in `localStorage` under `verse-playground-v1`; files are never uploaded, webhook deliveries and exports are simulated, API keys do not authenticate, and share links resolve only in the same browser. The 3D preview is an illustrative Three.js scene, not the Verse renderer. To connect it to the production service, replace the data layer at the top of `studio.js` and the simulated actions in the `handle` function.
