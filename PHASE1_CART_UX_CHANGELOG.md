# ZARIAH Studio — Phase 1 Cart & Shopping UX

## Changes made
- Added a Shopping Bag entry with live item count to the homepage mobile navigation.
- Added a Shopping Bag entry with live item count to the All Bags mobile navigation.
- Added a shared `zariah-cart.js` helper using the existing `zariah_cart_v1` localStorage key, preserving existing cart data compatibility.
- Added mobile-only Add to Bag controls to the homepage product modal, dynamic product detail view, and All Bags product cards.
- Preserved the existing Reserve Your Bag / WhatsApp enquiry flows.
- Kept the new card and product-detail Add to Bag controls hidden on desktop to avoid changing the desktop layout.
- Moved the homepage floating Bag control higher on mobile to avoid overlapping the floating WhatsApp control.
- Hardened Cart page rendering by escaping customer/product values, constraining image URLs, normalizing IDs, and limiting quantities to 1–10.
- Added storage-event/count synchronization and basic storage failure handling in the shared cart helper.

## Verification completed
- Parsed 116 inline JavaScript blocks with Node.js: 0 syntax errors.
- Parsed the shared `zariah-cart.js` helper with Node.js: passed.
- Ran a Node.js smoke test for adding the same SKU twice, quantity increment, SKU normalization, and cart count: passed.
- Checked the expected mobile Bag links, Add to Bag controls, safe Cart rendering, and helper inclusion: passed.

## Not verified
- No live browser/device visual regression test has been performed.
- No Supabase runtime, stock validation, order persistence, or production deployment test has been performed.
- This phase does not yet add server-authoritative price/stock checks or database order creation. Those belong to the next checkout/backend phase.

## Files changed
- `index.html`
- `collections/all-bags/index.html`
- `pages/cart/index.html`
- `zariah-cart.js` (new)
- `collections/all-bags/index.html` (catalogue availability mapping)
- `pages/checkout/index.html` and `products/**/index.html` include the shared cart helper.

## Phase 2 — Secure guest checkout (implementation added; backend migration pending)
- Added `supabase/migrations/202611070005_secure_website_checkout.sql` with a public-safe `create_website_order` RPC.
- The RPC validates customer data and quantities, resolves products by SKU/slug, ignores client-supplied prices, reads published product prices from Supabase, checks counted inventory, snapshots order items, creates a guest customer/order, records the initial tracking event, and supports idempotent retries.
- Updated guest checkout to call the RPC before opening WhatsApp. The WhatsApp message now includes the database-generated order number and server-calculated subtotal.
- Extended the Admin Panel order query and order detail modal to show the saved customer district, delivery address, and optional email.
- Cart data is cleared only after the RPC confirms that the order was created/reused.
- The customer-facing flow remains guest checkout + WhatsApp confirmation + Cash on Delivery. Delivery charges remain unconfirmed and are not added to the order total at this stage.
- IMPORTANT: Apply migration `202611070005_secure_website_checkout.sql` in the linked Supabase project's SQL Editor before testing this checkout. Until then the RPC will not exist and checkout will show a safe error rather than pretending an order was placed.
- Stock is checked but not reserved or decremented by this phase. Final stock reservation/decrement rules should be implemented alongside the admin fulfilment state transitions to avoid accidental inventory changes before manual order confirmation.
