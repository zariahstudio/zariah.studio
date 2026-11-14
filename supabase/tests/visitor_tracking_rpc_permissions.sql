-- Run after applying 20261114000100_lock_public_tracking_rpcs.sql and 20261114000300_global_ip_unique_visitors.sql.
-- This is an assertion-only test; it performs no data or schema mutations.
do $$
begin
  if has_function_privilege('anon', 'public.lookup_order_tracking(text,text)', 'EXECUTE') then
    raise exception 'anon must not execute lookup_order_tracking directly';
  end if;
  if has_function_privilege('authenticated', 'public.lookup_order_tracking(text,text)', 'EXECUTE') then
    raise exception 'authenticated must not execute lookup_order_tracking directly';
  end if;
  if not has_function_privilege('service_role', 'public.lookup_order_tracking(text,text)', 'EXECUTE') then
    raise exception 'service_role must execute lookup_order_tracking';
  end if;

  if has_function_privilege('anon', 'public.record_visitor_event(uuid,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'anon must not execute record_visitor_event directly';
  end if;
  if has_function_privilege('authenticated', 'public.record_visitor_event(uuid,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'authenticated must not execute record_visitor_event directly';
  end if;
  if not has_function_privilege('service_role', 'public.record_visitor_event(uuid,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'service_role must execute record_visitor_event';
  end if;

  if has_function_privilege('anon', 'public.record_visitor_event_with_ip(uuid,text,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'anon must not execute record_visitor_event_with_ip';
  end if;
  if has_function_privilege('authenticated', 'public.record_visitor_event_with_ip(uuid,text,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'authenticated must not execute record_visitor_event_with_ip';
  end if;
  if not has_function_privilege('service_role', 'public.record_visitor_event_with_ip(uuid,text,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'service_role must execute record_visitor_event_with_ip';
  end if;

  if has_function_privilege('anon', 'public.record_product_view_with_ip(uuid,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'anon must not execute record_product_view_with_ip';
  end if;
  if has_function_privilege('authenticated', 'public.record_product_view_with_ip(uuid,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'authenticated must not execute record_product_view_with_ip';
  end if;
  if not has_function_privilege('service_role', 'public.record_product_view_with_ip(uuid,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'service_role must execute record_product_view_with_ip';
  end if;

  if has_table_privilege('anon', 'visitor_intelligence_private.ip_visitor_windows', 'SELECT') or
     has_table_privilege('authenticated', 'visitor_intelligence_private.ip_visitor_windows', 'SELECT') or
     has_table_privilege('service_role', 'visitor_intelligence_private.ip_visitor_windows', 'SELECT') then
    raise exception 'IP visitor windows must not be directly readable through database roles';
  end if;

  if has_function_privilege('anon', 'visitor_intelligence_private.record_ip_visit(text)', 'EXECUTE') or
     has_function_privilege('authenticated', 'visitor_intelligence_private.record_ip_visit(text)', 'EXECUTE') or
     has_function_privilege('service_role', 'visitor_intelligence_private.record_ip_visit(text)', 'EXECUTE') then
    raise exception 'IP visitor helper must not be directly executable by API roles';
  end if;
end;
$;
