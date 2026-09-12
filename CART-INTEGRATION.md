# Cart integration (Phase 2)

The configurator currently **cannot sell anything**. This document specifies
how to connect it to Shopify checkout.

> **Read this before writing code.** The merchant has admin work to do first,
> and one decision (§2) determines the entire product structure. Getting it
> wrong means rebuilding the product catalogue.

---

## 1. What is actually missing

A shopper picks Halo + Pavé + Rose Gold, sees the ring, and then has no way to
buy *that* combination. The widget's state and Shopify's checkout are
disconnected:

```
[3D widget]  Halo + Pavé + Rose Gold   ──✗──   [Shopify]  "Ring — $980"
```

Two specific problems:

1. **No Add to Cart.** The widget's CTA button is inert (and hidden by
   default).
2. **The price is fiction.** `priceBase + priceHalo + pricePave` is hardcoded
   JavaScript in `src/widget/config.ts`, seeded from a demo. It has no
   relationship to what Shopify charges. This is why the price display
   defaults to off — showing a number that disagrees with checkout is worse
   than showing none.

---

## 2. The decision that comes first

**Does metal colour change the price?**

Shopify can only sell **variants**. How many you need depends entirely on this:

| Answer | Structure | Variants |
|---|---|---|
| **Yes** — metal affects price or needs its own SKU/inventory | Three product options: Setting, Band, Metal | 2 × 2 × 3 = **12** |
| **No** — metal is cosmetic, same price, same stock | Two product options: Setting, Band. Metal becomes a **line item property** | 2 × 2 = **4** |

Ask the merchant. Do not assume. Twelve variants means twelve prices, twelve
SKUs and twelve inventory counts to maintain forever; if metal genuinely does
not change cost, four is a much kinder catalogue.

Also confirm:
- **Real prices** for every combination. The `980 / +350 / +450` numbers in
  this repo are placeholders.
- Whether they need **ring size** — if so it is another option, which
  multiplies the variant count again (12 × ~15 sizes = 180). At that scale,
  strongly consider making size a line item property instead.

---

## 3. Merchant admin work (blocks all code)

In Shopify admin → **Products → Add product**:

1. Create the product (e.g. "Build Your Own Engagement Ring").
2. Add options with **exactly** these values, or record whatever they use:

   | Option name | Values |
   |---|---|
   | `Setting` | `Solitaire`, `Halo` |
   | `Band` | `Plain`, `Pavé` |
   | `Metal` *(only if §2 = yes)* | `14k Yellow Gold`, `14k White Gold`, `14k Rose Gold` |

3. Set the real price, SKU and inventory on **every** generated variant.
4. Publish the product.

The exact option names and values matter — the widget matches against them.
If the merchant prefers different wording, that is fine, but it must be
recorded and configured in the section settings (§5).

---

## 4. How the wiring works

```
Liquid  ──inject product.variants as JSON──▶  widget
widget  ──match current selection to a variant──▶  variant id + real price
widget  ──POST /cart/add.js──▶  Shopify cart  ──▶  checkout
```

Three code changes: inject the data, resolve the selection, post to the cart.

---

## 5. Implementation

### 5a. Inject variant data (Liquid)

In `shopify/ring-viewer.liquid`, inside the section and only when a product is
in scope, add a JSON script tag next to the mount div:

```liquid
{%- if product -%}
  <script type="application/json" data-ring-viewer-variants>
    {
      "productId": {{ product.id }},
      "options": {{ product.options | json }},
      "moneyFormat": {{ shop.money_format | json }},
      "variants": {{ product.variants | json }}
    }
  </script>
{%- endif -%}
```

`product.variants | json` gives each variant's `id`, `title`, `options`,
`price` (in cents), and `available`.

Add section settings so option values are configurable rather than hardcoded:

| Setting id | Default |
|---|---|
| `opt_setting_name` | `Setting` |
| `opt_band_name` | `Band` |
| `opt_metal_name` | `Metal` |
| `val_solitaire` / `val_halo` | `Solitaire` / `Halo` |
| `val_plain` / `val_pave` | `Plain` / `Pavé` |
| `val_yellow` / `val_white` / `val_rose` | `14k Yellow Gold` / … |

Pass them through as `data-*` attributes exactly like the existing settings.

