-- Trigger functions must not be callable directly through the exposed PostgREST API.
revoke all on function public.prepare_order_item_metadata() from public, anon, authenticated;
revoke all on function public.reserve_website_order_inventory() from public, anon, authenticated;
revoke all on function public.apply_website_order_inventory_transition() from public, anon, authenticated;
