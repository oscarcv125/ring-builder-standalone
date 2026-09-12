# Adding the Ring Viewer to Shopify

The widget is a plain `<script>` plus a `<div>`. Shopify loads it from a URL
you control, so updating the 3D experience later never means touching the
theme again.

> **Using Claude Code for this?** Point it at `CLAUDE.md` in this repo — it
> contains a step-by-step runbook and the questions Claude should ask you
> before it changes anything.

```
dist/                     <- this whole folder is what gets hosted
├── ring-viewer.js        the widget (React + Three.js, self-contained)
├── ring-viewer.css       scoped styles
├── preview.html          deployment smoke test
├── models/*.glb          4 ring variants (Draco-compressed)
├── env/*.hdr             2 HDR environment maps
└── draco/*               self-hosted Draco decoder
```

---

## Quick path

If you are happy to load the widget from the existing deployment, the base URL
is:

```
https://ring-viewer-app.vercel.app
```

Skip to [Step 3](#step-3--add-the-section-to-your-theme).

**But read this first.** That deployment lives on the original developer's
personal Vercel account. They control whether it stays up, and Vercel's free
Hobby plan does not permit commercial use. For a real store you should
[deploy your own copy](#step-2--deploy-your-own-copy) — it takes about five
minutes.

---

## Step 1 — Build

```bash
npm install
```

```bash
npm run build
```

This produces `dist/`. Filenames are stable (no content hashes), so the URLs
you paste into Shopify keep working after every redeploy.

## Step 2 — Deploy your own copy

`dist/` is a static folder. Any host works, provided it:

- serves `.glb` and `.hdr` files
- sends `Access-Control-Allow-Origin` (Three.js fetches the models
  cross-origin from your store's domain)

### Vercel (config already included)

`vercel.json` in this repo already sets the CORS and caching headers.

```bash
npx vercel login
```

```bash
npx vercel deploy --prod --yes
```

Note the **alias** URL it prints (e.g. `https://your-project.vercel.app`) —
not the long hashed one. The alias is stable across deploys; the hashed URL is
per-deployment and will go stale.

Alternatively, push this repo to GitHub and import it at
[vercel.com/new](https://vercel.com/new) for automatic deploys on every push.

> **Check Deployment Protection.** New Vercel projects sometimes enable it,
> which puts a login wall in front of your assets and silently breaks the
> embed. Project Settings → Deployment Protection → make sure production is
> publicly accessible.

### Cloudflare Pages / Netlify

Both work. Deploy `dist/` and add a `_headers` file:

```
/*
  Access-Control-Allow-Origin: *

/models/*
  Cache-Control: public, max-age=31536000, immutable

/env/*
  Cache-Control: public, max-age=31536000, immutable

/draco/*
  Cache-Control: public, max-age=31536000, immutable

/ring-viewer.js
  Cache-Control: public, max-age=300, must-revalidate

/ring-viewer.css
  Cache-Control: public, max-age=300, must-revalidate
```

Cloudflare Pages is worth considering over Vercel for a commercial store: its
free tier allows commercial use and has no bandwidth cap.

### Verify hosting before touching Shopify

```bash
curl -sI https://YOUR-HOST/ring-viewer.js | grep -i access-control-allow-origin
```

Must print `Access-Control-Allow-Origin: *`. Then open
`https://YOUR-HOST/preview.html` in a browser — if a gold ring renders and
slowly spins, hosting is correct.

## Step 3 — Add the section to your theme

> Duplicate your theme first (**Themes → ⋯ → Duplicate**) and work on the copy,
> so shoppers do not watch you build.

1. Shopify admin → **Online Store → Themes**
2. On the target theme: **⋯ → Edit code**
3. In the **Sections** folder, click **Add a new section**
4. Name it `ring-viewer` (Shopify creates `sections/ring-viewer.liquid`)
5. Delete the placeholder content Shopify pre-fills, then paste the entire
   contents of `shopify/ring-viewer.liquid` from this repo
6. **Save**

## Step 4 — Place it on the page

1. Back in **Themes → Customize**
2. Navigate to the page you want (e.g. a product page)
3. **Add section → Ring Viewer**
4. Open its settings and paste your base URL into **Widget base URL**
5. Drag it into position, then **Save**

The 3D viewer appears in the theme editor immediately. Every other setting
applies live without a rebuild.

---

## Settings reference

| Setting | Default | Notes |
|---|---|---|
| Widget base URL | — | **Required.** Origin serving `dist/`, no trailing slash |
| Heading | blank | Optional section heading |
| Viewer height | 560px | Canvas height; capped to 70vh on mobile |
| Maximum width | 1200px | Section content width |
| Top / bottom padding | 40px | Section spacing |
| Metal colour | Yellow | Starting selection |
| Start with halo / pavé | off | Starting selection |
| Show ring name | off | Display only |
| Show indicative price | off | Display only — see warning below |
| Show diamond shape picker | off | Only `round` has a model |
| Show call-to-action | off | Not wired to the cart |
| Base / halo / pavé price | 980 / 350 / 450 | Placeholders; only used if price display is on |

### Why the text options default to OFF

Your product page already renders a title, a real price and a real Add to
cart. The widget's equivalents are **display-only** and not connected to
checkout, so leaving them on would show a shopper a price that may not match
what they actually pay. Keep them off until the cart integration lands — see
`CART-INTEGRATION.md`.

---

## Troubleshooting

**Nothing renders; console shows CORS errors**
The host is not sending `Access-Control-Allow-Origin`. The `.glb`/`.hdr` files
are fetched cross-origin by Three.js and require it.

**Viewer is blank, 404 on a `.glb`**
`dist/models/` was not deployed, or the base URL has a trailing slash or a
path on the end. It must be a bare origin.

**404 on `draco/…`**
The `dist/draco/` folder was not deployed. The models are Draco-compressed and
cannot be decoded without it.

**Asset URLs return 401 or a login page**
Vercel Deployment Protection is enabled. Disable it for production.

**Ring loads but looks flat, no sparkle**
`dist/env/*.hdr` is missing or blocked. The diamond refraction needs the HDR.

**Diamonds render as gold metal**
Gemstone detection reads mesh names inside the GLB (`diamond`, `round`,
`stone`, …). A model re-exported with generic names breaks it.

**Styling looks wrong inside the theme**
All widget CSS is scoped under `.rv-root` with an `rv-` prefix and resets
theme button and heading styles inside its own subtree only. If a theme still
overrides something, its selector is more specific than `.rv-root .rv-thing` —
raise the widget rule rather than adding global `!important`.

**Changes to section settings do nothing**
Settings are read at mount. The widget re-mounts on Shopify's
`shopify:section:load` event, so the theme editor updates live; on the live
storefront a page refresh applies them.

**It worked, then broke after a redeploy**
A deployment-specific URL was used instead of the stable alias.

---

## Performance notes

About 5 MB on a first visit (JS 1.3 MB, HDR maps 3.2 MB, one model 0.2 MB,
Draco decoder 0.25 MB). Everything except the JS is cached for a year, so
repeat visits and model swaps are near-instant.

If you need it lighter, the HDR maps are the remaining target — the diamond
refraction map could drop to 512px, saving roughly another 1 MB, at some cost
to sparkle detail.

---

## Not wired yet: the cart

This is a visual-first integration. The configurator does not add anything to
the cart, and the price it can display is hardcoded.

See **`CART-INTEGRATION.md`** for the full specification: the variant
structure decision, the merchant admin work, the code changes, and the
verification checklist.
