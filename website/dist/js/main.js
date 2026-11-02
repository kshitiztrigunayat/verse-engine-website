// App entry: menu, router, link interception and the page transition.
import { initMenu } from './menu.js';
import { startRouter, navigate, routeOf } from './router.js';
import { playIntro, transitionTo } from './transition.js';

const NON_PAGE = /\.(zip|tgz|rbz|pdf|json|xml|txt|mp4|png|jpe?g|webp|svg|glb|otf|woff2?)$/i;
const DOCS_NAV = '#nav-docs, .docs-sidebar, .docs-mobile, .docs-nav-content';

function onLinkClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.('a[href]');
  if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
  let url; try { url = new URL(link.href, location.href); } catch { return; }
  if (url.origin !== location.origin || NON_PAGE.test(url.pathname)) return;
  if (url.pathname === location.pathname && url.search === location.search) return;   // same page: hash jumps stay native
  event.preventDefault();
  // Moving around inside the documentation is plain navigation, without the transition.
  if (link.closest(DOCS_NAV)) { navigate(url.href); return; }
  transitionTo(() => navigate(url.href));
}

initMenu();
document.addEventListener('click', onLinkClick, true);
await startRouter();
document.documentElement.classList.add('app-ready');
playIntro();
export { routeOf };
