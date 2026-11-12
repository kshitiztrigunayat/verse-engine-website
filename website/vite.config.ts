import { createServer, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pkg from "./package.json" with { type: "json" };
import { META, OG_DEFAULT, docsJsonLd } from "./src/pages/meta.ts";

// The site's public address, set once in package.json ("config": { "siteUrl" }). index.html uses
// %SITE_URL% for the canonical link, og:url, og:image and the site-origin tag the router builds them from.
const siteUrl = pkg.config.siteUrl.replace(/\/+$/, "");
const siteUrlInHtml = { name: "site-url", transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl) };

// Link previews (WhatsApp, LinkedIn, Slack) do not run JavaScript, so each page's OG and Twitter tags must be in
// its HTML. After the build, write dist/<page>/index.html (and update dist/index.html) with that page's tags.
// A tag that is in index.html is updated; a missing one is added before </head>.
// Every page also gets its own title, description, robots and canonical in that HTML, as the router sets them (SEO
// blueprint, Parts C and D). Pages with `prerender` also get their content, stylesheets and structured data (Part E).
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
function setTag(html, attr, key, value) {
  const tag = new RegExp(`<meta\\b[^>]*\\b${attr}="${key}"[^>]*>`);
  const content = `content="${esc(value)}"`;
  if (tag.test(html)) return html.replace(tag, (t) => (/\bcontent="[^"]*"/.test(t) ? t.replace(/\bcontent="[^"]*"/, () => content) : t.replace(/\s*\/?>$/, () => ` ${content}>`)));
  return html.replace("</head>", () => `<meta ${attr}="${key}" ${content}>\n</head>`);
}
const pageSocialTags = {
  name: "page-social-tags",
  apply: "build" as const,
  async writeBundle({ dir }) {
    const shell = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    const ssr = await loadPrerender();
    try { for (const { path: route } of JSON.parse(fs.readFileSync("public/content/manifest.json", "utf8"))) {
      const page = META[route] ?? JSON.parse(fs.readFileSync(`public/content/${route.slice(1).replaceAll("/", "__")}.json`, "utf8"));
      let html = shell;
      for (const [attr, key, value] of [
        ["property", "og:title", page.ogTitle || page.title],
        ["property", "og:description", page.ogDescription || page.description],
        ["property", "og:url", siteUrl + route],
        ["property", "og:site_name", "Verse Engine by Ctruh"],
        ["property", "og:image", siteUrl + (page.ogImage || OG_DEFAULT.ogImage)],
        ["property", "og:image:alt", page.ogImage ? "" : OG_DEFAULT.ogImageAlt], // the default description fits only the default image
        ["name", "twitter:card", "summary_large_image"],
        ["name", "twitter:title", page.ogTitle || page.title], // Twitter / X cards, as the SEO blueprint's own build (Part F)
        ["name", "twitter:description", page.ogDescription || page.description],
        ["name", "twitter:image", siteUrl + (page.ogImage || OG_DEFAULT.ogImage)],
      ]) html = setTag(html, attr, key, value);
      if (route !== "/") html = html.replace(/<script id="script-jsonld"[\s\S]*?<\/script>\n?/, ""); // home page only
      const jsonld = route.startsWith("/docs/") ? docsJsonLd(route, page, siteUrl) : page.prerender ? page.jsonld : null;
      if (jsonld) html = html.replace("</head>", () => `<script id="script-jsonld" type="application/ld+json">${JSON.stringify(jsonld).replaceAll("<", "\\u003c")}</script>\n</head>`);
      if (page.prerender) html = prerendered(html, page, await ssr.prerender(route));
      html = setHead(html, route, [
        [TITLE, page.title],
        [DESCRIPTION, page.description],
        [ROBOTS, page.noindex ? "noindex,follow" : "index,follow,max-image-preview:large"],
        [CANONICAL, siteUrl + route],
      ]);
      fs.mkdirSync(path.join(dir, route), { recursive: true });
      fs.writeFileSync(path.join(dir, route, "index.html"), html);
    } } finally { await ssr?.close(); }
  },
};

