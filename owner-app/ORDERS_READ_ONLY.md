# Orders module (read-only)

The Owner App Orders screen uses two owner-only PostgreSQL RPCs:

- `public.owner_app_list_orders(text,text,integer,integer)`
- `public.owner_app_get_order(uuid)`

The reviewed SQL is retained in `supabase/migrations/202611150001_owner_app_readonly_orders.sql`.

## Production status

The two RPCs have been applied to the production Supabase project `keuqvqnhxlpsglsjfopd` using the reviewed SQL. Read-only catalog verification confirmed both functions exist, are SECURITY DEFINER, and have EXECUTE granted to `authenticated` but not to `anon` or `PUBLIC`.

The functions check the authenticated user's admin role using `private.is_admin()`, use an empty search_path, and return only the fields needed by the Owner App. They do not update order, payment, inventory, or customer records.

## Screen capabilities

The screen supports searching by order number, customer name, or phone; filtering by order status; viewing order items and payment history; and reviewing courier details. There are no edit, status-change, payment, cancellation, or delete controls.

## Verification limitation

The database function definitions and grants have been verified. A real end-to-end UI test still requires the owner to sign in through the deployed or locally configured Owner App with their own credentials. No credentials were requested or accessed during this work.

Do not expose the underlying tables directly to the Owner App as a workaround. Keep the existing staff policies and operational RPCs unchanged.
