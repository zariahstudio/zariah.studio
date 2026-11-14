-- Run after applying 20261114000100_lock_public_tracking_rpcs.sql.
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
end;
$$;