// A prerendered page: marked "prerendered" on <html> (index.html then shows it at once, without the intro), its
// stylesheets (and React's preloads, e.g. the hero image) in <head>, its content in <body>. Without JavaScript the
// "needs JavaScript" notice is hidden: the page is there. With JavaScript, React takes this markup over (main.jsx).
function prerendered(html, page, { body, styles }) {
  const preloads = body.match(/^(?:<link [^>]*\/>)*/)[0];
  const links = styles.map((href) => `<link rel="stylesheet" href="${href}" data-route-style id="css-${path.basename(href, ".css")}">`).join("\n");
  const noJs = "<noscript><style>body>noscript{display:none}</style></noscript>";
  return html
    .replace("<html ", '<html class="prerendered" ')
    .replace("</head>", () => `${links}\n${preloads}${noJs}\n</head>`)
    // the class the router sets; nothing after </body>: the browser would add that whitespace to <body>, which React does not expect
    .replace(/<body id="app-body">[\s\S]*$/, () => `<body id="app-body" class="${esc(page.bodyClass)}">${body.slice(preloads.length)}</body></html>`);
}

// src/prerender.tsx, loaded through Vite (JSX) only when a page needs it. The server stays open until close(), as
// prerender() loads each page's code on demand.
async function loadPrerender() {
  if (!Object.values(META).some((m) => m.prerender)) return null;
  const server = await createServer({ configFile: false, root: process.cwd(), plugins: [react()], logLevel: "error", server: { middlewareMode: true, hmr: false }, appType: "custom", optimizeDeps: { noDiscovery: true } });
  return { prerender: (await server.ssrLoadModule("/src/prerender.tsx")).prerender, close: () => server.close() };
}

// The <head> tags the router sets in the browser; setHead writes them into a page's HTML.
const TITLE = /(<title id="doc-title">)[^<]*(<\/title>)/;
const DESCRIPTION = /(<meta id="meta-description" name="description" content=")[^"]*(")/;
const ROBOTS = /(<meta id="meta-robots" name="robots" content=")[^"]*(")/;
const CANONICAL = /(<link id="link-canonical" rel="canonical" href=")[^"]*(")/;
function setHead(html, route, tags) {
  for (const [re, value] of tags) {
    if (!re.test(html)) throw new Error(`${route}: ${re} not found in index.html`);
    html = html.replace(re, (_, open, close) => open + esc(value) + close);
  }
  return html;
}

// Static assets cached for a year (SEO blueprint, Part F). Each image, font and video in /assets/ gets a copy under
// /assets/_h/ named by its content hash (vercel.json caches that folder for a year), and the HTML <head>, stylesheets,
// page payloads and behaviour scripts point at the copies. The originals stay (7-day cache), so old links keep working,
// and so does what is not rewritten: the bundled React code (its file names are fixed before this step) and the
// prerendered page bodies with their image preloads (React takes that markup over as it is).
const VERSIONED = /\.(webp|jpe?g|png|svg|woff2?|otf|mp4)$/;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const assetVersions = {
  name: "asset-versions",
  apply: "build" as const,
  writeBundle: {
    sequential: true, // after page-social-tags has written every page's HTML
    handler({ dir }) {
      const assets = path.join(dir, "assets"), copies = new Map();
      for (const file of walk(assets).filter((f) => VERSIONED.test(f))) {
        const rel = path.relative(assets, file).split(path.sep).join("/");
        const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
        const copy = "_h/" + rel.replace(/(\.[^.]+)$/, `.${hash}$1`);
        fs.mkdirSync(path.dirname(path.join(assets, copy)), { recursive: true });
        fs.copyFileSync(file, path.join(assets, copy));
        copies.set(rel, copy);
      }
      const names = [...copies.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const re = new RegExp(`/assets/(${names.join("|")})(?![\\w.-])`, "g");
      const swap = (text) => text.replace(re, (_, rel) => "/assets/" + copies.get(rel));
      for (const file of walk(dir)) {
        if (file.startsWith(assets + path.sep) || file.includes(`${path.sep}_app${path.sep}`) || !/\.(html|css|json|js)$/.test(file)) continue;
        let text = fs.readFileSync(file, "utf8");
        if (file.endsWith(".html")) {
          const end = text.indexOf("</head>"); // head only, image preloads left as they are
          text = text.slice(0, end).replace(/<link\b[^>]*>|[^<]+|</g, (part) => (/\bas="image"/.test(part) ? part : swap(part))) + text.slice(end);
        } else text = swap(text);
        fs.writeFileSync(file, text);
      }
    },
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrlInHtml, pageSocialTags, assetVersions],
  // public/ holds the site as it was: css, js behaviour modules, content
  // payloads, assets and vendor libraries, served unchanged at the same paths.
  // Only index.html is an app entry (source/templates/*.html are content-build templates).
  optimizeDeps: { entries: ["index.html"] },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "_app", // bundled React code; keeps /assets/ for site images and fonts
    target: "es2022", // top-level await, like the original module entry
  },
});
