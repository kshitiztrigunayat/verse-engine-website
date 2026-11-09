// Client-side router, ported 1:1 from the original public/js/router.js.
// One HTML document. Every page is a React component (src/pages/index.js) with its meta
// (title, description, body class, ...) in src/pages/meta.js; documentation pages get
// theirs, with the article, from a JSON payload in /content/ (built from source/).
// The shell (header, footer, main, ...) is React too (Shell.jsx); this module decides
// what it shows, in the same order as before. The home page also has a behaviour module
// (the GSAP + Three.js animation) that exports mount(context) -> dispose.
import { flushSync } from "react-dom";
import { PAGES } from "./pages/index.js";
import { META, docsJsonLd } from "./pages/meta.js";
import DocsPage from "./pages/docs/DocsPage.jsx";

const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const byId = (id) => document.getElementById(id);

const STYLES = {
  landing: ["/css/landing.css", "/css/site.css", "/css/landing-sections.css"],
  page: ["/css/site.css"],
  challenge: ["/css/site.css", "/css/challenge.css"],
  app: ["/css/studio.css"],
  notfound: ["/css/site.css"],
  legal: ["/css/site.css", "/css/legal.css"],
};
const MODULES = {
  "/": [() => import("./animations/landing/index.js"), () => import("./animations/landing/sections.js")],
};
const THEME_COLOR = { landing: "#f5f6f7" };
const origin = () => byId("meta-site-origin").content.replace(/\/+$/, "");

const state = { path: null, disposers: [], token: 0, payloads: new Map() };

// ---------- React view state (what the shell shows) ----------
export const initialView = {
  skipHidden: false,
  headerHidden: false,
  footerHidden: false,
  navCurrent: null,
  mainHidden: false,
  mainClass: undefined,
  // Page HTML as { __html } objects, created once per route change: React 19
  // re-applies dangerouslySetInnerHTML whenever it gets a new object, which would
  // wipe what the behaviour modules did to the page after it was inserted.
  mainHtml: { __html: "" },
  // Pages that are React components: { Component, props } (see src/pages/index.js).
  // Documentation pages are DocsPage with the payload's `docs` data.
  mainPage: null,
  standaloneHidden: true,
  standaloneClass: undefined,
  standaloneHtml: { __html: "" },
  standalonePage: null,
  announcement: "",
};
let view = initialView;
let setView = null;
export function connectView(setter) {
  setView = setter;
  return () => { setView = null; };
}
/** Apply view changes and commit them to the DOM synchronously. */
function update(changes) {
  view = { ...view, ...changes };
  flushSync(() => setView(view));
}

/** Normalise a pathname to a route key: no trailing slash except the root. */
export const routeOf = (pathname) => { const p = decodeURIComponent(pathname).replace(/\/+$/, ""); return p === "" ? "/" : p; };
const payloadUrl = (path) => "/content/" + (path === "/" ? "index" : path.slice(1).replaceAll("/", "__")) + ".json";

let manifest = null;
const knownRoutes = () => manifest ??= fetch("/content/manifest.json").then((r) => r.json()).then((list) => new Set(list.map((r) => r.path))).catch(() => null);

async function loadPayload(path) {
  const known = await knownRoutes();
  if (known && path !== "/404" && !known.has(path)) return null;
  if (META[path]) return { path, ...META[path] };
  if (!state.payloads.has(path)) {
    state.payloads.set(path, fetch(payloadUrl(path)).then((r) => {
      if (!r.ok) throw new Error("missing");
      return r.json();
    }).catch(() => (path === "/404" ? Promise.reject(new Error("no 404 payload")) : null)));
  }
  return state.payloads.get(path);
}

