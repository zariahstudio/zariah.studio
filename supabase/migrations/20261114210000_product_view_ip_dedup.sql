-- Deduplicate product views by a server-derived, keyed IP hash for 24 hours.
-- Raw IP addresses are never stored. Existing visitor_events rows remain untouched.

create schema if not exists visitor_intelligence_private;
revoke all on schema visitor_intelligence_private from public, anon, authenticated;
grant usage on schema visitor_intelligence_private to service_role;

create table if not exists visitor_intelligence_private.product_view_ip_dedup (
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  product_slug text not null check (char_length(product_slug) between 1 and 160),
  last_viewed_at timestamptz not null default now(),
  primary key (ip_hash, product_slug)
);

alter table visitor_intelligence_private.product_view_ip_dedup enable row level security;
revoke all on table visitor_intelligence_private.product_view_ip_dedup from public, anon, authenticated;
grant select, insert, update, delete on table visitor_intelligence_private.product_view_ip_dedup to service_role;

-- Product views must use the server-side endpoint so clients cannot bypass IP deduplication.
create or replace function public.record_visitor_event(
  p_visitor_id uuid,
  p_event_type text,
  p_page_path text,
  p_referrer_host text default null,
  p_device_type text default 'unknown',
  p_product_slug text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_recent_count integer;
begin
  if p_visitor_id is null
     or p_event_type not in ('session_start','page_view','product_click','cart_add','cart_view','checkout_view')
     or p_page_path is null or char_length(p_page_path) not between 1 and 500
     or p_device_type not in ('mobile','desktop','tablet','unknown')
     or (p_referrer_host is not null and char_length(p_referrer_host)>255)
     or (p_product_slug is not null and char_length(p_product_slug)>160) then
    raise exception 'Invalid visitor event.' using errcode='22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_visitor_id::text, 0));
  select count(*) into v_recent_count
    from public.visitor_events
   where visitor_id=p_visitor_id and created_at > now() - interval '1 minute';
  if v_recent_count >= 30 then return false; end if;

  insert into public.visitor_events(visitor_id,event_type,page_path,referrer_host,device_type,product_slug)
  values(
    p_visitor_id,p_event_type,p_page_path,
    nullif(left(regexp_replace(coalesce(p_referrer_host,''),'[^a-zA-Z0-9.:-]','','g'),255),''),
    p_device_type,
    nullif(left(regexp_replace(coalesce(p_product_slug,''),'[^a-zA-Z0-9_-]','','g'),160),'')
  );
  return true;
end;
$function$;

revoke all on function public.record_visitor_event(uuid,text,text,text,text,text) from public;
grant execute on function public.record_visitor_event(uuid,text,text,text,text,text) to anon, authenticated, service_role;

create or replace function public.record_product_view(
  p_visitor_id uuid,
  p_product_slug text,
  p_page_path text,
  p_referrer_host text,
  p_device_type text,
  p_ip_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_recent_count integer;
  v_recorded boolean := false;
begin
  if p_visitor_id is null
     or p_product_slug is null or p_product_slug !~ '^[a-z0-9-]{1,160}$'
     or p_page_path is null or p_page_path !~ ('^/products/' || p_product_slug || '/?$')
     or p_device_type not in ('mobile','desktop','tablet','unknown')
     or (p_referrer_host is not null and char_length(p_referrer_host)>255)
     or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid product view event.' using errcode='22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_visitor_id::text, 0));
  select count(*) into v_recent_count
    from public.visitor_events
   where visitor_id=p_visitor_id and created_at > now() - interval '1 minute';
  if v_recent_count >= 30 then return false; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_ip_hash || ':' || p_product_slug, 1));
  insert into visitor_intelligence_private.product_view_ip_dedup(ip_hash,product_slug,last_viewed_at)
  values(p_ip_hash,p_product_slug,now())
  on conflict (ip_hash,product_slug) do update
    set last_viewed_at=excluded.last_viewed_at
    where visitor_intelligence_private.product_view_ip_dedup.last_viewed_at <= now() - interval '24 hours'
  returning true into v_recorded;

  if not coalesce(v_recorded,false) then return false; end if;

  insert into public.visitor_events(visitor_id,event_type,page_path,referrer_host,device_type,product_slug)
  values(
    p_visitor_id,'product_view',p_page_path,
    nullif(left(regexp_replace(coalesce(p_referrer_host,''),'[^a-zA-Z0-9.:-]','','g'),255),''),
    p_device_type,p_product_slug
  );
  delete from visitor_intelligence_private.product_view_ip_dedup
   where last_viewed_at < now() - interval '30 days';
  return true;
end;
$function$;

revoke all on function public.record_product_view(uuid,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_product_view(uuid,text,text,text,text,text) to service_role;
