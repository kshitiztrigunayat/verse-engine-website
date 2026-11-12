// The app: React Router renders every route into the shell (Shell.tsx). For each route it loads the route's data
// (meta from src/pages/meta.ts, or the documentation payload), its stylesheets and its page code (src/routes.ts),
// then shows the page, sets <head> (title, description, canonical, social card, robots, JSON-LD), mounts the
// route's behaviour modules and handles scroll, focus and the page transition. A prerendered page (vite.config.ts)
// is already on screen on first load: React takes its markup over (main.tsx) and shows the same view at once.
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import type { ComponentType } from "react";
import Shell from "./Shell.tsx";
import { META, OG_DEFAULT, docsJsonLd } from "./pages/meta.ts";
import DocsPage from "./pages/docs/DocsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { playIntro, transitionTo } from "./animations/transition.ts";
import { hasPage, loadPage, loadedPage, routeOf, shellView, stylesFor } from "./routes.ts";
import type { RoutePayload } from "./routes.ts";

const NON_PAGE = /\.(zip|tgz|rbz|pdf|json|xml|txt|mp4|png|jpe?g|webp|svg|glb|otf|woff2?)$/i;
const DOCS_NAV = "#nav-docs, .docs-sidebar, .docs-mobile, .docs-nav-content";
const NOT_FOUND = META["/404"];
const THEME_COLOR: Record<string, string> = { landing: "#f5f6f7" };
// A route's behaviour modules (GSAP, Three.js), mounted on its markup once it shows: mount() -> dispose.
const MODULES: Record<string, (() => Promise<{ mount: () => unknown }>)[]> = {
  "/": [() => import("./animations/landing/index.ts"), () => import("./animations/landing/sections.ts")],
};
// A link click moves focus to the new page once it shows (navigation from code and Back/Forward do not).
let focusNext = false;

