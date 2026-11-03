import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import pkg from "./package.json" with { type: "json" };

// The site's public address, set once in package.json ("config": { "siteUrl" }). index.html uses
// %SITE_URL% for the canonical link, og:url, og:image and the site-origin tag the router builds them from.
const siteUrl = pkg.config.siteUrl.replace(/\/+$/, "");
const siteUrlInHtml = { name: "site-url", transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl) };

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrlInHtml],
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
