-- Track reservations per website order so inventory mode changes cannot orphan or consume another order's stock.
-- This migration is intentionally guarded: existing open website orders must reconcile exactly with inventory.reserved.
begin;

create table if not exists private.website_order_inventory_reservations (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  reservation_status text not null default 'reserved'
    check (reservation_status in ('reserved', 'consumed', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (order_id, product_id)
);

revoke all on table private.website_order_inventory_reservations from public, anon, authenticated;

-- Do not guess which orders own pooled reservations. Abort if current open website
-- order quantities do not exactly match the aggregate reserved quantity per SKU.
do $migration$
declare
  v_mismatch record;
begin
  for v_mismatch in
    with expected as (
      select oi.product_id, sum(oi.quantity)::integer as expected_reserved
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      join public.products p on p.id = oi.product_id
      left join public.inventory i on i.product_id = p.id
      where o.source = 'website'
        and o.order_status in ('pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped')
        and p.availability_mode <> 'pre_order'
        and coalesce(i.stock_counted, p.stock_counted, false)
      group by oi.product_id
    )
    select coalesce(e.product_id, i.product_id) as product_id,
           coalesce(e.expected_reserved, 0) as expected_reserved,
           coalesce(i.reserved, 0) as actual_reserved
    from expected e
    full join public.inventory i on i.product_id = e.product_id
    where coalesce(i.reserved, 0) <> coalesce(e.expected_reserved, 0)
  loop
    raise exception
      'Inventory reservation reconciliation required for product %: open website orders require %, inventory currently reserves %.',
      v_mismatch.product_id, v_mismatch.expected_reserved, v_mismatch.actual_reserved
      using errcode = 'P0001';
  end loop;
end;
$migration$;

-- Existing reservations are reconstructed only after the exact aggregate check above.
insert into private.website_order_inventory_reservations
  (order_id, product_id, quantity, reservation_status)
select o.id, oi.product_id, sum(oi.quantity)::integer, 'reserved'
from public.orders o
join public.order_items oi on oi.order_id = o.id
join public.products p on p.id = oi.product_id
left join public.inventory i on i.product_id = p.id
where o.source = 'website'
  and o.order_status in ('pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped')
  and p.availability_mode <> 'pre_order'
  and coalesce(i.stock_counted, p.stock_counted, false)
group by o.id, oi.product_id
on conflict (order_id, product_id) do nothing;

create or replace function public.reserve_website_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_source text;
  v_mode text;
  v_stock_counted boolean;
begin
  select o.source into v_source
  from public.orders o
  where o.id = new.order_id;

  select coalesce(p.availability_mode, 'auto'),
         coalesce(i.stock_counted, p.stock_counted, false)
    into v_mode, v_stock_counted
  from public.products p
  left join public.inventory i on i.product_id = p.id
  where p.id = new.product_id;

  if v_source = 'website' and new.product_id is not null then
    if v_mode is null then
      raise exception 'Cannot reserve website stock: product record is missing.'
        using errcode = 'P0001';
    end if;
    if v_mode <> 'pre_order' and v_stock_counted then
    update public.inventory
       set reserved = reserved + new.quantity,
           updated_at = now()
     where product_id = new.product_id
       and on_hand - reserved >= new.quantity;

    if not found then
      raise exception 'Available stock changed while confirming the order. Please refresh and try again.'
        using errcode = 'P0001';
    end if;

    insert into private.website_order_inventory_reservations
      (order_id, product_id, quantity, reservation_status)
    values (new.order_id, new.product_id, new.quantity, 'reserved')
    on conflict (order_id, product_id) do update
      set quantity = private.website_order_inventory_reservations.quantity + excluded.quantity,
          updated_at = now()
      where private.website_order_inventory_reservations.reservation_status = 'reserved';

    if not found then
      raise exception 'Could not record the website order stock reservation.'
        using errcode = 'P0001';
    end if;
    end if;
  end if;

  return new;
end;
$function$;

create or replace function public.apply_website_order_inventory_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_item record;
  v_missing record;
begin
  if coalesce(new.source, '') <> 'website'
     or old.order_status is not distinct from new.order_status then
    return new;
  end if;

  if new.order_status = 'delivered'
     and old.order_status not in ('delivered', 'cancelled', 'returned') then

    -- A counted-stock line must have its own live reservation ledger row.
    for v_missing in
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      left join public.inventory i on i.product_id = p.id
      left join private.website_order_inventory_reservations r
        on r.order_id = oi.order_id
       and r.product_id = oi.product_id
       and r.reservation_status = 'reserved'
      where oi.order_id = new.id
        and p.availability_mode <> 'pre_order'
        and coalesce(i.stock_counted, p.stock_counted, false)
      group by oi.product_id, r.quantity
      having coalesce(r.quantity, 0) <> sum(oi.quantity)
    loop
      raise exception 'Cannot deliver website order: reservation ledger is missing or inconsistent for product %.', v_missing.product_id
        using errcode = 'P0001';
    end loop;

    for v_item in
      select product_id, quantity
      from private.website_order_inventory_reservations
      where order_id = new.id and reservation_status = 'reserved'
      order by product_id
      for update
    loop
      update public.inventory
         set on_hand = on_hand - v_item.quantity,
             reserved = reserved - v_item.quantity,
             updated_at = now()
       where product_id = v_item.product_id
         and reserved >= v_item.quantity
         and on_hand >= v_item.quantity;

      if not found then
        raise exception 'Cannot deliver website order: reserved stock is missing or insufficient for product %.', v_item.product_id
          using errcode = 'P0001';
      end if;

      update private.website_order_inventory_reservations
         set reservation_status = 'consumed', updated_at = now()
       where order_id = new.id and product_id = v_item.product_id
         and reservation_status = 'reserved';
    end loop;

  elsif new.order_status in ('cancelled', 'returned')
        and old.order_status not in ('delivered', 'cancelled', 'returned') then

    for v_missing in
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      left join public.inventory i on i.product_id = p.id
      left join private.website_order_inventory_reservations r
        on r.order_id = oi.order_id
       and r.product_id = oi.product_id
       and r.reservation_status = 'reserved'
      where oi.order_id = new.id
        and p.availability_mode <> 'pre_order'
        and coalesce(i.stock_counted, p.stock_counted, false)
      group by oi.product_id, r.quantity
      having coalesce(r.quantity, 0) <> sum(oi.quantity)
    loop
      raise exception 'Cannot release website order: reservation ledger is missing or inconsistent for product %.', v_missing.product_id
        using errcode = 'P0001';
    end loop;

    for v_item in
      select product_id, quantity
      from private.website_order_inventory_reservations
      where order_id = new.id and reservation_status = 'reserved'
      order by product_id
      for update
    loop
      update public.inventory
         set reserved = reserved - v_item.quantity,
             updated_at = now()
       where product_id = v_item.product_id
         and reserved >= v_item.quantity;

      if not found then
        raise exception 'Cannot cancel website order: reserved stock is missing or insufficient for product %.', v_item.product_id
          using errcode = 'P0001';
      end if;

      update private.website_order_inventory_reservations
         set reservation_status = 'released', updated_at = now()
       where order_id = new.id and product_id = v_item.product_id
         and reservation_status = 'reserved';
    end loop;
  end if;

  return new;
end;
$function$;

comment on function public.apply_website_order_inventory_transition() is
  'Consumes or releases per-order website inventory reservations atomically. Delivered returns are not automatically restocked; QC must approve a separate stock adjustment.';

commit;