/** The route's data: its meta at once, or its documentation payload once fetched (null until then). */
function useRoutePayload(pathname: string): RoutePayload | null {
  const meta = META[pathname];
  const metaPayload = useMemo(() => (meta ? { path: pathname, ...meta } : null), [pathname, meta]);
  const [loaded, setLoaded] = useState<{ pathname: string; payload: RoutePayload } | null>(null);
  useEffect(() => {
    if (meta) return undefined;
    let active = true;
    const payloadUrl = `/content/${pathname === "/" ? "index" : pathname.slice(1).replaceAll("/", "__")}.json`;
    fetch(payloadUrl).then((response) => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Route content request failed (${response.status}): ${pathname}`);
      return response.json() as Promise<RoutePayload>;
    }).then((data) => {
      if (active) setLoaded({ pathname, payload: data || { path: pathname, ...NOT_FOUND } });
    }).catch((error: unknown) => {
      if (!active) return;
      console.error(`Unable to load route content for ${pathname}.`, error);
      setLoaded({ pathname, payload: { path: pathname, ...NOT_FOUND } });
    });
    return () => { active = false; };
  }, [pathname, meta]);
  return metaPayload || (loaded?.pathname === pathname ? loaded.payload : null);
}

/** True once the route's stylesheets are in place (at once when they already are, e.g. in a prerendered page). */
function useRouteStyles(pathname: string, kind?: string): boolean {
  const key = `${pathname}:${kind || "page"}`;
  const [loadedKey, setLoadedKey] = useState(() => (
    typeof document !== "undefined" && stylesFor(pathname, kind).every((href) => document.querySelector(`link[data-route-style][href="${href}"]`)) ? key : ""
  ));
  useEffect(() => {
    let active = true;
    const styles = stylesFor(pathname, kind);
    const existing = new Map([...document.querySelectorAll<HTMLLinkElement>("link[data-route-style]")].map((link) => [link.href, link]));
    const pending: Promise<void>[] = [];
    styles.forEach((href, index) => {
      const absolute = new URL(href, window.location.origin).href;
      let link = existing.get(absolute);
      if (!link) {
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.routeStyle = "";
        link.id = `css-${href.split("/").pop()?.replace(".css", "")}`;
        pending.push(new Promise((resolve) => {
          link!.onload = () => resolve();
          link!.onerror = () => {
            console.error(`Unable to load route stylesheet: ${href}`);
            resolve();
          };
        }));
        existing.set(absolute, link);
      }
      const next = styles.slice(index + 1)
        .map((path) => existing.get(new URL(path, window.location.origin).href))
        .find((candidate) => candidate?.isConnected);
      if (!link.isConnected) {
        if (next) next.before(link);
        else document.head.appendChild(link);
      }
    });
    Promise.all(pending).then(() => {
      if (!active) return;
      for (const [href, link] of existing) {
        if (!styles.some((path) => new URL(path, window.location.origin).href === href)) link.remove();
      }
      setLoadedKey(key);
    });
    return () => { active = false; };
  }, [key, pathname, kind]);
  return loadedKey === key;
}

/** The route's React page: its code is loaded on demand (at once when already loaded). */
function useRoutePage(payload: RoutePayload | null): { ready: boolean; Component?: ComponentType } {
  const path = payload && !payload.docs && hasPage(payload.path) ? payload.path : null;
  const [, setLoadedPath] = useState<string | null>(null);
  const Component = path ? loadedPage(path) : undefined;
  useEffect(() => {
    if (!path || loadedPage(path)) return undefined;
    let active = true;
    loadPage(path).then(() => { if (active) setLoadedPath(path); }).catch((error: unknown) => console.error(`Unable to load the page ${path}.`, error));
    return () => { active = false; };
  }, [path]);
  return { ready: !!payload && (!path || !!Component), Component };
}

function RouteContent({ payload, Component }: { payload: RoutePayload | null; Component?: ComponentType }) {
  if (!payload) return <NotFound />;
  if (payload.docs) return <DocsPage page={{ ...payload.docs, article: payload.docs.article }} />;
  return Component ? <Component /> : <NotFound />;
}

function RouteEffects({ payload, pathname, ready }: { payload: RoutePayload | null; pathname: string; ready: boolean }) {
  useEffect(() => {
    if (!payload || !ready) return;
    document.body.className = payload.bodyClass;
    document.title = payload.title;
    const setMeta = (id: string, value: string) => {
      const element = document.getElementById(id);
      if (element instanceof HTMLMetaElement) element.content = value;
      else if (element instanceof HTMLLinkElement) element.href = value;
    };
    const origin = document.querySelector<HTMLMetaElement>("#meta-site-origin")?.content.replace(/\/+$/, "") || location.origin;
    setMeta("meta-description", payload.description);
    setMeta("link-canonical", origin + (pathname === "/" ? "/" : pathname));
    setMeta("meta-og-url", origin + (pathname === "/" ? "/" : pathname));
    setMeta("meta-og-title", payload.ogTitle || payload.title);
    setMeta("meta-og-description", payload.ogDescription || payload.description);
    setMeta("meta-og-image", origin + (payload.ogImage || OG_DEFAULT.ogImage));
    setMeta("meta-og-image-alt", payload.ogImage ? "" : OG_DEFAULT.ogImageAlt); // the default description fits only the default image
    setMeta("meta-robots", payload.noindex || payload.kind === "notfound" ? "noindex,follow" : "index,follow,max-image-preview:large");
    setMeta("meta-theme-color", THEME_COLOR[payload.kind] || "#ffffff");
    document.getElementById("script-jsonld")?.remove();
    const jsonld = payload.jsonld || (pathname.startsWith("/docs/") && payload.docs
      ? docsJsonLd(pathname, payload, origin)
      : null);
    if (jsonld) {
      const script = document.createElement("script");
      script.id = "script-jsonld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonld);
      document.head.appendChild(script);
    }
  }, [payload, pathname, ready]);
  return null;
}

function NavigationBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(() => {
    const saveScrollPosition = () => {
      const historyState = window.history.state;
      window.history.replaceState({
        ...historyState,
        usr: { ...historyState?.usr, scrollY: window.scrollY },
      }, "");
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      let url: URL;
      try { url = new URL(anchor.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin || NON_PAGE.test(url.pathname)) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      saveScrollPosition();
      focusNext = true;
      const go = () => navigateRef.current(url.pathname + url.search + url.hash);
      if (anchor.closest(DOCS_NAV)) go();
      else transitionTo(go);
    };
    const onVerseNavigate = (event: Event) => {
      const { href, replace } = (event as CustomEvent<{ href: string; replace?: boolean }>).detail;
      saveScrollPosition();
      navigateRef.current(href, { replace: !!replace });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("verse:navigate", onVerseNavigate);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("verse:navigate", onVerseNavigate);
    };
  }, []);

  useEffect(() => {
    const event = new CustomEvent("verse:location", { detail: { pathname: location.pathname } });
    document.dispatchEvent(event);
  }, [location.pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const pathname = routeOf(location.pathname);
  const payload = useRoutePayload(pathname);
  const stylesReady = useRouteStyles(pathname, payload?.kind);
  const page = useRoutePage(payload);
  const ready = stylesReady && page.ready;
  const started = useRef(false);
  const [announced, setAnnounced] = useState<string | null>(null); // the route whose title was announced

  // The phone menu closes when the route changes.
  useEffect(() => {
    const menu = document.getElementById("menu-dialog") as HTMLDialogElement | null;
    if (menu?.open) menu.close();
  }, [pathname]);

  useEffect(() => {
    if (!payload || !ready) return undefined;
    const disposers: (() => void)[] = [];
    let active = true;
    for (const load of MODULES[pathname] ?? []) {
      load().then((module) => module.mount()).then((dispose) => {
        if (typeof dispose !== "function") return;
        if (active) disposers.push(dispose as () => void);
        else dispose();
      }).catch((error) => console.error(`Unable to initialize the behaviour of ${pathname}.`, error));
    }
    return () => {
      active = false;
      disposers.reverse().forEach((dispose) => dispose());
    };
  }, [pathname, ready]);

  useEffect(() => {
    if (!payload || !ready) return;
    if (location.hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
    } else if (navigationType === "POP") {
      window.scrollTo(0, Number((location.state as { scrollY?: number } | null)?.scrollY || 0));
    } else {
      window.scrollTo(0, 0);
    }
    if (focusNext && payload.kind !== "app") document.getElementById("app-main")?.focus({ preventScroll: true });
    focusNext = false;
    setAnnounced(pathname);
  }, [pathname, ready, location.hash, location.state, navigationType]);

  // First load: the page is ready, then the intro plays (once; skipped for prerendered pages, transition.ts).
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    document.documentElement.classList.add("app-ready");
    playIntro();
  }, [ready]);

  return (
    <>
      <RouteEffects payload={payload} pathname={pathname} ready={ready} />
      <NavigationBridge />
      <Shell view={shellView(payload, ready, <RouteContent payload={payload} Component={page.Component} />, announced === pathname)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<AppRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
