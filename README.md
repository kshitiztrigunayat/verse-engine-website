# Verse Engine website developer handoff

Prepared 30 October 2026. This package contains the responsive marketing website, its editable page generators and captured content, visual references, and instructions for maintenance and release. The `website/dist/` directory is the deployable website. It is a static marketing and documentation frontend; the live Verse service continues to handle accounts, scene publishing and payments.

Reference website: https://verse-engine-ctruh-design.rajat83.chatgpt.site/

## Start here

1. Extract the full archive. Open a terminal in `website/`.
2. Use Node.js 22 or later. This handoff was checked with Node.js 24.19.0.
3. Run `node preview-server.mjs` and open http://127.0.0.1:4173/.
4. Run `node tools/verify.mjs` to check local resources, JavaScript syntax and JSON.
5. To regenerate pages after content edits, run `node source/build-production-pages.mjs` from `website/`, then run verification again.

No dependency installation, API key, framework build or database is required. Serve the site over HTTP; opening HTML with `file://` will prevent modules and fetched JSON from working correctly. Optional `npm start`, `npm run build` and `npm run check` shortcuts are included; there are no npm dependencies.

## Package map

| Location | Purpose |
| --- | --- |
| `website/dist/` | Complete deployable HTML, CSS, JavaScript, fonts, images and vendored libraries |
| `website/source/` | Editable page generators, public content snapshots and 88 documentation Markdown files |
| `website/preview-server.mjs` | Local preview server, bound to 127.0.0.1:4173; not a production server |
| `website/tools/verify.mjs` | Repeatable local resource, syntax, JSON and optional HTTP checks |
| `docs/architecture.md` | Page ownership, generation, source mapping and maintenance recipes |
| `docs/design-and-motion.md` | Design tokens, responsive behavior and interaction contracts |
| `docs/integrations-and-release.md` | Production handoffs, limitations and release checklist |
| `reference/` | Route list, runtime checksums, external-link inventory, QA report and screenshot references |

## Delivered scope

The website has 112 index routes, including Home, Developers, Pricing, Plug-ins, three core plug-in installation guides, About, Samples, 88 production documentation articles, an introductory overview and retained article aliases. All routes are listed in `reference/routes.json`. This count includes aliases and entry routes; it does not mean 112 unique articles.

The landing page keeps the approved sequence: particle-world story; possibilities; Take the Challenge; the three-step publishing workflow; plug-in workbench; FAQ; footer. The opening story progressively reveals an object, table, interior, building and neighbourhood. Its experience chapter changes between browser, phone and headset outlines.

## Deploying to Vercel

The site is fully static: deploy `website/dist/`. `vercel.json` (repo root) and `website/vercel.json` set the output directory, so either Root Directory (repo root or `website`) works; set Framework Preset to "Other". The local preview server is named `preview-server.mjs` on purpose: a file called `server.mjs` makes Vercel treat the project as a Node server and every request, static files included, fails with `500 FUNCTION_INVOCATION_FAILED`.

## Read before changing the site

- Retain approved product copy and the existing page sequence. Pricing, plug-in releases, documentation and sample destinations use the production snapshots supplied by the owner; product values are snapshots rather than a live sync.
- Keep Degular headings and Metropolis body text. Use blue actions and highlights, light section surfaces, and white text on blue chapters. Keep the hero text dark on white.
- The particle story is a custom illustrative Three.js scene. It is not the Verse rendering engine, a user-uploaded scene, or a measurement of the product's billion-triangle claims.
- Account, checkout, callback, challenge and actual viewer journeys leave this frontend for the production service. Do not replace these with simulated success states.
- About's unfinished company-story and team-photo blocks stay hidden, as requested by the owner.
- Keep all assets, fonts and `vendor/` files at their current paths. URLs are rooted at `/`; hosting below a subdirectory requires coordinated path changes.

## Current implementation status

The packaged runtime matches the existing local published checkout byte for byte. The handoff adds developer documentation, verification tooling and package command shortcuts outside the runtime. It also preserves five small final publication corrections in the copied page generator so regeneration keeps the published output. The existing hosted website has not been changed by preparing this package.

Source provenance: public product content captured on 29–30 October 2026 from the owner's supplied Vercel prototype and `verse.ctruh.com`. The handoff contains no Git history, hosting credentials or environment secrets. External endpoints are recorded in `reference/external-links.json`.

## First developer review

Read `docs/architecture.md`, then `docs/design-and-motion.md`. Use `docs/integrations-and-release.md` to validate production destinations before launch. The runtime manifest and QA report establish the package baseline; screenshot references illustrate prior visual checks and are not interactive specifications.
