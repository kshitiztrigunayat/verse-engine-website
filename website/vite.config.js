import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import pkg from "./package.json" with { type: "json" };
import { META } from "./src/pages/meta.js";

// The site's public address, set once in package.json ("config": { "siteUrl" }). index.html uses
// %SITE_URL% for the canonical link, og:url, og:image and the site-origin tag the router builds them from.
const siteUrl = pkg.config.siteUrl.replace(/\/+$/, "");
const siteUrlInHtml = { name: "site-url", transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl) };

// Link previews (WhatsApp, LinkedIn, Slack) do not run JavaScript, so each page's OG and Twitter tags must be in
// its HTML. After the build, write dist/<page>/index.html (and update dist/index.html) with that page's tags.
// A tag that is in index.html is updated; a missing one is added before </head>.
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
  writeBundle({ dir }) {
    const shell = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    for (const { path: route } of JSON.parse(fs.readFileSync("public/content/manifest.json", "utf8"))) {
      const page = META[route] ?? JSON.parse(fs.readFileSync(`public/content/${route.slice(1).replaceAll("/", "__")}.json`, "utf8"));
      let html = shell;
      for (const [attr, key, value] of [
        ["property", "og:title", page.title],
        ["property", "og:description", page.ogDescription || page.description],
        ["property", "og:url", siteUrl + route],
        ["property", "og:site_name", "Verse Engine by Ctruh"],
        ["property", "og:image", siteUrl + "/assets/og/verse-engine-by-ctruh-1200x630.jpg"],
        ["name", "twitter:card", "summary_large_image"],
      ]) html = setTag(html, attr, key, value);
      fs.mkdirSync(path.join(dir, route), { recursive: true });
      fs.writeFileSync(path.join(dir, route, "index.html"), html);
    }
  },
};

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
