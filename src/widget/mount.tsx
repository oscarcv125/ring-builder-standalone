import { createRoot, type Root } from 'react-dom/client';
import RingConfigurator from '../components/RingConfigurator';
import { readConfig } from './config';

export const MOUNT_SELECTOR = '[data-ring-viewer]';

/** DOM-level marker. Survives the bundle being evaluated twice (two sections,
 *  theme quirks), which a module-scoped Map alone would not catch. */
const MOUNTED_ATTR = 'ringViewerMounted';

const roots = new Map<HTMLElement, Root>();

/** Mount points inside `scope`, plus `scope` itself when it is one. */
function targets(scope: ParentNode): HTMLElement[] {
  const found = Array.from(scope.querySelectorAll<HTMLElement>(MOUNT_SELECTOR));
  if (scope instanceof HTMLElement && scope.matches(MOUNT_SELECTOR)) {
    found.unshift(scope);
  }
  return found;
}

/** Idempotent: elements that already have a root are skipped. */
export function mount(scope: ParentNode = document): number {
  let mounted = 0;
  for (const el of targets(scope)) {
    if (roots.has(el) || el.dataset[MOUNTED_ATTR] === 'true') continue;
    const config = readConfig(el);
    el.dataset[MOUNTED_ATTR] = 'true';
    const root = createRoot(el);
    roots.set(el, root);
    root.render(<RingConfigurator config={config} />);
    mounted += 1;
  }
  return mounted;
}

export function unmount(scope: ParentNode = document): number {
  let removed = 0;
  for (const el of targets(scope)) {
    const root = roots.get(el);
    delete el.dataset[MOUNTED_ATTR];
    if (!root) continue;
    root.unmount();
    roots.delete(el);
    removed += 1;
  }
  return removed;
}
