# Content sources

Run `npm run content` (from `website/`) to rebuild the generated content: the documentation payloads in `public/content/` (each article with its title and description) and the route list, the docs chapter list `src/pages/docs/nav.json`, `sitemap.xml` and `robots.txt`. The other pages' text is in their React components in `src/pages/`, and their titles and descriptions in `src/pages/meta.ts`; the CSS and visual assets in `public/` are not generated.

The JSON and Markdown were captured from the public product sites supplied by the user on 2026-10-29/30. `production-md.ts` is the product’s published dependency-free Markdown renderer, reused for matching article formatting. Pricing is a verified snapshot; refresh it from the public production plans endpoint when prices change. Download links and checkout stay on verse.ctruh.com.
