# ZARIAH Studio Owner App

Separate mobile-first React/Vite PWA foundation, isolated from the storefront and existing Admin Panel.

## Included
- Existing Supabase email/password authentication.
- Owner gate requiring the existing profiles.role value admin.
- Read-only counts for orders, products and customers.
- Responsive mobile navigation and planned module placeholders.
- PWA manifest and static-shell service worker.
- No order, product, POS, inventory, payment or finance write operations.

## Local setup
1. Copy .env.example to .env.local.
2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the existing project's URL and publishable/anon key.
3. Run npm install, then npm run dev.

## Build and hosting
- Run npm run build.
- Output is isolated in owner-app/dist; Vite base is /owner/.
- Do not point the current cPanel deployment at this directory.
- Configure HTTPS and hosting rewrite rules separately before deployment.

## Security notes
The client-side admin role gate is not a replacement for database authorization. Existing RLS policies and RPC grants must be reviewed before exposing sensitive data or enabling writes. Count queries may return unavailable when existing RLS denies access. No service-role key is permitted in frontend code.

## Next
Verify owner account and role; review exact RLS policies and RPC bodies; add tests in a non-production environment; enable read-only order details only after field-level access is verified; enable transactional writes only after authorization, idempotency and audit logging are proven. No production migrations or deployment changes are included.