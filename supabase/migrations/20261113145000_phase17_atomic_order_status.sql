-- Phase 1: atomic order status, customer tracking, history and activity update.
-- Expand the tracking-event constraint to match the already-supported order status.
-- Additive RPC. The existing orders sync and inventory transition triggers remain authoritative.
begin;

alter table public.order_tracking_events
  drop constraint if exists order_tracking_events_status_check;
alter table public.order_tracking_events
  add constraint order_tracking_events_status_check
  check (status = any (array[
    'new','confirmed','processing','ready_to_ship','shipped','delivered','cancelled','returned'
  ]::text[]));

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_message text default null,
  p_courier_name text default null,
  p_tracking_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_previous_status text;
  v_message text;
begin
  if auth.uid() is null or not public.is_staff_or_admin() then
    raise exception 'You are not authorised to update orders.' using errcode = '42501';
  end if;
  if p_order_id is null or p_new_status is null or p_new_status not in
    ('new','confirmed','processing','ready_to_ship','shipped','delivered','cancelled','returned') then
    raise exception 'Invalid order status update.' using errcode = '22023';
  end if;
  if length(coalesce(p_message,'')) > 1000
     or length(coalesce(p_courier_name,'')) > 120
     or length(coalesce(p_tracking_number,'')) > 120 then
    raise exception 'Tracking details exceed the allowed length.' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  v_previous_status := v_order.status;
  v_message := coalesce(nullif(btrim(coalesce(p_message,'')), ''),
    'Order status updated to ' || replace(p_new_status,'_',' ') || '.');

  update public.orders
  set status = p_new_status,
      courier_name = coalesce(nullif(btrim(coalesce(p_courier_name,'')),''), courier_name),
      courier_tracking_number = coalesce(nullif(btrim(coalesce(p_tracking_number,'')),''), courier_tracking_number),
      shipped_at = case when p_new_status='shipped' and shipped_at is null then now() else shipped_at end,
      delivered_at = case when p_new_status='delivered' and delivered_at is null then now() else delivered_at end
  where id = p_order_id;

  insert into public.order_tracking_events(order_id,status,message,created_by)
  values(p_order_id,p_new_status,v_message,auth.uid());

  insert into public.order_status_history(order_id,previous_status,new_status,note,changed_by)
  values(p_order_id,v_previous_status,p_new_status,v_message,auth.uid());

  insert into public.activity_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'order_status_updated','order',p_order_id,
    jsonb_build_object('order_number',v_order.order_number,
      'previous_status',v_previous_status,'new_status',p_new_status,
      'courier_name',coalesce(nullif(btrim(coalesce(p_courier_name,'')),''),v_order.courier_name),
      'tracking_number',coalesce(nullif(btrim(coalesce(p_tracking_number,'')),''),v_order.courier_tracking_number)));

  return jsonb_build_object('success',true,'order_id',p_order_id,
    'previous_status',v_previous_status,'new_status',p_new_status);
end;
$$;

revoke all on function public.update_order_status(uuid,text,text,text,text) from public, anon;
grant execute on function public.update_order_status(uuid,text,text,text,text) to authenticated;

commit;
