-- ZARIAH Studio: count one unique visitor per IP across the entire site in each rolling 24-hour window.
-- Only keyed HMAC-SHA256 IP hashes are stored. Raw IP addresses are never persisted.
-- Event rows remain intact so page, product, cart and checkout analytics continue to work.
begin;

create table if not exists visitor_intelligence_private.ip_visitor_windows (
  id bigint generated always as identity primary key,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists ip_visitor_windows_lookup_idx
  on visitor_intelligence_private.ip_visitor_windows (ip_hash, last_seen_at desc);
create index if not exists ip_visitor_windows_last_seen_idx
  on visitor_intelligence_private.ip_visitor_windows (last_seen_at desc);

alter table visitor_intelligence_private.ip_visitor_windows enable row level security;
revoke all on table visitor_intelligence_private.ip_visitor_windows from public, anon, authenticated, service_role;

create or replace function visitor_intelligence_private.record_ip_visit(p_ip_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id bigint;
  v_last_seen timestamptz;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid visitor IP hash.' using errcode = '22023';
  end if;

  -- Serialize requests from the same IP hash to avoid duplicate 24-hour windows.
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  select id, last_seen_at
    into v_id, v_last_seen
  from visitor_intelligence_private.ip_visitor_windows
  where ip_hash = p_ip_hash
  order by last_seen_at desc
  limit 1
  for update;

  if found and v_last_seen >= now() - interval '24 hours' then
    update visitor_intelligence_private.ip_visitor_windows
      set last_seen_at = now()
    where id = v_id;
  else
    insert into visitor_intelligence_private.ip_visitor_windows (ip_hash)
      values (p_ip_hash);
  end if;
end;
$function$;

revoke all on function visitor_intelligence_private.record_ip_visit(text) from public, anon, authenticated, service_role;

create or replace function public.record_visitor_event_with_ip(
  p_visitor_id uuid,
  p_ip_hash text,
  p_event_type text,
  p_page_path text,
  p_referrer_host text,
  p_device_type text,
  p_product_slug text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_recorded boolean;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid visitor IP hash.' using errcode = '22023';
  end if;

  v_recorded := public.record_visitor_event(
    p_visitor_id,
    p_event_type,
    p_page_path,
    p_referrer_host,
    p_device_type,
    p_product_slug
  );

  if v_recorded is distinct from true then
    return false;
  end if;

  perform visitor_intelligence_private.record_ip_visit(p_ip_hash);
  return true;
end;
$function$;

revoke all on function public.record_visitor_event_with_ip(uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_visitor_event_with_ip(uuid,text,text,text,text,text,text) to service_role;

create or replace function public.visitor_intelligence_summary(p_since timestamptz default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_staff_or_admin() then
    raise exception 'Staff access required.' using errcode='42501';
  end if;

  with filtered as (
    select * from public.visitor_events
    where p_since is null or created_at >= p_since
  ),
  sessions as (
    select visitor_id,
      count(*) filter (where event_type in ('page_view','product_view')) as page_count,
      min(created_at) as first_seen, max(created_at) as last_seen
    from filtered group by visitor_id
  ),
  session_first_touch as (
    select distinct on (visitor_id) visitor_id,
      coalesce(referrer_host,'Direct / None') as referrer_name,
      device_type
    from filtered
    order by visitor_id, created_at asc
  ),
  referrer_rows as (
    select referrer_name as name,count(*)::bigint as count
    from session_first_touch group by referrer_name order by count desc limit 8
  ),
  product_rows as (
    select coalesce(product_slug,page_path) as name,count(*)::bigint as count
    from filtered where event_type='product_view'
    group by coalesce(product_slug,page_path) order by count desc limit 8
  ),
  device_rows as (
    select device_type as name,count(*)::bigint as count
    from session_first_touch group by device_type order by count desc
  )
  select jsonb_build_object(
    'total_events',(select count(*) from filtered),
    'total_sessions',(select count(*) from sessions),
    'unique_visitors',(
      select count(*) from visitor_intelligence_private.ip_visitor_windows
      where p_since is null or last_seen_at >= p_since
    ),
    'page_views',(select count(*) from filtered where event_type in ('page_view','product_view')),
    'product_views',(select count(*) from filtered where event_type='product_view'),
    'cart_views',(select count(*) from filtered where event_type='cart_view'),
    'checkout_views',(select count(*) from filtered where event_type='checkout_view'),
    'bounce_rate',coalesce((select round(100.0 * count(*) filter (where page_count <= 1) / nullif(count(*),0),1) from sessions),0),
    'avg_session_seconds',(select round(avg(extract(epoch from (last_seen-first_seen)))::numeric,1) from sessions where last_seen>first_seen),
    'referrers',coalesce((select jsonb_agg(jsonb_build_object('name',name,'count',count) order by count desc) from referrer_rows),'[]'::jsonb),
    'top_products',coalesce((select jsonb_agg(jsonb_build_object('name',name,'count',count) order by count desc) from product_rows),'[]'::jsonb),
    'devices',coalesce((select jsonb_agg(jsonb_build_object('name',name,'count',count) order by count desc) from device_rows),'[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

commit;
