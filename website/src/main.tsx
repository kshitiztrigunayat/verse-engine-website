// App entry: React renders the shell into <body> (App.tsx, React Router). A prerendered page's HTML already shows
// it (vite.config.ts, src/prerender.tsx), so its page code is loaded first and React takes that markup over
// (hydrate) instead of rendering it again.
import { createRoot, hydrateRoot } from "react-dom/client";
import "./tailwind.css";
import App from "./App.tsx";
import { META } from "./pages/meta.ts";
import { loadPage, routeOf } from "./routes.ts";

const path = routeOf(location.pathname);
if (document.documentElement.classList.contains("prerendered") && META[path]?.prerender) {
  await loadPage(path);
  hydrateRoot(document.body, <App />);
} else {
  createRoot(document.body).render(<App />);
}
