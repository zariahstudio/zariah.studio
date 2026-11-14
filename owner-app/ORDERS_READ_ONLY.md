# Orders module (read-only)

The Owner App Orders screen uses two owner-only PostgreSQL RPCs:

- `public.owner_app_list_orders(text,text,integer,integer)`
- `public.owner_app_get_order(uuid)`

The proposed SQL is in `supabase/migrations/202611150001_owner_app_readonly_orders.sql`.

## Important deployment gate

The migration has been committed to the feature branch for review only. It has NOT been applied to the production Supabase project. Until an authorized operator reviews and applies it, the Orders screen will report that the read-only API is not installed.

The functions check the authenticated user's admin role using `private.is_admin()`, are SECURITY DEFINER with an empty search_path, return only the fields needed by the Owner App, and grant EXECUTE only to authenticated users. They do not update order, payment, inventory, or customer records.

The screen supports searching by order number, customer name, or phone; filtering by order status; viewing order items and payment history; and reviewing courier details. There are no edit, status-change, payment, cancellation, or delete controls.

Do not expose the underlying tables directly to the Owner App as a workaround. Keep the existing staff policies and operational RPCs unchanged.
