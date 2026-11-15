# ZARIAH Studio Owner App

Separate mobile-first React/Vite PWA foundation, isolated from the storefront and existing Admin Panel.

## Included
- Existing Supabase email/password authentication.
- Owner gate requiring the existing profiles.role value admin.
- Read-only counts for orders, products and customers.
- Responsive mobile navigation and planned module placeholders.
- PWA manifest and static-shell service worker.
- Read-only Orders list and order detail screens.
- POS counter sale submission through an owner-only idempotent RPC; use creates real business records.
- A4, 80mm and 58mm browser-print receipt layouts.

## Local setup
1. Copy .env.example to .env.local.
2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the existing project's URL and publishable/anon key.
3. Run npm install, then npm run dev.

## Build and hosting
- Run npm ci, then npm run build.
- Output is isolated in owner-app/dist; Vite base is /owner/.
- The main GitHub Actions workflow publishes compiled output to the repository's owner/ directory for cPanel Git deployment.
- The cPanel deployment script stages and verifies owner/ alongside storefront and admin/; it refuses clean deployment if either app build is missing.
- Verify HTTPS and /owner/ after cPanel Git deployment.

## Security notes
The client-side admin role gate is not a replacement for database authorization. Existing RLS policies and RPC grants must be reviewed before exposing sensitive data or enabling writes. Count queries may return unavailable when existing RLS denies access. No service-role key is permitted in frontend code.

## Release verification still required
- Sign in with the actual owner account and verify the admin profile role.
- Verify Orders list/detail against production data without modifying records.
- POS submission creates a real sale, payment and potentially stock movement. Do not test with a live transaction without explicit owner approval.
- Test receipt output on target Android printers; browser print support alone does not prove hardware compatibility.
- Confirm /owner/ is live after cPanel Git deployment and verify static assets, manifest and service worker.