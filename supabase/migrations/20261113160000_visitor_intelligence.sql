-- Privacy-conscious first-party visitor analytics for the ZARIAH admin.
begin;

create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  event_type text not null check (event_type in ('page_view','product_view','cart_view','checkout_view')),
  page_path text not null,
  referrer_host text,
  device_type text not null check (device_type in ('mobile','desktop','tablet','unknown')),
  product_slug text,
  created_at timestamptz not null default now(),
  constraint visitor_events_path_length check (char_length(page_path) between 1 and 500),
  constraint visitor_events_referrer_length check (referrer_host is null or char_length(referrer_host) <= 255),
  constraint visitor_events_product_length check (product_slug is null or char_length(product_slug) <= 160)
);

create index if not exists visitor_events_created_idx on public.visitor_events(created_at desc);
create index if not exists visitor_events_visitor_created_idx on public.visitor_events(visitor_id,created_at desc);
create index if not exists visitor_events_type_created_idx on public.visitor_events(event_type,created_at desc);

alter table public.visitor_events enable row level security;
drop policy if exists "Staff can read visitor events" on public.visitor_events;
create policy "Staff can read visitor events" on public.visitor_events
  for select to authenticated using (public.is_staff_or_admin());

revoke all on public.visitor_events from public, anon, authenticated;
grant select on public.visitor_events to authenticated;

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
as $$
declare
  v_recent_count integer;
begin
  if p_visitor_id is null
     or p_event_type not in ('page_view','product_view','cart_view','checkout_view')
     or p_page_path is null or char_length(p_page_path) not between 1 and 500
     or p_device_type not in ('mobile','desktop','tablet','unknown')
     or (p_referrer_host is not null and char_length(p_referrer_host)>255)
     or (p_product_slug is not null and char_length(p_product_slug)>160) then
    raise exception 'Invalid visitor event.' using errcode='22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_visitor_id::text, 0));
  select count(*) into v_recent_count
  from public.visitor_events
  where visitor_id=p_visitor_id
    and created_at > now() - interval '1 minute';
  if v_recent_count >= 30 then
    return false;
  end if;

  insert into public.visitor_events(visitor_id,event_type,page_path,referrer_host,device_type,product_slug)
  values(p_visitor_id,p_event_type,p_page_path,
    nullif(left(regexp_replace(coalesce(p_referrer_host,''),'[^a-zA-Z0-9.:-]','','g'),255),''),
    p_device_type,
    nullif(left(regexp_replace(coalesce(p_product_slug,''),'[^a-zA-Z0-9_-]','','g'),160),''));
  return true;
end;
$$;

revoke all on function public.record_visitor_event(uuid,text,text,text,text,text) from public;
grant execute on function public.record_visitor_event(uuid,text,text,text,text,text) to anon, authenticated;

commit;
