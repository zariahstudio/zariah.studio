# ZARIAH Studio Admin

An isolated React/Vite admin application. It does not modify the existing storefront HTML/CSS.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and the Supabase Publishable key from the Singapore `zariah-studio-sg` project.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` locally for the one-time image migration only.
4. Run `npm install` and `npm run dev`.

Never put a Supabase `service_role` key in this browser application. The app uses only the Publishable key and relies on database RLS.

## Product image migration

Completed against the Singapore Supabase project on 2026-11-08: 43 source images were uploaded and registered for all 18 products. Every product has one front image; some source folders contain only a front image, and no missing angles were fabricated. The original 49 Storage objects were retained; the new product-linked objects are separate.

The legacy local script remains for controlled re-runs only. Do not run it unless you intend to refresh the same repository assets in Supabase Storage. It requires local Admin credentials in `.env.local`; never commit those credentials.

## Current scope

- Email/password Supabase login.
- Profile role check before rendering admin tools.
- Product create/edit/archive, multiple image uploads, publish state.
- Collection create/edit/activate/deactivate.
- Inventory quantity updates, counted/not-counted status and stock movement audit.
- Per-product purchase, packaging, inbound shipping and other direct-cost tracking.
- Operating expense entry and history.
- Capital / one-time investment and refundable advance tracking, kept separate from operating expenses and per-unit product costs.
- Finance overview for order value, amount recorded as paid, expenses and cash after expenses.
- POS order creation with transactional item and counted-stock handling.
- Order fulfilment status updates, courier details and customer-facing tracking events.
- Verified payment recording with receipt references and synchronised paid/due balances.
- Customer profile management with order counts and loyalty tier / points visibility.
- Payment ledger with verified collection summaries.
- Responsive neutral taupe/cream/champagne admin styling.

The order, payment, stock and loyalty write paths are enforced by database functions and RLS rather than browser-side authoritative calculations. Final net profit reporting, returns/refunds workflow, multi-item POS cart and physical stock count remain follow-up work.

## Deployment safety

Do not deploy this app to production until the Netlify site configuration, route handling, environment variables, security policies and regression tests are reviewed. Keep it on the feature branch.