> **Alternative if matching proves fragile:** skip value matching entirely and
> add twelve text settings, one per combination, where the merchant pastes the
> variant ID directly. Uglier to configure, impossible to get wrong.

### 5b. Resolve the selection to a variant

New module, `src/widget/variants.ts`:

```ts
export interface ShopifyVariant {
  id: number;
  title: string;
  options: string[];
  price: number;      // cents
  available: boolean;
}

/** Find the variant whose option values match the current selection. */
export function matchVariant(
  variants: ShopifyVariant[],
  optionNames: string[],           // product.options, in order
  wanted: Record<string, string>,  // { Setting: 'Halo', Band: 'Pavé', ... }
): ShopifyVariant | null {
  return variants.find((v) =>
    optionNames.every((name, i) => {
      const want = wanted[name];
      return want === undefined || v.options[i] === want;
    }),
  ) ?? null;
}
```

Read the JSON blob in `mount.tsx` (query the sibling
`[data-ring-viewer-variants]`, `JSON.parse` its `textContent`), pass it into
`RingConfigurator`, and derive the current variant with `useMemo` from
`hasHalo` / `hasPave` / `metalColor`.

Then:

- **Price** comes from `variant.price / 100`, formatted with the shop's money
  format — never from the hardcoded config values. Delete `priceBase`,
  `priceHalo` and `pricePave` once this lands, so they cannot be shown by
  accident.
- **Unavailable combinations**: if `matchVariant` returns `null` or
  `available` is false, disable that toggle and label it "Unavailable"
  rather than letting the shopper select something unbuyable.

### 5c. Add to cart

```ts
async function addToCart(variantId: number, properties: Record<string, string>) {
  const res = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: variantId, quantity: 1, properties }] }),
  });
  if (!res.ok) throw new Error(`Cart add failed: ${res.status} ${await res.text()}`);
  return res.json();
}
```

`properties` carries anything that is **not** a priced variant option — metal
if §2 was "no", engraving text, or the diamond shape once it works:

```ts
{ 'Metal': '14k Rose Gold', 'Diamond Shape': 'Round' }
```

Properties whose key starts with `_` are hidden from the customer but kept on
the order — useful for internal config strings.

### 5d. Refresh the theme's cart UI

This is **theme-specific** and the most common place to get stuck. After a
successful add, the cart icon/drawer must update or the shopper thinks nothing
happened. In rough order of preference:

1. Dawn and most OS 2.0 themes: re-fetch the cart drawer section and dispatch
   the theme's own event —
   `document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }))`
2. Some themes listen for `cart:updated` or expose a global cart object.
3. **Universal fallback:** `window.location.href = '/cart';`

Start with the fallback to prove the add works, then refine per theme.

---

## 6. Things that will bite

| Issue | Handling |
|---|---|
| Prices are in **cents** | `variant.price / 100`; never display raw |
| Currency formatting | Use `shop.money_format` from Liquid, not a hardcoded `$` |
| Multi-currency stores | Prices shift with the presentment currency; always read from the injected data at render time |
| Sold-out combinations | Check `variant.available`; disable rather than fail at checkout |
| Section placed on a **non-product** page | `product` is nil in Liquid — the widget must degrade to display-only, not crash |
| Duplicate add-to-cart | Disable the button while the request is in flight |
| Cart add returns 422 | Usually sold out or an invalid variant ID; surface the message, do not swallow it |

---

## 7. Verification

1. Select each combination and confirm the displayed price matches the
   variant price in Shopify admin **exactly**.
2. Add to cart, then open `/cart` and confirm the correct variant, price and
   any line item properties appear.
3. Go through to checkout and confirm the total matches what the configurator
   showed. This is the whole point — do not skip it.
4. Try a sold-out variant and confirm it is disabled rather than erroring.
5. Confirm the section still renders on a page with no product in scope.

---

## 8. Definition of done

- [ ] Product with correct variants exists and is published
- [ ] Widget resolves every selection to a real variant
- [ ] Displayed price comes from Shopify, and hardcoded price config is deleted
- [ ] Add to Cart works and the theme's cart UI updates
- [ ] Sold-out combinations are disabled
- [ ] Checkout total matches the configurator, verified end to end
- [ ] `show_price` can finally be turned on, because it is now truthful
