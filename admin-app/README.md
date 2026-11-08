# ZARIAH Studio Admin

An isolated React/Vite admin application. It does not modify the existing storefront HTML/CSS.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and the Supabase Publishable key from the Singapore `zariah-studio-sg` project.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` locally for the one-time image migration only.
4. Run `npm ci` and `npm run dev` after the committed `package-lock.json` is available.

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

Orders, payments, customers, memberships, reporting and activity history are reserved for the next implementation phase. They must be implemented with server-validated order creation and payment/discount logic; do not implement authoritative financial rules only in the browser.

## Production deployment

GitHub Actions builds this app with the Vite base path `/admin/` and publishes the generated static files to the repository-root `admin/` directory for cPanel deployment. The cPanel deploy script copies only that built directory to `public_html/admin/`; it must never copy this `admin-app/` source directory into the public web root.

The build reads the Supabase Publishable/anon key from the existing public `storefront-config.js`. The GitHub Actions secret `VITE_SUPABASE_ANON_KEY` may optionally override it. Never use a Supabase `service_role` key in this browser app.

A successful static build does not mean the database is ready. Apply the required migrations, configure RLS, create an Auth user and assign the `admin` profile role before operational use. Test login, product access, inventory and each enabled workflow before using it for live orders or payments.
## Orders & tracking management (added 2026-11-07)

The Orders section now lists orders with customer name/phone, order date, total, payment state and fulfilment status. Open **Manage tracking** to update the order status, courier name, courier tracking number and customer-visible event message. Each save writes the order fields and a row in `order_tracking_events`; the storefront `/pages/track-order/` page reads those events through the customer-safe `lookup_order_tracking` RPC.

Before enabling this in a live environment, apply `supabase/migrations/202611070004_order_tracking_lookup.sql` in the Supabase SQL Editor. The admin app uses the existing authenticated browser client and the existing staff/admin RLS policies; never add a `service_role` key to the frontend. Shipped status requires both courier name and tracking number. The admin UI does not verify or change payment status.

## Digital receipts, payments and POS (Phase 13)

Before opening the Payments section in the deployed admin app, apply the SQL migration `supabase/migrations/202611080001_digital_receipts_pos_payments.sql` in the Supabase SQL Editor. It adds automatic receipt numbers and the authenticated `record_order_payment` and `create_pos_sale` RPCs. The Payments section supports due tracking, partial/full payment recording, in-store POS sales, print-to-PDF receipts and prefilled WhatsApp sharing. WhatsApp messages are not sent automatically; staff must tap Send unless a separate approved WhatsApp Business Platform integration is configured.
