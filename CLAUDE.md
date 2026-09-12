# CLAUDE.md — Ring Viewer → Shopify integration runbook

> **You are Claude Code, helping a Shopify merchant put a 3D ring configurator
> on their storefront.** The widget is already built, deployed and verified
> working. Your job is **integration**, not development.

---

## STOP — ask before you touch anything

**Do not edit files, run builds, or paste anything into Shopify until you have
asked the questions in [§2](#2-questions-you-must-ask-first) and received
answers.** Several of them change what you do; guessing wastes the merchant's
time and can put a broken or misleading section on a live store.

If you have `AskUserQuestion`, use it — ask the Section A questions as a batch
of multiple-choice questions. Otherwise ask them in plain text, and wait for
replies before proceeding.

---

## 1. What this repo is

A 3D engagement-ring configurator: a shopper toggles setting style (halo,
pavé) and metal colour and watches a photoreal ring update in real time, with
true light refraction through the centre diamond.

It builds to an **embeddable widget** — one JavaScript file plus one
stylesheet — that drops into a Shopify theme via a custom Liquid section.

| Thing | Where |
|---|---|
| Paste-ready Shopify section | `shopify/ring-viewer.liquid` |
| Human integration guide | `SHOPIFY.md` |
| Phase-2 cart spec | `CART-INTEGRATION.md` |
| Widget source | `src/widget.tsx`, `src/widget/`, `src/components/` |
| Reference deployment | https://ring-viewer-app.vercel.app |

**Architecture in one paragraph.** `src/widget.tsx` builds to a self-contained
IIFE that auto-mounts into every `[data-ring-viewer]` element on the page. All
configuration — asset URLs, default selections, which optional UI to show — is
read from `data-*` attributes on that element (parsed in
`src/widget/config.ts`), so **one hosted build serves any page and any
settings without a rebuild**. The Liquid section only renders a div with the
right attributes and loads the script.

### Current state (what already works)

- Renders on desktop and mobile, zero console errors
- Toggling halo/pavé swaps between four Draco-compressed GLB models
- Metal colour switches material (yellow / white / rose)
- Re-mounts correctly in the Shopify theme editor (`shopify:section:load`)
- About 5 MB per cold visit, with CORS and cache headers configured

### What does NOT work yet

- **No cart integration.** The configurator cannot add anything to the cart.
  The price it can display is hardcoded JavaScript with no relationship to
  Shopify. See `CART-INTEGRATION.md`.
- **Diamond shape picker is inert.** Only `round` has a 3D model, so the
  picker is hidden by default.

---

## 2. Questions you MUST ask first

### Section A — ask these before any work

**A1. Do you have theme code access?**
Shopify admin → Online Store → Themes → ⋯ → Edit code. If they only have
"Customize" access they cannot add a section file, and need someone with the
Themes permission on the account.

**A2. Live theme, or a duplicate?**
Recommend **duplicating first** (Themes → ⋯ → Duplicate), doing the whole
integration on the copy, and publishing once it looks right. If they insist on
the live theme, say plainly that shoppers will see changes as they are made.

**A3. Where should the configurator appear?**
Product page, a dedicated landing page, or the homepage. This decides which
template gets the section. If it is a product page, also ask **which product**.

**A4. Who hosts the widget?** — *most important; has cost and ownership
implications*

- **(a) Use the existing deployment** at `https://ring-viewer-app.vercel.app`.
  Zero setup, but it lives on the **original developer's personal Vercel
  account** — that account controls uptime, and Vercel's Hobby plan does not
  permit commercial use.
- **(b) Deploy your own copy — recommended.** Clone this repo and deploy to
  the merchant's own Vercel (or other) account, so they own uptime and
  billing. Procedure in `SHOPIFY.md`.
- **(c) A different host entirely.** Cloudflare Pages, Netlify, S3 + CDN.
  All fine — any static host works provided it serves `.glb`/`.hdr` files and
  sends CORS headers.

**A5. Cart now, or visual first?**

- *Visual first — recommended.* Get it rendering on the real page, confirm it
  looks right, wire checkout afterwards.
- *Cart now.* Read `CART-INTEGRATION.md` first: it requires the merchant to
  build a product with variants in Shopify admin **before** any code can be
  written.

### Section B — only if they chose "cart now" in A5

**B1. Does metal colour change the price?**
Yes → it must be a Shopify product option (up to 12 variants). No → it can be
a line item property (4 variants). This decides the entire product structure,
so ask before anything else.

**B2. Do you need separate inventory or SKUs per combination?**
Yes → variants are mandatory. No → a simpler structure is possible.

**B3. What are the real prices?**
The `980 / +350 / +450` figures in this repo are **placeholders from a demo**.
Never ship them as real prices.

### Section C — when configuring the section settings

**C1. Show the ring name inside the widget?** Default **off**. The product
page already renders a title; two titles looks broken.

**C2. Show a price inside the widget?** Default **off** — and *keep it off
until the cart is wired*. The widget's price is hardcoded and unrelated to
what Shopify charges. A number that disagrees with checkout is a trust
problem, not a cosmetic one.

**C3. Show the diamond shape picker?** Default **off**. Only `round` has a
model; the others render disabled.

**C4. Viewer height?** Default 560px. Taller reads as more premium on desktop;
on mobile it is capped at 70vh automatically.

---

## 3. Integration procedure

Only start once Section A is answered.

### Step 1 — Hosting (from A4)

If **(a) existing deployment**, the base URL is
`https://ring-viewer-app.vercel.app`. Skip to Step 2.

If **(b)/(c) own deployment**, follow `SHOPIFY.md`. `npm run build` outputs
`dist/`, and **that entire folder** is what gets hosted — it contains the JS,
CSS, models, HDR maps and the Draco decoder. Record the resulting origin, with
no trailing slash and no path.

**Verify hosting before going further:**

```bash
curl -sI https://YOUR-HOST/ring-viewer.js | grep -i access-control-allow-origin
```

This must print `Access-Control-Allow-Origin: *`. If it prints nothing, the
Shopify embed **will silently fail** — Three.js fetches the models
cross-origin and the browser will block them with no visible error.

Then open `https://YOUR-HOST/preview.html` in a browser. If a gold ring renders
and slowly spins, hosting is correct. Do not proceed until it does.

### Step 2 — Add the section file

1. Shopify admin → **Online Store → Themes**
2. On the target theme: **⋯ → Edit code**
3. In the **Sections** folder → **Add a new section**
4. Name it `ring-viewer`, so Shopify creates `sections/ring-viewer.liquid`
5. **Delete everything Shopify pre-fills**, then paste the entire contents of
   `shopify/ring-viewer.liquid` from this repo
6. **Save**

### Step 3 — Place it on the page

1. **Themes → Customize**
2. Navigate to the target page from A3
3. **Add section → Ring Viewer**
4. In its settings, paste the base URL into **Widget base URL**
5. Drag into position, then **Save**

The 3D viewer should appear in the editor immediately. If the section shows a
dashed "set the Widget base URL" placeholder, the URL field is still empty.

### Step 4 — Configure

Apply the Section C answers in the section settings. All of them are live —
none require a rebuild or redeploy.

---

## 4. Verification — do this, do not skip it

1. **Theme editor**: the ring renders, spins, and the halo / pavé / metal
   controls each visibly change the model.
2. **Live storefront**, not just the editor — open the real page.
3. **Browser console must be clean.** Specifically:
   - CORS errors → hosting headers are wrong, back to Step 1
   - 404 on a `.glb` → base URL has a trailing slash or a path on the end
   - 404 on `draco/*` → the `dist/draco/` folder was not deployed
4. **Mobile**: the layout stacks to a single column below 900px. Test on a
   real phone if at all possible — 3D on mobile is the risky case.
5. **Theme editor re-render**: change a section setting and confirm the viewer
   re-mounts instead of going blank.

Report what you actually observed. Do not claim it works because the code
looks correct.

---

## 5. Gotchas that have already caught people

| Symptom | Cause |
|---|---|
| Nothing renders, CORS errors in console | Host is not sending `Access-Control-Allow-Origin` |
| Blank viewer, 404 on `.glb` | Base URL has a trailing slash or a path — it must be a bare origin |
| Works today, breaks after a redeploy | A **deployment-specific** Vercel URL was used (`ring-viewer-abc123….vercel.app`). Use the stable alias instead |
| 401 or a login page on the asset URLs | Vercel **Deployment Protection** is enabled. Project Settings → Deployment Protection → disable for production |
| Ring loads but looks flat, no sparkle | `dist/env/*.hdr` is missing or blocked; the diamond refraction needs the HDR |
| Diamonds render as gold metal | Gem detection reads mesh names (`diamond`, `round`, `stone`, …). A GLB re-exported with generic names breaks it |
| Styling looks wrong inside the theme | Widget CSS is scoped under `.rv-root` and wins at specificity `(0,2,0)`. If a theme still overrides it, raise the widget rule — do **not** add global `!important` |
| Section settings do nothing on the live site | Settings are read at mount. The editor re-mounts live; the storefront needs a refresh |

### Do not

- **Do not** paste this into a *theme app extension* / app block. App-block
  JavaScript has a roughly 10 KB compressed limit and this bundle is ~1.3 MB.
  It must be a regular theme **section** that loads the script from an
  external origin.
- **Do not** enable the widget's price display before the cart is wired (C2).
- **Do not** re-add the star-rating and review-count block that was
  deliberately removed. It displayed a fabricated "128 Reviews" at five stars.
  Showing invented review counts to real shoppers is deceptive, and in many
  jurisdictions illegal. Use a real reviews app instead.
- **Do not** commit the merchant's store URL, API tokens or admin credentials
  to this repo.
- **Do not** upload the `.glb` or `.hdr` files as Shopify theme assets.
  Shopify rejects `.hdr`, and theme assets are the wrong home for large
  binaries.

---

## 6. Phase 2 — the cart

Read `CART-INTEGRATION.md`. In short: the configurator is display-only.
Making it transactional means the merchant first creates a Shopify product
with variants covering the sellable combinations, after which the widget
resolves the current selection to a variant ID and posts it to `/cart/add.js`.

**The merchant's admin work blocks the code work.** Ask B1–B3 and get the
product built before writing anything.

---

## 7. Working on the widget itself

```bash
npm install
npm run dev     # local harness at localhost:5173, mirrors the Shopify markup
npm run build   # outputs dist/ — the complete deployable set
npm run lint
```

`index.html` is a dev harness rendering the same markup the Liquid section
emits, so local preview matches production.

**If you change the widget you must rebuild and redeploy.** Shopify loads the
built bundle from the host, not from this repo.

Filenames are intentionally **unhashed** (`ring-viewer.js`, not
`ring-viewer.a1b2c3.js`) so the Liquid URLs never change. That is why the
deploy config caches the JS and CSS for only five minutes while the models,
HDR maps and Draco decoder are cached for a year. Do not "fix" that by making
everything immutable — redeploys would then never reach visitors.

### Asset pipeline notes

The models are **Draco-compressed** and the decoder is **self-hosted** at
`public/draco/` rather than loaded from Google's CDN. If you replace a model,
compress it the same way and verify the gem facets survived:

```bash
npx @gltf-transform/cli draco in.glb out.glb --quantize-normal 12 --quantize-position 16
```

Then compare vertex and triangle counts before and after with
`npx @gltf-transform/cli inspect`. **They must be identical.** If they drop,
Draco welded vertices, which merges the facet normals the refraction shader
depends on and makes the diamond look like frosted glass.
