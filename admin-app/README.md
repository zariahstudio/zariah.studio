# ZARIAH Studio Admin

This is an isolated React/Vite admin application. It does not modify the existing storefront HTML/CSS.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and the Supabase anon/public key from the correct `zariah-studio-sg` project.
3. From this directory run `npm install` and `npm run dev`.

Never use the Supabase `service_role` key in this application. The browser uses only the anon/public key and relies on database RLS.

## Current scope

- Email/password Supabase login.
- Profile role check before rendering admin tools.
- Product create/edit/archive, multiple image uploads, publish state.
- Collection create/edit/activate/deactivate.
- Inventory quantity updates.
- Responsive neutral taupe/cream/champagne admin styling.

Orders, payments, customers, memberships, reporting and activity history are part of the next implementation phase. They must be added with server-validated order creation and payment/discount logic; do not implement authoritative financial rules only in the browser.

## Deployment safety

Do not deploy this app to production until the Netlify site configuration, route handling, environment variables, security policies and regression tests are reviewed. Keep it on the feature branch.