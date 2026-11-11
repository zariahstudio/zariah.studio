-- Make website order inventory transitions fail atomically on reservation drift.
-- This replaces only the existing trigger function; no trigger or live data is changed by this draft.
begin;

create or replace function public.apply_website_order_inventory_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_item record;
  v_availability_mode text;
  v_stock_counted boolean;
begin
  if coalesce(new.source, '') <> 'website'
     or old.order_status is not distinct from new.order_status then
    return new;
  end if;

  if new.order_status = 'delivered'
     and old.order_status not in ('delivered', 'cancelled', 'returned') then
    for v_item in
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi
      where oi.order_id = new.id and oi.product_id is not null
      group by oi.product_id order by oi.product_id
    loop
      select coalesce(p.availability_mode, 'auto'),
             coalesce(i.stock_counted, p.stock_counted, false)
        into v_availability_mode, v_stock_counted
      from public.products p
      left join public.inventory i on i.product_id = p.id
      where p.id = v_item.product_id;

      if not found then
        raise exception 'Cannot fulfil website order: product inventory record is missing.'
          using errcode = 'P0001';
      end if;
      if v_availability_mode = 'pre_order' or not v_stock_counted then
        continue;
      end if;

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
    end loop;

  elsif new.order_status in ('cancelled', 'returned')
        and old.order_status not in ('delivered', 'cancelled', 'returned') then
    for v_item in
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi
      where oi.order_id = new.id and oi.product_id is not null
      group by oi.product_id order by oi.product_id
    loop
      select coalesce(p.availability_mode, 'auto'),
             coalesce(i.stock_counted, p.stock_counted, false)
        into v_availability_mode, v_stock_counted
      from public.products p
      left join public.inventory i on i.product_id = p.id
      where p.id = v_item.product_id;

      if not found then
        raise exception 'Cannot release website reservation: product inventory record is missing.'
          using errcode = 'P0001';
      end if;
      if v_availability_mode = 'pre_order' or not v_stock_counted then
        continue;
      end if;

      update public.inventory
         set reserved = reserved - v_item.quantity,
             updated_at = now()
       where product_id = v_item.product_id
         and reserved >= v_item.quantity;
      if not found then
        raise exception 'Cannot cancel website order: reserved stock is missing or insufficient for product %.', v_item.product_id
          using errcode = 'P0001';
      end if;
    end loop;
  end if;

  return new;
end;
$function$;

comment on function public.apply_website_order_inventory_transition() is
  'Atomically consumes or releases website order reservations. Delivered returns are not automatically restocked; QC must approve a separate stock adjustment.';

commit;