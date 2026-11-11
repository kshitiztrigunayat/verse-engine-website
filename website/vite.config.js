import { createServer, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import pkg from "./package.json" with { type: "json" };
import { META, OG_DEFAULT, docsJsonLd } from "./src/pages/meta.js";

// The site's public address, set once in package.json ("config": { "siteUrl" }). index.html uses
// %SITE_URL% for the canonical link, og:url, og:image and the site-origin tag the router builds them from.
const siteUrl = pkg.config.siteUrl.replace(/\/+$/, "");
const siteUrlInHtml = { name: "site-url", transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl) };

// Link previews (WhatsApp, LinkedIn, Slack) do not run JavaScript, so each page's OG and Twitter tags must be in
// its HTML. After the build, write dist/<page>/index.html (and update dist/index.html) with that page's tags.
// A tag that is in index.html is updated; a missing one is added before </head>.
// Every page gets its own canonical in that HTML (SEO blueprint, Part D). Pages with `staticHead` (meta.js) also get
// their own title, description and robots; other noindex pages (e.g. /signin) get their robots tag. Pages with
// `prerender` also get their content, stylesheets and structured data (SEO blueprint, Part E).
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
function setTag(html, attr, key, value) {
  const tag = new RegExp(`<meta\\b[^>]*\\b${attr}="${key}"[^>]*>`);
  const content = `content="${esc(value)}"`;
  if (tag.test(html)) return html.replace(tag, (t) => (/\bcontent="[^"]*"/.test(t) ? t.replace(/\bcontent="[^"]*"/, () => content) : t.replace(/\s*\/?>$/, () => ` ${content}>`)));
  return html.replace("</head>", () => `<meta ${attr}="${key}" ${content}>\n</head>`);
}
const pageSocialTags = {
  name: "page-social-tags",
  apply: "build",
  async writeBundle({ dir }) {
    const shell = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    const prerender = await loadPrerender();
    for (const { path: route } of JSON.parse(fs.readFileSync("public/content/manifest.json", "utf8"))) {
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
      if (page.prerender) html = prerendered(html, page, prerender(route));
      const head = [[CANONICAL, siteUrl + route]];
      if (page.staticHead) head.push([TITLE, page.title], [DESCRIPTION, page.description]);
      if (page.staticHead || page.noindex) head.push([ROBOTS, page.noindex ? "noindex,follow" : "index,follow,max-image-preview:large"]);
      html = setHead(html, route, head);
      fs.mkdirSync(path.join(dir, route), { recursive: true });
      fs.writeFileSync(path.join(dir, route, "index.html"), html);
    }
  },
};

// A prerendered page: its stylesheets (and React's preloads, e.g. the hero image) in <head>, its content in <body>
// in place of the "needs JavaScript" notice, and shown without JavaScript (index.html hides the page until the app
// is ready). With JavaScript, React renders the page as before (main.jsx), replacing this markup.
function prerendered(html, page, { body, styles }) {
  const preloads = body.match(/^(?:<link [^>]*\/>)*/)[0];
  const links = styles.map((href) => `<link rel="stylesheet" href="${href}" data-route-style id="css-${path.basename(href, ".css")}">`).join("\n");
  const noJs = "<noscript><style>html:not(.app-ready) body{visibility:visible}</style></noscript>";
  const notice = html.match(/<body id="app-body">\s*([\s\S]*?)\s*<\/body>/)[1]; // also rendered by Shell.jsx
  return html
    .replace("</head>", () => `${links}\n${preloads}${noJs}\n</head>`)
    .replace(/<body id="app-body">[\s\S]*<\/body>/, () => `<body id="app-body" class="${esc(page.bodyClass)}">${body.slice(preloads.length).replace(notice, "")}</body>`); // the class the router sets
}

// src/prerender.jsx, loaded through Vite (JSX) only when a page needs it.
async function loadPrerender() {
  if (!Object.values(META).some((m) => m.prerender)) return null;
  const server = await createServer({ configFile: false, root: process.cwd(), plugins: [react()], logLevel: "error", server: { middlewareMode: true, hmr: false }, appType: "custom", optimizeDeps: { noDiscovery: true } });
  try { return (await server.ssrLoadModule("/src/prerender.jsx")).prerender; } finally { await server.close(); }
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

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrlInHtml, pageSocialTags],
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
