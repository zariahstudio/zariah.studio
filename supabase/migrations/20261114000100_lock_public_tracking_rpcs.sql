-- ZARIAH Studio: route public tracking writes/lookups through rate-limited Edge Functions.
-- Edge Functions use the server-side service role; browser clients must not call these
-- SECURITY DEFINER functions directly. No table data is changed by this migration.
begin;

revoke all on function public.lookup_order_tracking(text, text) from public, anon, authenticated;
grant execute on function public.lookup_order_tracking(text, text) to service_role;

revoke all on function public.record_visitor_event(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_visitor_event(uuid, text, text, text, text, text) to service_role;

commit;
