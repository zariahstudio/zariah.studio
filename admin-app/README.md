# ZARIAH Studio Admin

An isolated React/Vite admin application. It does not modify the existing storefront HTML/CSS.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and the Supabase Publishable key from the Singapore `zariah-studio-sg` project.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` locally for the one-time image migration only.
4. Run `npm install` and `npm run dev`.

Never put a Supabase `service_role` key in this browser application. The app uses only the Publishable key and relies on database RLS.

## Import legacy product images

The script `scripts/migrate-product-images.mjs` reads existing product images from the public GitHub repository's `main` branch and uploads them to the `product-images` Supabase Storage bucket, then registers them in `product_images`.

Run locally from this directory:

```bash
npm run migrate:images
```

The script signs in using the Admin email/password in the local `.env.local`; credentials are not committed. It is safe to re-run: storage uploads use the same product/file paths and image rows are upserted. Review the final uploaded/skipped/failed counts. Some products in the current repository have only a front image; the script does not fabricate missing angles.

## Current scope

- Email/password Supabase login.
- Profile role check before rendering admin tools.
- Product create/edit/archive, multiple image uploads, publish state.
- Collection create/edit/activate/deactivate.
- Inventory quantity updates.
- Responsive neutral taupe/cream/champagne admin styling.

Orders and tracking, digital receipts, partial/full payment recording, in-store POS, customer profiles, loyalty, sales intelligence and inventory movement reporting are implemented in the current Phase 16 Admin app. Financial writes are performed by database RPCs; never expose the Supabase service_role key in the browser.

## Deployment safety

Do not deploy this app to production until the Netlify site configuration, route handling, environment variables, security policies and regression tests are reviewed. Keep it on the feature branch.
## Orders & tracking management (added 2026-11-07)

The Orders section now lists orders with customer name/phone, order date, total, payment state and fulfilment status. Open **Manage tracking** to update the order status, courier name, courier tracking number and customer-visible event message. Each save writes the order fields and a row in `order_tracking_events`; the storefront `/pages/track-order/` page reads those events through the customer-safe `lookup_order_tracking` RPC.

Before enabling this in a live environment, apply `supabase/migrations/202611070004_order_tracking_lookup.sql` in the Supabase SQL Editor. The admin app uses the existing authenticated browser client and the existing staff/admin RLS policies; never add a `service_role` key to the frontend. Shipped status requires both courier name and tracking number. The admin UI does not verify or change payment status.

## Digital receipts, payments and POS (Phase 13)

Before opening the Payments section in the deployed admin app, apply the SQL migration `supabase/migrations/202611080001_digital_receipts_pos_payments.sql` in the Supabase SQL Editor. It adds automatic receipt numbers and the authenticated `record_order_payment` and `create_pos_sale` RPCs. The Payments section supports due tracking, partial/full payment recording, in-store POS sales, print-to-PDF receipts and prefilled WhatsApp sharing. WhatsApp messages are not sent automatically; staff must tap Send unless a separate approved WhatsApp Business Platform integration is configured.


## Live schema compatibility (2026-11-08)

The live project was originally created from a legacy schema and retains compatibility columns alongside the current Phase 16 columns. Apply `supabase/migrations/202611080003_admin_ui_schema_compatibility.sql` after the Phase 13 and Phase 16 migrations. It keeps legacy and current partial-payment status values readable, synchronises paid balances from the payment ledger, supports the Admin UI's Cash-on-Delivery payment method, and adds the aggregate `cost_bdt` field used by Sales Intelligence. Existing component cost breakdown columns are preserved.

A GitHub Actions workflow now runs `npm run build` inside `admin-app/` for Admin app changes. The Admin app must be deployed as a separate Netlify site with base directory `admin-app`, build command `npm run build`, and publish directory `dist`; do not change the existing storefront site's build settings.
