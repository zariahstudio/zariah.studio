-- Browser order lookups must go through the rate-limited zariah-public-orders Edge Function.
-- That function uses the service-role client, so the public RPC can be restricted safely.
begin;

revoke all on function public.lookup_order_tracking(text, text) from public, anon, authenticated;
grant execute on function public.lookup_order_tracking(text, text) to service_role;

commit;
