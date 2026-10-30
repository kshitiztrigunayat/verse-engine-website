# Architecture and maintenance

## Stack and routing

This is a buildless static multipage site with native browser JavaScript modules. Node.js is needed only for local preview, page generation and checks. Three.js revision 180 renders the landing illustration. GSAP 3.13.0 and ScrollTrigger control its scroll story, with Lenis 1.3.11 providing desktop smooth scrolling. Libraries are vendored under `dist/vendor/`; there is no CDN dependency for the main animation.

Each route has a physical `index.html`. For example, `/pricing/` is `dist/pricing/index.html`, and `/docs/guides/publish-from-blender/` is its nested index file. Use a static host that serves directory indexes and preserves real 404 responses. Canonicals and sitemap currently reference the design-site origin.

## File ownership

| Feature | Primary files |
| --- | --- |
| Landing markup, chapter order and SVG definitions | `dist/index.html` |
| Landing timeline, chapter seeking, device selection and pause state | `dist/app.js` |
| Particle geometry and scene levels | `dist/world-data.js` |
| Point-cloud renderer, reveal shader, camera and building fit | `dist/model.js` |
| Browser to phone to headset outline interpolation | `dist/device-morph.js` |
| Possibilities gallery and example share-link copying | `dist/enhancements.js` |
| Challenge image inspector, FAQ and footer image motion | `dist/showcase.js` |
| Landing plug-in tabs and three distinct mesh illustrations | `dist/plugins.js`; SVG symbols in landing HTML |
| Landing visual layers | `dist/style.css`, `additions.css`, `refinements.css`, `showcase.css`, `plugins.css` |
| Shared page styling and final responsive overrides | `dist/site.css` |
| Shared navigation, code examples, pricing, search and About tabs | `dist/site.js` |
| Page shell, shared header/footer, Developers and About templates | `source/build-site-pages.mjs` |
| Production pricing, plug-ins, samples and documentation templates | `source/build-production-pages.mjs` |
| Main product documentation bodies | `source/production-markdown/**/*.md` |
| Public documentation renderer | `source/production-md.js` |

The landing loads its five CSS files in the order above, followed by `site.css`. Shared pages load `site.css`; plug-in pages additionally use `plugins.css`. Preserve existing selector scopes and cascade order. Several CSS files contain earlier definitions overridden later; inspect computed styles before editing a base rule.

## Generation model

Run the production generator from `website/`. It imports the base generator first, then overwrites prototype pages with finished production content. Running only the base generator can restore outdated prices or incomplete prototype articles. Its intermediate log can mention unfinished articles; the production pass replaces those routes.

The generator reads the existing `dist/index.html` to retain the landing story, SVG artwork and current branding. It also relies on CSS, JavaScript and visual assets already in `dist/`. Do not delete `dist/` before building, and do not configure a host to clean it as though it were disposable framework output. A framework migration must first separate these retained assets and the landing template from generated output.

The copied production generator includes the final publication corrections: four documentation sample links retain their published attributes, and the two sample cards that open guides retain explicit guide labels. This addition affects the handoff copy only. A rebuild was compared against the supplied runtime to check parity.

## Content inputs

| Input | Used for |
| --- | --- |
| `approved-pages.json` | Approved prototype marketing copy and initial page structure |
| `production-plans-api.json` | Captured public plans API, seats, rates, packs, FAQ and callback information |
| `production-pricing.json` | Rendered plan-comparison HTML and production pricing context |
| `production-plugins.json` | Core and AEC package metadata, requirements, checksums and install instructions |
| `production-samples.json` | Five real sample thumbnails, descriptions and supplied destinations |
| `production-docs.json` | Published navigation and captured developer examples |
| `production-markdown/` | 88 finished article bodies |

These are public-source snapshots, not a CMS. Refresh them deliberately when product content changes. Preserve the current JSON schemas, then rebuild and verify. Marketing runtime fetches only local `pricing-data.json` and `code-samples.json` for those widgets; it does not refresh product prices in the background.

## Editing recipes

**Change a landing headline:** edit the chapter in `dist/index.html`. Preserve chapter IDs, `data-chapter`, `data-jump`, tab IDs and canvas/device hooks unless updating their JavaScript too. The page generator retains this section.

**Change a shared header or footer:** edit the helpers in `source/build-site-pages.mjs`, rebuild and inspect both landing and content pages. Landing has its own richer footer in `dist/index.html`; shared footer edits do not replace it automatically. Existing SVG branding is extracted from landing markup by the base generator.

**Change a documentation article:** edit its Markdown body, rebuild and inspect headings, TOC, tables and links. Adding an article also requires a navigation entry in `production-docs.json` with its `data.page` key. A Markdown file not in that navigation is not automatically published.

**Change pricing:** update the production plans snapshot and comparison source together. Rebuild to regenerate cards and `pricing-data.json`. Confirm plan allowances, annual multiplier, extra seats, offers, usage rates and checkout URLs all agree; changing just one displayed price is insufficient.

**Release a plug-in:** update version, filename, requirement, checksum, instructions and production download target together. Rebuild. Verify download availability and compare the displayed SHA-256 to the released package. The diagram and source timing labels are presentation content, not live upload telemetry.

**Change samples:** update the sample snapshot and local image assets. Two destinations have explicit overrides in `sampleHref()` because their supplied production cards currently opened guides. Update both override and label when actual viewer destinations become available.

**Change the particle world:** change geometry in `world-data.js` and camera/reveal fitting in `model.js`; adjust the scroll mapping in `app.js` only when necessary. Recheck the table supports, interior visibility, and building centering in every device outline at desktop and phone widths. Some historical pose fields remain in `app.js`; the current renderer only consumes a subset, so changing an unused field will not affect the picture.

## Useful debugging paths

- `/?motion-off` uses the static readable story for reduced-motion review.
- `/?poster` is a retained poster capture mode, not the normal visitor experience.
- The canvas host exposes `data-vertex-count`; this is the illustration's point count, not the product triangle benchmark.
- `data-progress` and `data-scroll-progress` on the story expose its resolved chapter and scroll timeline values.

## Verse Playground (`/studio`)

Every "Explore Verse Engine" call to action links to `/studio`, a client-side workspace modelled on the production Studio: Scenes, Analytics, Webhooks, Plug-ins & API, and the three-step New scene flow (Upload, Review, Preview & Share). Sources live in `website/source/studio/` (`index.html`, `studio.css`, `studio.js`); `build-production-pages.mjs` copies them to `dist/studio/index.html`, `dist/studio.css` and `dist/studio.js` and rewrites the CTA links.

The Playground is a hash-routed single page. State (scenes, webhooks, placeholder API keys) is kept in `localStorage` under `verse-playground-v1`; files are never uploaded, webhook deliveries and exports are simulated, API keys do not authenticate, and share links resolve only in the same browser. The 3D preview is an illustrative Three.js scene, not the Verse renderer. To connect it to the production service, replace the data layer at the top of `studio.js` and the simulated actions in the `handle` function.
