# Page sources

From the project root, run `node source/build-production-pages.mjs` to rebuild the pages. Existing CSS, JS and visual assets stay in dist. The generator preserves the landing-page particle story and creates the production-backed pricing, plug-ins, sample catalog and documentation.

The JSON and Markdown were captured from the public product sites supplied by the user on 2026-10-29/30. `production-md.js` is the product’s published dependency-free Markdown renderer, reused for matching article formatting. Pricing is a verified snapshot; refresh it from the public production plans endpoint when prices change. Download links and checkout stay on verse.ctruh.com.
