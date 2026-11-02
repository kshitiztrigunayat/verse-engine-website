import { byId } from './core.js';

/** Wire the navigation dialog once. Emits `verse:menu` ({open}) so page modules (e.g. smooth scroll) can react. */
export function initMenu() {
  const dialog = byId('menu-dialog'), openButton = byId('btn-menu-open'), closeButton = byId('btn-menu-close');
  const emit = open => document.dispatchEvent(new CustomEvent('verse:menu', { detail: { open } }));
  openButton.addEventListener('click', () => { dialog.showModal(); emit(true); });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { emit(false); openButton.focus(); });
  dialog.addEventListener('click', event => { if (event.target.closest('a')) dialog.close(); });
  new MutationObserver(() => openButton.setAttribute('aria-expanded', String(dialog.open)))
    .observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
