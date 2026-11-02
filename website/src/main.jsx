// App entry (was public/js/main.js): render the React shell (incl. the menu), then router,
// link interception and the page transition, in the same order as before.
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import "./tailwind.css";
import App from "./App.jsx";
import { startRouter, navigate } from "./router.js";

// Behaviour modules stay in public/js, unchanged; load them at runtime.
const load = (src) => import(/* @vite-ignore */ src);
const { playIntro, transitionTo } = await load("/js/transition.js");

const NON_PAGE = /\.(zip|tgz|rbz|pdf|json|xml|txt|mp4|png|jpe?g|webp|svg|glb|otf|woff2?)$/i;
const DOCS_NAV = "#nav-docs, .docs-sidebar, .docs-mobile, .docs-nav-content";

function onLinkClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.("a[href]");
  if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
  let url; try { url = new URL(link.href, location.href); } catch { return; }
  if (url.origin !== location.origin || NON_PAGE.test(url.pathname)) return; // other sites (billing, privacy, terms, ...) open normally
  if (url.pathname === location.pathname && url.search === location.search) return; // same page: hash jumps stay native
  event.preventDefault();
  // Moving around inside the documentation is plain navigation, without the transition.
  if (link.closest(DOCS_NAV)) { navigate(url.href); return; }
  transitionTo(() => navigate(url.href));
}

// The shell is the whole <body> (as in the original single HTML document).
const root = createRoot(document.body);
flushSync(() => root.render(<App />));

document.addEventListener("click", onLinkClick, true);
await startRouter();
document.documentElement.classList.add("app-ready");
playIntro();
