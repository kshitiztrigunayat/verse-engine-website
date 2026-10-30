# Verse Engine website

Run `node server.mjs` and open http://127.0.0.1:4173/. No install is required.

- `node source/build-production-pages.mjs` regenerates pages from the captured content and templates.
- `node tools/verify.mjs` validates resources, syntax and JSON.
- With the local server running, `node tools/verify.mjs --http=http://127.0.0.1:4173` also checks every generated index route and a missing route.
- Deploy the contents of `dist/` with nested directory index routing. Do not use an all-paths-to-homepage SPA fallback.

The full developer handoff is in `../README.md` and `../docs/`. `dist/` is a complete asset-bearing source tree as well as the deployable output; preserve it when rebuilding. The landing HTML and the CSS/JS/visual assets are not regenerated from scratch.
