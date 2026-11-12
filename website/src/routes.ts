// Route data shared by the React Router app (App.tsx), its start-up (main.tsx) and the build-time prerender
// (prerender.tsx). Nothing here touches browser globals when imported, so the prerender can load it in Node.
import type { ComponentType, ReactNode } from "react";
import { PAGES } from "./pages/index.ts";
import type { PageMeta } from "./pages/meta.ts";

/** A route's data: its meta (src/pages/meta.ts) or its payload (/content/<route>.json, documentation pages). */
export type RoutePayload = PageMeta & {
  path: string;
  docs?: { active: string | null; article: string; source: string; toc: { id: string; href: string; text: string }[] };
};

/** The stylesheets of each kind of page (the Challenge page has its own). */
export const STYLES: Record<string, string[]> = {
  landing: ["/css/landing.css", "/css/site.css", "/css/landing-sections.css"],
  page: ["/css/site.css"],
  challenge: ["/css/site.css", "/css/challenge.css"],
  app: ["/css/studio.css"],
  notfound: ["/css/site.css"],
  legal: ["/css/site.css", "/css/legal.css"],
  resources: ["/css/site.css", "/css/resources.css"],
};
export const stylesFor = (path: string, kind?: string) => STYLES[path === "/challenge" ? "challenge" : kind || "page"] || STYLES.page;

/** A pathname as a route key: no trailing slash except the root. */
export const routeOf = (pathname: string) => decodeURIComponent(pathname).replace(/\/+$/, "") || "/";

// React pages, loaded on demand (pages/index.ts) and kept once loaded.
export const hasPage = (path: string) => path in PAGES;
const loaded = new Map<string, ComponentType>();
export const loadedPage = (path: string) => loaded.get(path);
export async function loadPage(path: string): Promise<ComponentType | undefined> {
  const load = PAGES[path];
  if (load && !loaded.has(path)) loaded.set(path, (await load()).default);
  return loaded.get(path);
}

/** What the shell shows for a route: its chrome (meta `chrome`, `kind`), and the page once its styles and code are
    ready; `announce` puts the page title in the screen-reader announcer (after the page shows). */
export function shellView(payload: RoutePayload | null, ready: boolean, page: ReactNode, announce = false) {
  const isApp = payload?.kind === "app";
  return {
    headerHidden: !ready || !payload || !(payload.chrome === "full" || payload.chrome === "header"),
    footerHidden: !ready || !payload || payload.chrome !== "full",
    skipHidden: !ready || isApp || payload?.chrome === "none",
    mainHidden: !ready || isApp,
    mainClass: isApp ? undefined : payload?.mainClass || "",
    mainPage: isApp ? null : page,
    standaloneHidden: !ready || !isApp,
    standaloneClass: isApp ? payload?.mainClass || "" : undefined,
    standalonePage: isApp ? page : null,
    announcement: announce && ready ? payload?.title || "" : "",
    navCurrent: payload?.navCurrent,
  };
}
