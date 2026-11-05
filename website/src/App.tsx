import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import Shell from "./Shell.tsx";
import { PAGES } from "./pages/index.ts";
import { META, docsJsonLd } from "./pages/meta.ts";
import DocsPage from "./pages/docs/DocsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { playIntro, transitionTo } from "./animations/transition.ts";

const STYLES: Record<string, string[]> = {
  landing: ["/css/landing.css", "/css/site.css"],
  page: ["/css/site.css"],
  challenge: ["/css/site.css", "/css/challenge.css"],
  app: ["/css/studio.css"],
  notfound: ["/css/site.css"],
  legal: ["/css/site.css", "/css/legal.css"],
};
const NON_PAGE = /\.(zip|tgz|rbz|pdf|json|xml|txt|mp4|png|jpe?g|webp|svg|glb|otf|woff2?)$/i;
const DOCS_NAV = "#nav-docs, .docs-sidebar, .docs-mobile, .docs-nav-content";
const NOT_FOUND = META["/404"];

type RoutePayload = {
  path: string;
  kind: string;
  chrome: "full" | "header" | "none";
  title: string;
  description: string;
  bodyClass: string;
  mainClass?: string;
  navCurrent?: string;
  noindex?: boolean;
  ogDescription?: string;
  jsonld?: Record<string, unknown>;
  html?: string;
  docs?: { active: string | null; article: string; source: string; toc: { id: string; href: string; text: string }[] };
};

function useRoutePayload(pathname: string): RoutePayload | null {
  const [loaded, setLoaded] = useState<{ pathname: string; payload: RoutePayload | null } | null>(null);
  useEffect(() => {
    let active = true;
    const meta = META[pathname];
    if (meta) {
      setLoaded({ pathname, payload: { path: pathname, ...meta } });
    } else {
      const payloadUrl = `/content/${pathname === "/" ? "index" : pathname.slice(1).replaceAll("/", "__")}.json`;
      fetch(payloadUrl).then((response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`Route content request failed (${response.status}): ${pathname}`);
        return response.json() as Promise<RoutePayload>;
      }).then((data) => {
        if (!active) return;
        if (data) setLoaded({ pathname, payload: data });
        else setLoaded({ pathname, payload: { path: pathname, ...NOT_FOUND } });
      }).catch((error: unknown) => {
        if (active) {
          console.error(`Unable to load route content for ${pathname}.`, error);
          setLoaded({ pathname, payload: { path: pathname, ...NOT_FOUND } });
        }
      });
    }
    return () => { active = false; };
  }, [pathname]);
  return loaded?.pathname === pathname ? loaded.payload : null;
}

function useRouteStyles(pathname: string, kind?: string): boolean {
  const [loadedKey, setLoadedKey] = useState("");
  const key = `${pathname}:${kind || "page"}`;
  useEffect(() => {
    let active = true;
    const styles = STYLES[pathname === "/challenge" ? "challenge" : kind || "page"] || STYLES.page;
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

function RouteContent({ payload }: { payload: RoutePayload | null }) {
  if (!payload) return <NotFound />;
  if (payload.docs) return <DocsPage page={{ ...payload.docs, article: payload.docs.article }} />;
  const Component = PAGES[payload.path] || NotFound;
  return <Component />;
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
    setMeta("meta-og-title", payload.title);
    setMeta("meta-og-description", payload.ogDescription || payload.description);
    setMeta("meta-robots", payload.noindex || payload.kind === "notfound" ? "noindex,follow" : "index,follow,max-image-preview:large");
    setMeta("meta-theme-color", payload.kind === "landing" ? "#f5f6f7" : "#ffffff");
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
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const payload = useRoutePayload(pathname);
  const stylesReady = useRouteStyles(pathname, payload?.kind);
  const isApp = payload?.kind === "app";

  useEffect(() => {
    if (!payload || !stylesReady) return;
    const moduleLoader = pathname === "/" ? () => import("./animations/landing/index.ts") : null;
    let dispose: (() => void) | undefined;
    let active = true;
    moduleLoader?.().then((module) => module.mount()).then((cleanup) => {
      if (!active) cleanup?.();
      else if (cleanup) dispose = cleanup;
    }).catch((error) => console.error("Unable to initialize the landing animation.", error));
    return () => {
      active = false;
      dispose?.();
    };
  }, [pathname, stylesReady]);

  useEffect(() => {
    if (!payload || !stylesReady) return;
    if (location.hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
    } else if (navigationType === "POP") {
      window.scrollTo(0, Number((location.state as { scrollY?: number } | null)?.scrollY || 0));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, stylesReady, location.hash, location.state, navigationType]);

  useEffect(() => {
    if (!payload || !stylesReady) return;
    document.documentElement.classList.add("app-ready");
    if (payload.kind === "landing") playIntro();
  }, [payload?.kind, stylesReady]);

  const mainPage = <RouteContent payload={payload} />;
  return (
    <>
      <RouteEffects payload={payload} pathname={pathname} ready={stylesReady} />
      <NavigationBridge />
      <Shell
        view={{
          headerHidden: !stylesReady || !payload || !(payload.chrome === "full" || payload.chrome === "header"),
          footerHidden: !stylesReady || !payload || payload.chrome !== "full",
          skipHidden: !stylesReady || isApp || payload?.chrome === "none",
          mainHidden: !stylesReady || isApp,
          mainClass: payload?.mainClass || "",
          mainPage: isApp ? null : mainPage,
          standaloneHidden: !stylesReady || !isApp,
          standaloneClass: payload?.mainClass || "",
          standalonePage: isApp ? mainPage : null,
          announcement: stylesReady ? payload?.title || "" : "",
          navCurrent: payload?.navCurrent,
        }}
      />
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
