/**
 * Embeddable entry point.
 *
 * Builds to a single self-contained IIFE (`ring-viewer.js` + `ring-viewer.css`)
 * that auto-mounts into every `[data-ring-viewer]` element on the page.
 */
import { mount, unmount } from './widget/mount';
import './styles/widget.css';

declare global {
  interface Window {
    RingViewer?: {
      mount: typeof mount;
      unmount: typeof unmount;
    };
  }
}

function init() {
  mount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

// The Shopify theme editor swaps section markup in place rather than reloading
// the page, so re-mount (and tear down) on its lifecycle events.
document.addEventListener('shopify:section:load', (event) => {
  if (event.target instanceof HTMLElement) mount(event.target);
});

document.addEventListener('shopify:section:unload', (event) => {
  if (event.target instanceof HTMLElement) unmount(event.target);
});

// Escape hatch for themes that inject markup after load (quick views, etc.).
window.RingViewer = { mount, unmount };
