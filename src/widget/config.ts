/**
 * Widget configuration: parsed from `data-*` attributes on the mount element
 * so a single hosted bundle can be re-pointed (assets, defaults, pricing)
 * from Liquid without a rebuild.
 */

export type MetalId = 'yellow' | 'white' | 'rose';

export type SettingKey =
  | 'solitairePlain'
  | 'solitairePave'
  | 'haloPlain'
  | 'haloPave';

export type ModelMap = Record<SettingKey, string>;

export interface WidgetConfig {
  assetBase: string;
  models: ModelMap;
  envHdr: string;
  diamondHdr: string;
  /* Directory holding the self-hosted Draco decoder; models are compressed. */
  dracoPath: string;
  initialMetal: MetalId;
  initialHalo: boolean;
  initialPave: boolean;
  viewerHeight: string;
  /* Display-only chrome. Defaults are OFF: on a real storefront the theme
     already renders title/price/cart, and a second (unwired) set would
     contradict what the customer actually pays at checkout. */
  showTitle: boolean;
  showPrice: boolean;
  showCta: boolean;
  /* The shape picker is inert (only 'round' has a model), so it stays hidden
     unless a merchant deliberately opts in. */
  showShapes: boolean;
  title: string;
  ctaLabel: string;
  currency: string;
  priceBase: number;
  priceHalo: number;
  pricePave: number;
}

const DEFAULT_MODELS: ModelMap = {
  solitairePlain: 'models/solitaire-plain.glb',
  solitairePave: 'models/solitaire-pave.glb',
  haloPlain: 'models/halo-plain.glb',
  haloPave: 'models/halo-pave.glb',
};

const METALS: MetalId[] = ['yellow', 'white', 'rose'];

function str(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  const v = (value ?? '').trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return fallback;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat((value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function metal(value: string | undefined, fallback: MetalId): MetalId {
  const v = (value ?? '').trim().toLowerCase() as MetalId;
  return METALS.includes(v) ? v : fallback;
}

/** CSS length passthrough; bare numbers are treated as pixels. */
function cssLength(value: string | undefined, fallback: string): string {
  const v = (value ?? '').trim();
  if (!v) return fallback;
  return /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
}

export function readConfig(el: HTMLElement): WidgetConfig {
  const d = el.dataset;
  return {
    assetBase: str(d.assetBase, ''),
    models: {
      solitairePlain: str(d.modelSolitairePlain, DEFAULT_MODELS.solitairePlain),
      solitairePave: str(d.modelSolitairePave, DEFAULT_MODELS.solitairePave),
      haloPlain: str(d.modelHaloPlain, DEFAULT_MODELS.haloPlain),
      haloPave: str(d.modelHaloPave, DEFAULT_MODELS.haloPave),
    },
    envHdr: str(d.envHdr, 'env/studio_small_09_1k.hdr'),
    diamondHdr: str(d.diamondHdr, 'env/photo_studio_01_1k.hdr'),
    dracoPath: str(d.dracoPath, 'draco/'),
    initialMetal: metal(d.initialMetal, 'yellow'),
    initialHalo: bool(d.initialHalo, false),
    initialPave: bool(d.initialPave, false),
    viewerHeight: cssLength(d.viewerHeight, '560px'),
    showTitle: bool(d.showTitle, false),
    showPrice: bool(d.showPrice, false),
    showCta: bool(d.showCta, false),
    showShapes: bool(d.showShapes, false),
    title: str(d.title, ''),
    ctaLabel: str(d.ctaLabel, 'Choose Diamond'),
    currency: str(d.currency, '$'),
    priceBase: num(d.priceBase, 980),
    priceHalo: num(d.priceHalo, 350),
    pricePave: num(d.pricePave, 450),
  };
}

/**
 * Joins the configured asset base with a relative asset path.
 * Absolute URLs and root-relative paths are passed through untouched so a
 * merchant can point individual assets at Shopify Files if they prefer.
 */
export function resolveAsset(assetBase: string, path: string): string {
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('/')) return path;
  if (!assetBase) return path;
  return `${assetBase.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function selectModel(
  models: ModelMap,
  hasHalo: boolean,
  hasPave: boolean,
): string {
  if (hasHalo) return hasPave ? models.haloPave : models.haloPlain;
  return hasPave ? models.solitairePave : models.solitairePlain;
}
