-- Lock direct browser access to order tracking; the existing Edge Function uses service_role.
begin;
revoke all on function public.lookup_order_tracking(text, text) from public, anon, authenticated;
grant execute on function public.lookup_order_tracking(text, text) to service_role;
commit;
