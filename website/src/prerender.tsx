// Build time only (vite.config.ts): the HTML of a page whose meta has `prerender: true`, i.e. the shell (header,
// footer, menu) with the page inside, exactly as the app first shows it (src/routes.ts shellView). It goes into the
// page's dist/<route>/index.html, so the page shows at once and crawlers that don't run JavaScript get the
// content. In the browser React takes this markup over (main.tsx).
import { renderToString } from "react-dom/server";
import Shell from "./Shell.tsx";
import { META } from "./pages/meta.ts";
import { loadPage, shellView, stylesFor } from "./routes.ts";

/** The page's <body> markup and its stylesheets (as the app loads them). */
export async function prerender(path: string) {
  const payload = { path, ...META[path] };
  const Component = await loadPage(path);
  return { body: renderToString(<Shell view={shellView(payload, true, <Component />)} />), styles: stylesFor(path, payload.kind) };
}
