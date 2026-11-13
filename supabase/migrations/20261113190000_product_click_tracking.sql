-- Add product-card click tracking without changing existing visitor records.
begin;
alter table public.visitor_events drop constraint if exists visitor_events_event_type_check;
alter table public.visitor_events add constraint visitor_events_event_type_check
  check (event_type in ('session_start','page_view','product_view','product_click','cart_view','checkout_view'));
create or replace function public.record_visitor_event(
  p_visitor_id uuid, p_event_type text, p_page_path text,
  p_referrer_host text default null, p_device_type text default 'unknown', p_product_slug text default null
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_recent_count integer;
begin
  if p_visitor_id is null
     or p_event_type not in ('session_start','page_view','product_view','product_click','cart_view','checkout_view')
     or p_page_path is null or char_length(p_page_path) not between 1 and 500
     or p_device_type not in ('mobile','desktop','tablet','unknown')
     or (p_referrer_host is not null and char_length(p_referrer_host)>255)
     or (p_product_slug is not null and char_length(p_product_slug)>160) then
    raise exception 'Invalid visitor event.' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_visitor_id::text, 0));
  select count(*) into v_recent_count from public.visitor_events
   where visitor_id=p_visitor_id and created_at > now() - interval '1 minute';
  if v_recent_count >= 30 then return false; end if;
  insert into public.visitor_events(visitor_id,event_type,page_path,referrer_host,device_type,product_slug)
  values(p_visitor_id,p_event_type,p_page_path,
    nullif(left(regexp_replace(coalesce(p_referrer_host,''),'[^a-zA-Z0-9.:-]','','g'),255),''),
    p_device_type,nullif(left(regexp_replace(coalesce(p_product_slug,''),'[^a-zA-Z0-9_-]','','g'),160),''));
  return true;
end;
$$;
revoke all on function public.record_visitor_event(uuid,text,text,text,text,text) from public;
grant execute on function public.record_visitor_event(uuid,text,text,text,text,text) to anon, authenticated;
commit;
