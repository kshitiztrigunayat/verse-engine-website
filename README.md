# Verse Engine website developer handoff

Prepared 30 October 2026; converted to React in November 2026 (branch `feat/convert-to-react`). This package contains the responsive marketing website, delivered as a single-page app built with Vite + React (one `index.html`, a client-side router and one React component per page), the page generators and captured content, visual references, and instructions for maintenance and release. It is a static marketing and documentation frontend; the live Verse service continues to handle accounts, scene publishing and payments.

Reference website: https://verse-engine-ctruh-design.rajat83.chatgpt.site/

## Start here

1. Clone the repository and open a terminal in `website/`.
2. Use Node.js 22 or later and run `npm ci` to install the dependencies (React, Vite, Tailwind, Three.js, GSAP, Lenis).
3. Run `npm run dev` and open the address it prints, for development with live reload.
4. Run `npm run build` to build the deployable site into `dist/` (not committed), then `npm start` and open http://127.0.0.1:4173/ to preview the build. The preview server falls back to `index.html` for extension-less paths, like the production rewrite.
5. Run `npm run check` (and `node tools/verify.mjs --http=http://127.0.0.1:4173` with the preview running) to check routes, payloads, links, ids, resources and JavaScript syntax.
6. After changing the captured content in `source/`, run `npm run content` to regenerate the documentation payloads in `public/content/`, the docs chapter list and `sitemap.xml`/`robots.txt`, then build again.

Serve the site over HTTP; opening `index.html` with `file://` will not work.

## Package map

| Location | Purpose |
| --- | --- |
| `website/src/` | The app: `main.jsx` (entry), `router.js`, `Shell.jsx` and `components/` (header, footer, menu), `pages/` (one React component per page; `pages/index.js` lists them), `pages/meta.js` (each page's title, description and other meta), `pages/docs/` (documentation layout and chapter list), `pages/studio/` (Playground: views, data, 3D preview), `animations/` (GSAP and Three.js: `landing/` home-page story, `transition.js` intro and page transition) |
| `website/public/` | Served unchanged at the same paths: `css/` (site styles; the router adds each page's stylesheets), `content/` (generated documentation payloads and the route list), `assets/` (images, fonts, models), `pricing-data.json`, `code-samples.json`, `sitemap.xml`, `robots.txt` |
| `website/dist/` | Build output of `npm run build`; generated, not committed |
| `website/source/` | Content build (`npm run content`): templates, page generators, public content snapshots and 88 documentation Markdown files |
| `website/preview-server.mjs` | Local preview server for `dist/`, bound to 127.0.0.1:4173; not a production server |
| `website/tools/verify.mjs` | Repeatable local resource, syntax, JSON and optional HTTP checks (`npm run check`) |
| `docs/architecture.md` | Page ownership, generation, source mapping and maintenance recipes (written for the earlier, pre-React layout) |
| `docs/design-and-motion.md` | Design tokens, responsive behavior and interaction contracts |
| `docs/integrations-and-release.md` | Production handoffs, limitations and release checklist |
| `reference/` | Route list, external-link inventory and screenshot references (`runtime-manifest.json` and `handoff-qa.json` describe the earlier multipage build and are historical) |

## Delivered scope

The app has 115 routes, including Home, Developers, Pricing, Plug-ins, three core plug-in installation guides, About, Samples, Challenge, the Playground and sign-in, 88 production documentation articles, an introductory overview and retained article aliases. All routes are listed in `public/content/manifest.json` and `reference/routes.json`.

The landing page keeps the approved sequence: particle-world story; possibilities; Take the Challenge; the three-step publishing workflow; plug-in workbench; FAQ; footer. The opening story progressively reveals an object, table, interior, building and neighbourhood. Its experience chapter changes between browser, phone and headset outlines.

## Deploying to Vercel

`vercel.json` (repo root) and `website/vercel.json` install with `npm ci`, build with `npm run build`, publish `dist/` (`website/dist` from the repo root), rewrite extension-less paths to `/index.html` and set security headers and cache rules, so either Root Directory (repo root or `website`) works; set Framework Preset to "Other". The local preview server is named `preview-server.mjs` on purpose: a file called `server.mjs` makes Vercel treat the project as a Node server and every request fails with `500 FUNCTION_INVOCATION_FAILED`.

## Read before changing the site

- Retain approved product copy and the existing page sequence. Pricing, plug-in releases, documentation and sample destinations use the production snapshots supplied by the owner; product values are snapshots rather than a live sync.
- Page text and markup live in the React components in `src/pages/`, and each page's title and description in `src/pages/meta.js`; change them there. The documentation articles (and their titles) come from `source/` through `npm run content`.
- Keep Degular headings and Metropolis body text. Use blue actions and highlights, light section surfaces, and white text on blue chapters. Keep the hero text dark on white. The styles are the CSS files in `public/css/`; the router adds each page's stylesheets. Tailwind is available for new work with the `tw:` class prefix (for example `tw:flex`).
- The particle story is a custom illustrative Three.js scene. It is not the Verse rendering engine, a user-uploaded scene, or a measurement of the product's billion-triangle claims.
- Account, checkout, callback, challenge and actual viewer journeys leave this frontend for the production service. Do not replace these with simulated success states.
- About's unfinished company-story and team-photo blocks stay hidden, as requested by the owner.
- Keep all files in `public/` (assets, fonts) at their current paths. URLs are rooted at `/`; hosting below a subdirectory requires coordinated path changes. Do not edit `public/content/` or `dist/` by hand; they are generated.

## Current implementation status

The site was converted from HTML fragments and plain JavaScript modules to React components; the converted site was checked against the previous build on every route at desktop and phone widths (page structure, head, console messages, screenshots) and through scripted interactions, with the same results. The animation stays in GSAP and Three.js (`src/animations/`), installed as npm packages (`three` 0.180.0, `gsap` 3.13.0, `lenis` 1.3.11: the same releases as the earlier `vendor/` copies). The existing hosted website has not been changed by this work.

Source provenance: public product content captured on 29–30 October 2026 from the owner's supplied Vercel prototype and `verse.ctruh.com`. External endpoints are recorded in `reference/external-links.json`.

## First developer review

Read `docs/architecture.md`, then `docs/design-and-motion.md` (both describe the pre-React file layout; the page behaviour they describe is unchanged). Use `docs/integrations-and-release.md` to validate production destinations before launch. Screenshot references illustrate prior visual checks and are not interactive specifications.

## Production release notes

- Per-route titles, unique descriptions, canonicals, Open Graph URLs and `noindex` for `/studio` and `/signin` are applied by the router from `src/pages/meta.js` (documentation pages: their payload). The site origin used for canonical and Open Graph URLs is in `index.html` (the `meta-site-origin`, `link-canonical`, `meta-og-url` and `meta-og-image` tags); `sitemap.xml` and `robots.txt` use `SITE_ORIGIN` (`SITE_ORIGIN=https://your-domain npm run content`). Both still default to the design-site origin.
- `vercel.json` sends security headers, revalidates the shell, CSS, JS and `content/` payloads, caches `/assets` for a week, and caches the bundled files in `/_app/` (their names change with every build) for a year.
- The `/challenge` page mirrors the live challenge page; its entry form is a non-submitting mockup. Entries are taken on the live form at https://verse.ctruh.com/challenge.
- The Playground (`/studio`) and `/signin` show a "Your screen is too small" gate on phones.
- Interactive elements and regions carry stable ids; see `docs/architecture.md`.
