// Shared DOM helpers for the app shell.
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const byId = id => document.getElementById(id);

const scripts = new Map();
/** Load a classic script once and resolve when it has executed. */
export function loadScript(src) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src; el.async = false; el.onload = resolve;
      el.onerror = () => { scripts.delete(src); reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(el);
    }));
  }
  return scripts.get(src);
}

/** Ask the router to navigate (used by modules that cannot import the router without a cycle). */
export function go(href, options = {}) {
  document.dispatchEvent(new CustomEvent('verse:navigate', { detail: { href, ...options } }));
}
