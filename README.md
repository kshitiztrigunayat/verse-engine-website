# Verse Engine website developer handoff

Prepared 30 October 2026. This package contains the responsive marketing website, delivered as a single-page app (one `index.html` plus a client-side router), its editable page generators and captured content, visual references, and instructions for maintenance and release. The `website/dist/` directory is the deployable website. It is a static marketing and documentation frontend; the live Verse service continues to handle accounts, scene publishing and payments.

Reference website: https://verse-engine-ctruh-design.rajat83.chatgpt.site/

## Start here

1. Extract the full archive. Open a terminal in `website/`.
2. Use Node.js 22 or later.
3. Run `npm run build` to regenerate `dist/index.html` and `dist/content/` from the sources (`SITE_ORIGIN=https://your-domain npm run build` for a real domain).
4. Run `node preview-server.mjs` and open http://127.0.0.1:4173/. The preview server falls back to `index.html` for extension-less paths, like the production rewrite.
5. Run `node tools/verify.mjs` (and `--http=http://127.0.0.1:4173` with the server running) to check routes, payloads, links, ids, resources and JavaScript syntax.

No dependency installation, API key, framework build or database is required. Serve the site over HTTP; opening `index.html` with `file://` will not work.

## Package map

| Location | Purpose |
| --- | --- |
| `website/dist/` | Deployable app: shell `index.html`, generated `content/` payloads, `css/`, `js/`, fonts, images and vendored libraries |
| `website/source/` | Build scripts, templates, page generators, public content snapshots and 88 documentation Markdown files |
| `website/preview-server.mjs` | Local preview server, bound to 127.0.0.1:4173; not a production server |
| `website/tools/verify.mjs` | Repeatable local resource, syntax, JSON and optional HTTP checks |
| `docs/architecture.md` | Page ownership, generation, source mapping and maintenance recipes |
| `docs/design-and-motion.md` | Design tokens, responsive behavior and interaction contracts |
| `docs/integrations-and-release.md` | Production handoffs, limitations and release checklist |
| `reference/` | Route list, external-link inventory and screenshot references (`runtime-manifest.json` and `handoff-qa.json` describe the earlier multipage build and are historical) |

## Delivered scope

The app has 115 routes, including Home, Developers, Pricing, Plug-ins, three core plug-in installation guides, About, Samples, Challenge, the Playground and sign-in, 88 production documentation articles, an introductory overview and retained article aliases. All routes are listed in `dist/content/manifest.json` and `reference/routes.json`.

The landing page keeps the approved sequence: particle-world story; possibilities; Take the Challenge; the three-step publishing workflow; plug-in workbench; FAQ; footer. The opening story progressively reveals an object, table, interior, building and neighbourhood. Its experience chapter changes between browser, phone and headset outlines.

## Deploying to Vercel

Deploy `website/dist/`. `vercel.json` (repo root) and `website/vercel.json` set the output directory, the rewrite of extension-less paths to `/index.html`, security headers and cache rules, so either Root Directory (repo root or `website`) works; set Framework Preset to "Other". The local preview server is named `preview-server.mjs` on purpose: a file called `server.mjs` makes Vercel treat the project as a Node server and every request fails with `500 FUNCTION_INVOCATION_FAILED`.

## Read before changing the site

- Retain approved product copy and the existing page sequence. Pricing, plug-in releases, documentation and sample destinations use the production snapshots supplied by the owner; product values are snapshots rather than a live sync.
- Keep Degular headings and Metropolis body text. Use blue actions and highlights, light section surfaces, and white text on blue chapters. Keep the hero text dark on white.
- The particle story is a custom illustrative Three.js scene. It is not the Verse rendering engine, a user-uploaded scene, or a measurement of the product's billion-triangle claims.
- Account, checkout, callback, challenge and actual viewer journeys leave this frontend for the production service. Do not replace these with simulated success states.
- About's unfinished company-story and team-photo blocks stay hidden, as requested by the owner.
- Keep all assets, fonts and `vendor/` files at their current paths. URLs are rooted at `/`; hosting below a subdirectory requires coordinated path changes. Do not edit `dist/index.html` or `dist/content/` by hand; they are generated.

## Current implementation status

The packaged runtime matches the existing local published checkout byte for byte. The handoff adds developer documentation, verification tooling and package command shortcuts outside the runtime. It also preserves five small final publication corrections in the copied page generator so regeneration keeps the published output. The existing hosted website has not been changed by preparing this package.

Source provenance: public product content captured on 29–30 October 2026 from the owner's supplied Vercel prototype and `verse.ctruh.com`. The handoff contains no Git history, hosting credentials or environment secrets. External endpoints are recorded in `reference/external-links.json`.

## First developer review

Read `docs/architecture.md`, then `docs/design-and-motion.md`. Use `docs/integrations-and-release.md` to validate production destinations before launch. The runtime manifest and QA report establish the package baseline; screenshot references illustrate prior visual checks and are not interactive specifications.

## Production release notes

- Per-route titles, unique descriptions, canonicals, Open Graph URLs and `noindex` for `/studio` and `/signin` are applied by the router from each route payload. Set the real domain with `SITE_ORIGIN` at build time; the default is still the design-site origin.
- `vercel.json` sends security headers, revalidates the shell, CSS, JS and content, and caches `/assets` and `/vendor` for a week.
- The `/challenge` page mirrors the live challenge page; its entry form is a non-submitting mockup. Entries are taken on the live form at https://verse.ctruh.com/challenge.
- The Playground (`/studio`) and `/signin` show a "Your screen is too small" gate on phones.
- Interactive elements and regions carry stable ids; see `docs/architecture.md`.
