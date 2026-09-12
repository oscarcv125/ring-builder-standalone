# Lumière 3D Ring Builder

An interactive 3D jewellery configurator built with React Three Fiber, Vite and
Three.js. Customers toggle setting styles (halo, pavé) and metal colours and see
an optimised GLB model swap in real time, lit by HDR environment maps with true
refraction on the centre stone.

It builds to an **embeddable widget** — a single JS bundle plus one stylesheet —
designed to drop into a Shopify theme (or any other page).

**Live demo:** https://ring-viewer-app.vercel.app/preview.html

> ### Putting this on a Shopify store?
> - **Using Claude Code?** Open this repo with it — [`CLAUDE.md`](CLAUDE.md) is
>   a full runbook it will follow, including the questions it should ask you
>   first.
> - **Doing it by hand?** Follow [`SHOPIFY.md`](SHOPIFY.md).
> - **Want it to actually sell?** See [`CART-INTEGRATION.md`](CART-INTEGRATION.md)
>   — the configurator is display-only until that work is done.

## Features

- **Dynamic 3D rendering** — real-time WebGL with physically-based materials
  (transmission, IOR, dispersion) on complex jewellery geometry.
- **Size-relative material dispatch** — the centre stone gets full ray-traced
  refraction; sub-millimetre pavé stones fall back to a cheap transmissive
  material, because refraction on sub-pixel facets just aliases into noise.
- **Environment lighting** — HDR maps drive accurate sparkle and reflections.
- **Embeddable by design** — mounts into any `[data-ring-viewer]` element and is
  configured entirely through `data-` attributes, so one hosted build serves
  many pages without a rebuild.

## Tech stack

React 19 · React Three Fiber · Drei · Three.js · Vite 8 · TypeScript · oxlint

## Local development

```bash
npm install
npm run dev
```

`index.html` is a harness that renders the exact markup the Shopify section
emits, so local preview matches production.

## Build

```bash
npm run build
```

Outputs `dist/` — the complete deployable set:

| File | Purpose |
|---|---|
| `ring-viewer.js` | the widget, self-contained (~1.3 MB, ~363 kB gzip) |
| `ring-viewer.css` | scoped styles |
| `models/*.glb` | four ring variants |
| `env/*.hdr` | two HDR environment maps |

Filenames are intentionally unhashed so host pages can hardcode their URLs.

## Embedding

```html
<link rel="stylesheet" href="https://YOUR-HOST/ring-viewer.css">

<div
  data-ring-viewer
  data-asset-base="https://YOUR-HOST"
  data-initial-metal="yellow"
  data-viewer-height="560"
></div>

<script src="https://YOUR-HOST/ring-viewer.js" defer></script>
```

The bundle auto-mounts on load, re-mounts on Shopify's `shopify:section:load`
event, and exposes `window.RingViewer.mount()` / `.unmount()` for themes that
inject markup later (quick views, drawers).

### Attributes

`data-asset-base` · `data-initial-metal` (`yellow`\|`white`\|`rose`) ·
`data-initial-halo` · `data-initial-pave` · `data-viewer-height` ·
`data-show-title` · `data-show-price` · `data-show-shapes` · `data-show-cta` ·
`data-cta-label` · `data-currency` · `data-price-base` · `data-price-halo` ·
`data-price-pave` · `data-model-*` (override individual model paths)

Display options default to **off** — see [SHOPIFY.md](SHOPIFY.md) for why.

## Shopify

| Document | For |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Claude Code runbook — questions to ask, procedure, gotchas |
| [`SHOPIFY.md`](SHOPIFY.md) | Human integration guide: hosting, section install, troubleshooting |
| [`CART-INTEGRATION.md`](CART-INTEGRATION.md) | Phase 2 — wiring variants and checkout |
| `shopify/ring-viewer.liquid` | The ready-to-paste theme section |

## Project layout

```
src/
├── widget.tsx              IIFE entry — auto-mount + Shopify lifecycle hooks
├── widget/
│   ├── mount.tsx           finds mount points, creates/destroys React roots
│   └── config.ts           data-attribute parsing, defaults, asset resolution
├── components/
│   ├── RingConfigurator.tsx  widget UI (viewer + controls)
│   └── RingViewer.tsx        the R3F canvas and material logic
└── styles/widget.css       scoped styles (.rv-root / rv- prefix)
```

## Known limitations

- The diamond **shape picker is inert** — only `round` has a model, so it is
  hidden by default.
- **No cart integration yet.** Price display is indicative only.
- Gemstone detection relies on mesh names inside the GLBs (`diamond`, `round`,
  `stone`, …). Models exported with generic names render as metal.