/** Add the stylesheets a route needs (in order) and remove the ones it no longer uses. Resolves when loaded. */
async function applyStyles(kind, key) {
  const wanted = STYLES[key] || STYLES[kind] || STYLES.page;
  const existing = new Map($$("link[data-route-style]").map((l) => [l.getAttribute("href"), l]));
  const pending = [];
  wanted.forEach((href, i) => {
    if (existing.has(href)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = href; link.dataset.routeStyle = "";
    link.id = "css-" + href.split("/").pop().replace(".css", "");
    pending.push(new Promise((resolve) => { link.onload = link.onerror = resolve; }));
    const next = wanted.slice(i + 1).map((h) => existing.get(h)).find(Boolean);
    next ? next.before(link) : document.head.appendChild(link);
    existing.set(href, link);
  });
  await Promise.all(pending);
  return () => existing.forEach((link, href) => { if (!wanted.includes(href)) link.remove(); });
}

function setMeta(payload, path) {
  document.title = payload.title;
  byId("meta-description").content = payload.description;
  const url = origin() + (path === "/" ? "/" : path);
  byId("link-canonical").href = url;
  byId("meta-og-url").content = url;
  byId("meta-og-title").content = payload.title;
  byId("meta-og-description").content = payload.ogDescription || payload.description;
  byId("meta-robots").content = payload.noindex || payload.kind === "notfound" ? "noindex,follow" : "index,follow,max-image-preview:large";
  byId("meta-theme-color").content = THEME_COLOR[payload.kind] || "#ffffff";
  byId("script-jsonld")?.remove();
  const jsonld = payload.jsonld || (path.startsWith("/docs/") ? docsJsonLd(path, payload, origin()) : null);
  if (jsonld) {
    const script = document.createElement("script");
    script.id = "script-jsonld"; script.type = "application/ld+json"; script.textContent = JSON.stringify(jsonld);
    document.head.appendChild(script);
  }
}

/** Shell visibility and current nav link for a route (was setChrome). */
function chromeFor(payload) {
  const app = payload.kind === "app";
  return {
    headerHidden: !(payload.chrome === "full" || payload.chrome === "header"),
    footerHidden: payload.chrome !== "full",
    skipHidden: app || payload.chrome === "none",
    mainHidden: app,
    standaloneHidden: !app,
    navCurrent: payload.navCurrent,
  };
}

async function leave() {
  const disposers = state.disposers.splice(0).reverse();
  for (const dispose of disposers) { try { await dispose(); } catch (error) { console.warn("dispose failed", error); } }
  update({ mainHtml: { __html: "" }, mainPage: null, standaloneHtml: { __html: "" }, standalonePage: null });
  byId("menu-dialog").open && byId("menu-dialog").close();
}

async function mountModules(payload, path) {
  const context = { path, payload };
  const tasks = [];
  for (const load of [MODULES[path] ?? []].flat()) tasks.push(load());
  for (const mod of await Promise.all(tasks)) {
    const dispose = await mod.mount(context);
    if (typeof dispose === "function") state.disposers.push(dispose);
  }
}

/** The React page for a payload, or null while the route is still payload HTML. */
function pageFor(payload) {
  if (payload.docs) return { Component: DocsPage, props: { page: { ...payload.docs, article: { __html: payload.docs.article } } } };
  return PAGES[payload.path] ? { Component: PAGES[payload.path], props: {} } : null;
}

/** Render a location. Returns true when the route rendered (false when superseded by a newer navigation). */
export async function render(href, { scroll = "top", focus = false } = {}) {
  const url = new URL(href, location.href);
  const path = routeOf(url.pathname), token = ++state.token;
  let payload = await loadPayload(path);
  if (token !== state.token) return false;
  if (!payload) { payload = await loadPayload("/404"); }
  const finishStyles = await applyStyles(payload.kind, path === "/challenge" ? "challenge" : payload.kind);
  if (token !== state.token) return false;
  await leave();
  if (token !== state.token) return false;
  document.body.className = payload.bodyClass;
  setMeta(payload, path);
  const app = payload.kind === "app";
  const page = pageFor(payload);
  update({
    ...chromeFor(payload),
    ...(app
      ? { standaloneClass: payload.mainClass || "", ...(page ? { standalonePage: page } : { standaloneHtml: { __html: payload.html } }) }
      : { mainClass: payload.mainClass || "", ...(page ? { mainPage: page } : { mainHtml: { __html: payload.html } }) }),
  });
  finishStyles();
  state.path = path;
  await mountModules(payload, path);
  if (scroll === "top") { if (url.hash && byId(decodeURIComponent(url.hash.slice(1)))) byId(decodeURIComponent(url.hash.slice(1))).scrollIntoView(); else window.scrollTo(0, 0); }
  else if (typeof scroll === "number") window.scrollTo(0, scroll);
  update({ announcement: payload.title });
  if (focus && payload.kind !== "app") byId("app-main").focus({ preventScroll: true });
  return true;
}

/** Push a new history entry and render it. */
export async function navigate(href, { replace = false, focus = true } = {}) {
  const url = new URL(href, location.href);
  history.replaceState({ ...history.state, y: scrollY }, "");
  history[replace ? "replaceState" : "pushState"]({ y: 0 }, "", url.pathname + url.search + url.hash);
  return render(url.href, { focus });
}

export function startRouter() {
  history.scrollRestoration = "manual";
  addEventListener("popstate", () => {
    // Hash-only changes (Playground sub-routes, in-page anchors) stay on the current route.
    if (routeOf(location.pathname) === state.path) return;
    render(location.href, { scroll: history.state?.y ?? 0 });
  });
  document.addEventListener("verse:navigate", (e) => navigate(e.detail.href, { replace: !!e.detail.replace, focus: false }));
  return render(location.href, { scroll: "top" });
}
