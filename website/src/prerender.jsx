// Build time only (vite.config.js): the HTML of a page whose meta has `prerender: true`, i.e. the
// shell (header, footer, menu) with the page inside, as the router would show it. It goes into the
// page's dist/<route>/index.html, so the page shows at once and crawlers that don't run JavaScript get the
// content. In the browser React takes this markup over (main.jsx, router.js prerenderedView).
import { renderToString } from "react-dom/server";
import Shell from "./Shell.jsx";
import { initialView, chromeFor, STYLES } from "./router.js";
import { PAGES } from "./pages/index.js";
import { META } from "./pages/meta.js";

/** The page's <body> markup and its stylesheets (as the router loads them). */
export async function prerender(path) {
  const page = { path, ...META[path] };
  const { default: Component } = await PAGES[path]();
  const view = { ...initialView, ...chromeFor(page), mainClass: page.mainClass || "", mainPage: { Component, props: {} } };
  return { body: renderToString(<Shell view={view} />), styles: STYLES[page.kind] || STYLES.page };
}
