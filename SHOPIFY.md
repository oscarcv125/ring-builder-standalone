# Adding the Ring Viewer to Shopify

The widget is a plain `<script>` + `<div>`. Shopify loads it from a URL you
control, so updating the 3D experience never means touching the theme again.

```
dist/                     what you deploy
├── ring-viewer.js        the widget (React + Three.js, self-contained)
├── ring-viewer.css       scoped styles
├── models/*.glb          4 ring variants
└── env/*.hdr             2 HDR environment maps
```

---

## Step 1 — Build

```bash
npm install
npm run build
```

Produces `dist/`. Filenames are stable (no content hashes), so the URLs you
paste into Shopify keep working after every redeploy.

## Step 2 — Deploy `dist/`

Put `dist/` on any static host and copy the resulting origin, e.g.
`https://your-project.vercel.app`. No trailing slash.

Requirements for the host:
- serves `.glb` and `.hdr` files
- allows cross-origin reads (`Access-Control-Allow-Origin: *` or your store's domain)

## Step 3 — Add the section to your theme

1. Shopify admin → **Online Store → Themes**
2. On your live theme: **⋯ → Edit code**
3. In the **Sections** folder, click **Add a new section**
4. Name it `ring-viewer` (Shopify creates `sections/ring-viewer.liquid`)
5. Delete the placeholder content Shopify pre-fills, then paste the entire
   contents of `shopify/ring-viewer.liquid` from this repo
6. **Save**

## Step 4 — Place it on the page

1. Back in **Themes → Customize**
2. Navigate to the page you want (e.g. a product page)
3. **Add section → Ring Viewer**
4. Open its settings and paste your deploy origin into **Widget base URL**
5. Drag it into position, then **Save**

The 3D viewer appears in the theme editor immediately. Every other setting
(default metal, viewer height, padding) applies live without a rebuild.

---

## Settings reference

| Setting | Default | Notes |
|---|---|---|
| Widget base URL | — | **Required.** Origin serving `dist/`, no trailing slash |
| Viewer height | 560px | Canvas height; capped to 70vh on mobile |
| Maximum width / padding | 1200px / 40px | Section layout |
| Metal colour | Yellow | Starting selection |
| Start with halo / pavé | off | Starting selection |
| Show ring name | off | Display only |
| Show indicative price | off | Display only — see warning below |
| Show diamond shape picker | off | Only `round` has a model |
| Show call-to-action | off | Not wired to the cart |
| Base / halo / pavé price | 980 / 350 / 450 | Used only if price display is on |

### Why the text options default to OFF

Your product page already renders a title, a real price and a real Add to cart.
The widget's equivalents are **display-only** and are not connected to
checkout, so leaving them on would show a shopper a price that may not match
what they actually pay. Keep them off until the cart integration lands
(see below).

---

## Troubleshooting

**Nothing renders, console shows CORS errors**
The host is not sending `Access-Control-Allow-Origin`. The `.glb`/`.hdr` files
are fetched cross-origin by Three.js and need it.

**Viewer is blank, `404` on a `.glb`**
`dist/models/` was not deployed, or the base URL has a trailing slash or a
path on the end. It must be a bare origin.

**Ring loads but looks flat / no sparkle**
`dist/env/*.hdr` is missing or blocked. The diamond refraction needs the HDR.

**Styling looks wrong inside the theme**
All widget CSS is scoped under `.rv-root` with a `rv-` prefix, and it resets
theme button/heading styles inside its own subtree only. If a theme still
overrides something, its selector is more specific than `.rv-root .rv-thing` —
raise the widget rule rather than adding `!important` globally.

**Changes to section settings do nothing**
Settings are read at mount. The widget re-mounts on Shopify's
`shopify:section:load` event, so the theme editor updates live; on the live
storefront a page refresh applies them.

---

## Not wired yet: the cart

This is a visual-first integration. The configurator does not add anything to
the cart. To make it transactional:

1. Create a Shopify product with options **Setting** (Solitaire / Halo),
   **Band** (Plain / Pavé) and **Metal** (Yellow / White / Rose) — up to 12
   variants, each with its own real price and SKU.
2. Inject the variant list into the mount div from Liquid as JSON.
3. Map the current selection to a variant ID and POST it to `/cart/add.js`.
4. Turn the widget's price display off permanently, or drive it from the
   matched variant so it always matches checkout.
