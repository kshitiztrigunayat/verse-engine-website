// Build time only (vite.config.js): the HTML of a page whose meta has `prerender: true`, i.e. the
// shell (header, footer, menu) with the page inside, as the router would show it. It goes into the
// page's dist/<route>/index.html so crawlers that don't run JavaScript get the content. In the
// browser nothing changes: React renders the page as before (main.jsx), replacing this markup.
import { renderToString } from "react-dom/server";
import Shell from "./Shell.jsx";
import { initialView, chromeFor, STYLES } from "./router.js";
import { PAGES } from "./pages/index.js";
import { META } from "./pages/meta.js";

/** The page's <body> markup and its stylesheets (as the router loads them). */
export function prerender(path) {
  const page = { path, ...META[path] };
  const view = { ...initialView, ...chromeFor(page), mainClass: page.mainClass || "", mainPage: { Component: PAGES[path], props: {} } };
  return { body: renderToString(<Shell view={view} />), styles: STYLES[page.kind] || STYLES.page };
}
