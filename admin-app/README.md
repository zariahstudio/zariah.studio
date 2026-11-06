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

Orders, payments, customers, memberships, reporting and activity history are reserved for the next implementation phase. They must be implemented with server-validated order creation and payment/discount logic; do not implement authoritative financial rules only in the browser.

## Deployment safety

Do not deploy this app to production until the Netlify site configuration, route handling, environment variables, security policies and regression tests are reviewed. Keep it on the feature branch.