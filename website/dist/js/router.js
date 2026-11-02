// Client-side router. One HTML document; each route is a JSON payload in /content/ holding its meta and HTML fragment.
// Routes may also have a behaviour module that exports mount(context) -> dispose.
import { $, byId, $$ } from './core.js';

const STYLES = {
  landing: ['/css/landing.css', '/css/site.css'],
  page: ['/css/site.css'],
  challenge: ['/css/site.css', '/css/challenge.css'],
  app: ['/css/studio.css'],
  notfound: ['/css/site.css'],
};
const MODULES = {
  '/': () => import('./landing/index.js'),
  '/studio': () => import('./studio.js'),
  '/signin': () => import('./signin.js'),
  '/challenge': () => import('./challenge.js'),
};
const THEME_COLOR = { landing: '#f5f6f7' };
const origin = () => byId('meta-site-origin').content.replace(/\/+$/, '');

const state = { path: null, disposers: [], token: 0, payloads: new Map() };

/** Normalise a pathname to a route key: no trailing slash except the root. */
export const routeOf = pathname => { const p = decodeURIComponent(pathname).replace(/\/+$/, ''); return p === '' ? '/' : p; };
const payloadUrl = path => '/content/' + (path === '/' ? 'index' : path.slice(1).replaceAll('/', '__')) + '.json';

let manifest = null;
const knownRoutes = () => manifest ??= fetch('/content/manifest.json').then(r => r.json()).then(list => new Set(list.map(r => r.path))).catch(() => null);

async function loadPayload(path) {
  const known = await knownRoutes();
  if (known && path !== '/404' && !known.has(path)) return null;
  if (!state.payloads.has(path)) {
    state.payloads.set(path, fetch(payloadUrl(path)).then(r => {
      if (!r.ok) throw new Error('missing');
      return r.json();
    }).catch(() => (path === '/404' ? Promise.reject(new Error('no 404 payload')) : null)));
  }
  return state.payloads.get(path);
}

/** Add the stylesheets a route needs (in order) and remove the ones it no longer uses. Resolves when loaded. */
async function applyStyles(kind, key) {
  const wanted = STYLES[key] || STYLES[kind] || STYLES.page;
  const existing = new Map($$('link[data-route-style]').map(l => [l.getAttribute('href'), l]));
  const pending = [];
  wanted.forEach((href, i) => {
    if (existing.has(href)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.dataset.routeStyle = '';
    link.id = 'css-' + href.split('/').pop().replace('.css', '');
    pending.push(new Promise(resolve => { link.onload = link.onerror = resolve; }));
    const next = wanted.slice(i + 1).map(h => existing.get(h)).find(Boolean);
    next ? next.before(link) : document.head.appendChild(link);
    existing.set(href, link);
  });
  await Promise.all(pending);
  return () => existing.forEach((link, href) => { if (!wanted.includes(href)) link.remove(); });
}

function setMeta(payload, path) {
  document.title = payload.title;
  byId('meta-description').content = payload.description;
  const url = origin() + (path === '/' ? '/' : path);
  byId('link-canonical').href = url;
  byId('meta-og-url').content = url;
  byId('meta-og-title').content = payload.title;
  byId('meta-og-description').content = payload.description;
  byId('meta-robots').content = payload.noindex || payload.kind === 'notfound' ? 'noindex,follow' : 'index,follow,max-image-preview:large';
  byId('meta-theme-color').content = THEME_COLOR[payload.kind] || '#ffffff';
  byId('script-jsonld')?.remove();
  if (payload.jsonld) document.head.insertAdjacentHTML('beforeend', payload.jsonld.replace('<script ', '<script id="script-jsonld" '));
}

function setChrome(payload) {
  const app = payload.kind === 'app';
  byId('site-header').hidden = !(payload.chrome === 'full' || payload.chrome === 'header');
  byId('site-footer').hidden = payload.chrome !== 'full';
  byId('lnk-skip').hidden = app || payload.chrome === 'none';
  byId('app-main').hidden = app;
  byId('app-standalone').hidden = !app;
  $$('#nav-main a').forEach(a => a.getAttribute('href') === payload.navCurrent ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
}

async function leave() {
  const disposers = state.disposers.splice(0).reverse();
  for (const dispose of disposers) { try { await dispose(); } catch (error) { console.warn('dispose failed', error); } }
  byId('app-main').replaceChildren(); byId('app-standalone').replaceChildren();
  byId('menu-dialog').open && byId('menu-dialog').close();
}

async function mountModules(payload, path) {
  const context = { path, payload };
  const tasks = [];
  if (payload.kind === 'page') tasks.push(import('./pages.js'));
  if (MODULES[path]) tasks.push(MODULES[path]());
  for (const mod of await Promise.all(tasks)) {
    const dispose = await mod.mount(context);
    if (typeof dispose === 'function') state.disposers.push(dispose);
  }
}

/** Render a location. Returns true when the route rendered (false when superseded by a newer navigation). */
export async function render(href, { scroll = 'top', focus = false } = {}) {
  const url = new URL(href, location.href);
  const path = routeOf(url.pathname), token = ++state.token;
  let payload = await loadPayload(path);
  if (token !== state.token) return false;
  if (!payload) { payload = await loadPayload('/404'); }
  const finishStyles = await applyStyles(payload.kind, path === '/challenge' ? 'challenge' : payload.kind);
  if (token !== state.token) return false;
  await leave();
  if (token !== state.token) return false;
  document.body.className = payload.bodyClass;
  setMeta(payload, path); setChrome(payload);
  const target = payload.kind === 'app' ? byId('app-standalone') : byId('app-main');
  target.className = payload.mainClass || '';
  target.innerHTML = payload.html;
  finishStyles();
  state.path = path;
  if (payload.kind === 'app') { const mail = byId('st-gate-mail'); if (mail) mail.href = 'mailto:?subject=' + encodeURIComponent('Open the Verse Playground on a laptop') + '&body=' + encodeURIComponent('Open this link on a laptop or desktop: ' + location.origin + path); }
  await mountModules(payload, path);
  if (scroll === 'top') { if (url.hash && byId(decodeURIComponent(url.hash.slice(1)))) byId(decodeURIComponent(url.hash.slice(1))).scrollIntoView(); else window.scrollTo(0, 0); }
  else if (typeof scroll === 'number') window.scrollTo(0, scroll);
  byId('app-announcer').textContent = payload.title;
  if (focus && payload.kind !== 'app') byId('app-main').focus({ preventScroll: true });
  return true;
}

/** Push a new history entry and render it. */
export async function navigate(href, { replace = false, focus = true } = {}) {
  const url = new URL(href, location.href);
  history.replaceState({ ...history.state, y: scrollY }, '');
  history[replace ? 'replaceState' : 'pushState']({ y: 0 }, '', url.pathname + url.search + url.hash);
  return render(url.href, { focus });
}

export function startRouter() {
  history.scrollRestoration = 'manual';
  addEventListener('popstate', () => {
    // Hash-only changes (Playground sub-routes, in-page anchors) stay on the current route.
    if (routeOf(location.pathname) === state.path) return;
    render(location.href, { scroll: history.state?.y ?? 0 });
  });
  document.addEventListener('verse:navigate', e => navigate(e.detail.href, { replace: !!e.detail.replace, focus: false }));
  return render(location.href, { scroll: 'top' });
}
