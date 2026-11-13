-- ZARIAH Studio Phase 17: atomic staff order-status updates.
-- Additive migration: no existing order/payment records are rewritten or deleted.
-- Apply only after review and explicit production approval.

begin;

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
  v_message text;
  v_courier text;
  v_tracking text;
begin
  if auth.uid() is null or not public.is_staff_or_admin() then
    raise exception 'You are not authorised to update orders.' using errcode = '42501';
  end if;

  if p_order_id is null or p_new_status not in
    ('new','confirmed','processing','shipped','delivered','cancelled','returned') then
    raise exception 'Invalid order or status.' using errcode = '22023';
  end if;

  v_message := nullif(btrim(coalesce(p_message,'')), '');
  v_courier := nullif(btrim(coalesce(p_courier_name,'')), '');
  v_tracking := nullif(btrim(coalesce(p_tracking_number,'')), '');

  if length(coalesce(v_message,'')) > 500
     or length(coalesce(v_courier,'')) > 100
     or length(coalesce(v_tracking,'')) > 120 then
    raise exception 'Order update details exceed the allowed length.' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if v_order.status = p_new_status then
    raise exception 'Order is already in this status.' using errcode = '22023';
  end if;

  if v_order.status in ('cancelled','returned','delivered') then
    raise exception 'This order status cannot be changed through the standard workflow.' using errcode = '22023';
  end if;

  if p_new_status = 'confirmed' and v_order.status <> 'new' then
    raise exception 'Only new orders can be confirmed.' using errcode = '22023';
  elsif p_new_status = 'processing' and v_order.status <> 'confirmed' then
    raise exception 'Only confirmed orders can enter processing.' using errcode = '22023';
  elsif p_new_status = 'shipped' and v_order.status <> 'processing' then
    raise exception 'Only processing orders can be shipped.' using errcode = '22023';
  elsif p_new_status = 'delivered' and v_order.status <> 'shipped' then
    raise exception 'Only shipped orders can be marked delivered.' using errcode = '22023';
  elsif p_new_status = 'returned' and v_order.status <> 'delivered' then
    raise exception 'Only delivered orders can be returned.' using errcode = '22023';
  elsif p_new_status = 'cancelled' and v_order.status not in ('new','confirmed','processing') then
    raise exception 'This order cannot be cancelled from its current status.' using errcode = '22023';
  end if;

  if p_new_status = 'shipped' and (v_courier is null or v_tracking is null) then
    raise exception 'Courier name and tracking number are required before shipping.' using errcode = '22023';
  end if;

  if p_new_status in ('cancelled','returned') and v_message is null then
    raise exception 'A reason is required for cancellation or return.' using errcode = '22023';
  end if;

  update public.orders
  set status = p_new_status,
      courier_name = case when p_new_status = 'shipped' then v_courier else courier_name end,
      courier_tracking_number = case when p_new_status = 'shipped' then v_tracking else courier_tracking_number end,
      shipped_at = case when p_new_status = 'shipped' then now() else shipped_at end,
      delivered_at = case when p_new_status = 'delivered' then now() else delivered_at end
  where id = p_order_id;

  insert into public.order_status_history(order_id, previous_status, new_status, note, changed_by)
  values(p_order_id, v_order.status, p_new_status, v_message, auth.uid());

  insert into public.order_tracking_events(order_id, status, message, created_by)
  values(
    p_order_id,
    p_new_status,
    coalesce(v_message, 'Order status updated to ' || p_new_status || '.'),
    auth.uid()
  );

  insert into public.activity_logs(actor_id, action, entity_type, entity_id, metadata)
  values(
    auth.uid(),
    'order_status_updated',
    'order',
    p_order_id,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'previous_status', v_order.status,
      'new_status', p_new_status,
      'courier_name', case when p_new_status = 'shipped' then v_courier else null end,
      'tracking_number', case when p_new_status = 'shipped' then v_tracking else null end
    )
  );

  return jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'previous_status', v_order.status,
    'status', p_new_status
  );
end;
$$;

revoke all on function public.update_order_status(uuid,text,text,text,text) from public, anon;
grant execute on function public.update_order_status(uuid,text,text,text,text) to authenticated;

commit;
