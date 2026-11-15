# Owner App Security Review

Reviewed against the live Supabase project on 2026-11-15. This document records findings only; no production SQL, grants, policies, migrations, or Auth settings were changed.

## Confirmed controls

- RLS is enabled on the reviewed public business tables: profiles, orders, order_items, products, customers, payments, inventory, inventory_movements, expenses, business_investments, and activity_logs.
- `private.is_admin()` checks the authenticated user's `profiles.role = 'admin'`.
- `public.is_staff_or_admin()` checks for `admin` or `staff`.
- Existing table policies intentionally allow staff/admin access to orders, order items, payments and customers. Products allow public reads only for published items; admin-only write policies exist.
- Owner App now verifies the authenticated user with Supabase Auth `getUser()` before looking up the user's profile role. The UI admits only `admin`.

## Important distinction

The Owner App's role gate is a user-interface gate, not a new database security boundary. Existing staff access through the current Admin backend must not be silently revoked: doing so could break existing staff operations. Any future Owner-only data or operation must use a database-enforced admin-only policy or a dedicated server-side RPC that checks `private.is_admin()`. Do not rely on hiding controls in React.

## RPC review

The following existing SECURITY DEFINER functions were inspected. Their bodies call `public.is_staff_or_admin()`, so they intentionally authorize both staff and admins under the current model:

- `create_pos_sale(...)`
- `record_order_payment(...)`
- `adjust_inventory_stock(...)`
- `update_order_fulfilment(...)`

These functions contain input checks and transactional writes, but they do not implement owner-only authorization. Keep them unchanged until the existing Admin staff permission model is deliberately redesigned and tested.

## Advisor findings observed

- SECURITY DEFINER functions callable by anon/authenticated were flagged. The storefront SEO/catalogue functions appear intended for public use and need separate body/grant review before changing.
- Staff/admin operational RPCs were flagged for authenticated execution; their bodies do check staff/admin access. This advisor warning is not proof of an authorization bypass.
- Leaked-password protection is disabled in Auth settings.
- Three RLS-enabled tables without policies were reported: `public.public_api_rate_limits`, `visitor_intelligence_private.ip_visitor_windows`, and `visitor_intelligence_private.product_view_ip_dedup`. These may be intentionally service-only; confirm their access model before adding policies.

## Safe next implementation sequence

1. Confirm the actual owner account has an existing `profiles.role = 'admin'` profile.
2. Keep current shared Admin policies and staff workflows unchanged.
3. If Owner App needs a privileged aggregate or owner-only operation, add a dedicated narrowly scoped RPC with explicit `auth.uid()` and `private.is_admin()` checks, fixed `search_path`, minimal return fields, and least-privilege EXECUTE grants.
4. Review every function body and grants before exposing it through the Data API.
5. Test with separate admin, staff, and anonymous sessions in a non-production environment.
6. Only then consider production migration approval.

## Current release status

- Owner App build workflow passed on the feature branch.
- No production database changes, main-branch changes, merges, or deployments were made.
- Owner App write operations remain disabled.
