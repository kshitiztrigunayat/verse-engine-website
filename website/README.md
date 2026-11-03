# Verse Engine website

Vite + React single-page app. Use Node.js 22 or later; run `npm ci` once.

- `npm run dev` starts the development server with live reload.
- `npm run build` builds the deployable site into `dist/` (generated, not committed); `npm start` previews it at http://127.0.0.1:4173/.
- `npm run check` validates routes, payloads, resources, syntax and JSON. With the preview running, `node tools/verify.mjs --http=http://127.0.0.1:4173` also fetches every route and a missing route.
- `npm run content` regenerates the route payloads in `public/content/`, the docs chapter list (`src/pages/docs/nav.json`), `sitemap.xml` and `robots.txt` from `source/` (set `SITE_ORIGIN=https://your-domain` for a real domain).

React code is in `src/`: pages in `src/pages/` (listed in `src/pages/index.js`), the shell in `src/Shell.jsx` and `src/components/`. Files in `public/` are served unchanged at the same paths: styles in `public/css/`, the Playground views and the GSAP/Three.js animation in `public/js/`, images and fonts in `public/assets/`, libraries in `public/vendor/`.

Deploy with the provided `vercel.json` (installs, builds and publishes `dist/`, rewrites extension-less paths to `/index.html`). The full developer handoff is in `../README.md` and `../docs/`.
