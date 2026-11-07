-- ZARIAH Studio: customer-safe order tracking lookup.
-- Apply after the existing initial schema. Public lookup requires BOTH order number and
-- the exact phone number saved with the order. Customer address/email are never returned.

begin;

alter table public.orders
  add column if not exists courier_name text,
  add column if not exists courier_tracking_number text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create table if not exists public.order_tracking_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (status in ('new','confirmed','processing','shipped','delivered','cancelled','returned')),
  message text not null,
  event_time timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_tracking_events_order_time_idx
  on public.order_tracking_events(order_id, event_time asc);

alter table public.order_tracking_events enable row level security;

drop policy if exists "tracking_events_staff_read" on public.order_tracking_events;
create policy "tracking_events_staff_read"
  on public.order_tracking_events for select to authenticated
  using ((select public.is_staff_or_admin()));

drop policy if exists "tracking_events_staff_manage" on public.order_tracking_events;
create policy "tracking_events_staff_manage"
  on public.order_tracking_events for all to authenticated
  using ((select public.is_staff_or_admin()))
  with check ((select public.is_staff_or_admin()));

create or replace function public.lookup_order_tracking(p_order_number text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_customer public.customers%rowtype;
  v_result jsonb;
begin
  if nullif(trim(p_order_number), '') is null
     or nullif(trim(p_phone), '') is null
     or length(trim(p_order_number)) > 40
     or length(trim(p_phone)) > 30 then
    return jsonb_build_object('found', false);
  end if;

  select o.* into v_order
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where upper(o.order_number) = upper(trim(p_order_number))
    and regexp_replace(c.phone, '[^0-9]', '', 'g')
        = regexp_replace(trim(p_phone), '[^0-9]', '', 'g')
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select c.* into v_customer
  from public.customers c where c.id = v_order.customer_id;

  select jsonb_build_object(
    'found', true,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'total_bdt', v_order.total_bdt,
    'payment_status', v_order.payment_status,
    'courier_name', v_order.courier_name,
    'courier_tracking_number', v_order.courier_tracking_number,
    'shipped_at', v_order.shipped_at,
    'delivered_at', v_order.delivered_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', oi.name_snapshot,
        'sku', oi.sku_snapshot,
        'quantity', oi.quantity
      ) order by oi.created_at)
      from public.order_items oi where oi.order_id = v_order.id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'status', e.status,
        'message', e.message,
        'event_time', e.event_time
      ) order by e.event_time asc)
      from public.order_tracking_events e where e.order_id = v_order.id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.lookup_order_tracking(text, text) from public;
grant execute on function public.lookup_order_tracking(text, text) to anon, authenticated;

commit;
