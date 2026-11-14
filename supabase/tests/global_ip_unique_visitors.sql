-- Run after 20261114000300_global_ip_unique_visitors.sql as a database owner.
-- Uses a random test hash and rolls back all test rows; no production analytics data is changed.
begin;

do $$
declare
  v_hash text := repeat(md5(gen_random_uuid()::text), 2);
  v_count bigint;
begin
  perform visitor_intelligence_private.record_ip_visit(v_hash);
  perform visitor_intelligence_private.record_ip_visit(v_hash);

  select count(*) into v_count
  from visitor_intelligence_private.ip_visitor_windows
  where ip_hash = v_hash;

  if v_count <> 1 then
    raise exception 'Repeated visits within 24 hours must create exactly one visitor window; found %', v_count;
  end if;

  update visitor_intelligence_private.ip_visitor_windows
  set first_seen_at = now() - interval '25 hours',
      last_seen_at = now() - interval '25 hours'
  where ip_hash = v_hash;

  perform visitor_intelligence_private.record_ip_visit(v_hash);

  select count(*) into v_count
  from visitor_intelligence_private.ip_visitor_windows
  where ip_hash = v_hash;

  if v_count <> 2 then
    raise exception 'A visit after 24 hours must create a new visitor window; found %', v_count;
  end if;
end;
$$;

rollback;
