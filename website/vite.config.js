import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
