# Phase 12 — Cart System Consolidation

## Objective

Use one canonical cart implementation across storefront product pages, collection cards, the cart page, and checkout without changing the cart storage key or the existing checkout contract.

## Changes

- Expanded `zariah-cart.js` into the single cart API for normalized reads, item counts, subtotal calculation, add, quantity updates, item removal, and clear.
- Preserved the existing `zariah_cart_v1` localStorage key and item shape (`id`, `name`, `price`, `image`, `qty`) for backward compatibility.
- Replaced the separate product-detail Add to Bag implementation with calls to `window.ZariahCart.add()`.
- Reworked the cart page to use the shared API for reads, quantity changes, removal, totals, and badge updates.
- Reworked checkout to read and clear the cart through the shared API. The secure Supabase RPC, order payload, idempotency behavior, and WhatsApp confirmation handoff remain unchanged.
- Removed duplicated cart-count snippets from storefront pages and load the shared cart script once on each storefront route that displays a cart count.
- Ensured the shared cart script executes before product Add to Bag handlers. Cart and checkout pages load the small shared API synchronously before their inline page logic.
- Added cross-tab storage synchronization for cart badge updates and cart-page refresh.

## Compatibility and scope

- No visual redesign or CSS changes were made.
- No database schema, Supabase RPC, pricing, stock, or order lifecycle changes were made.
- Existing `zariah_cart_v1` browser storage remains readable; no migration or cart reset is required.
- Admin-app's isolated cart-count snippet was left untouched because it is outside the customer storefront cart flow.

## Validation

- 35 storefront HTML pages checked for exactly one shared cart script where a cart badge is present.
- 18 product detail pages checked for shared cart script ordering before the product gallery / Add to Bag scripts.
- Inline JavaScript syntax checks passed (JSON-LD structured-data blocks excluded from JavaScript parsing).
- External JavaScript syntax checks passed for the shared cart API, product Add to Bag handler, product gallery, and homepage scripts.
- Cart API smoke tests passed for add, duplicate merge, count, subtotal, quantity cap, remove, clear, and badge updates.
- ZIP integrity checked after packaging.

## Not tested

- No live browser, production deployment, Supabase environment, or physical mobile-device test was available in this phase.
- This phase consolidates cart state and behavior; it does not claim a measured Core Web Vitals or FPS improvement.
