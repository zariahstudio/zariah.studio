-- Reserve website inventory until fulfilment; snapshot landed cost and brand on each new order item.
begin;
alter table public.order_items add column if not exists brand_snapshot text;
create or replace function public.prepare_order_item_metadata()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_source text; v_product public.products%rowtype; v_cost numeric; v_brand text;
begin
 select o.source into v_source from public.orders o where o.id=new.order_id;
 select p.*,coalesce(b.name,p.brand) as resolved_brand into v_product
 from public.products p left join public.brands b on b.id=p.brand_id where p.id=new.product_id;
 if not found then return new; end if;
 select pc.cost_bdt,coalesce(pc.purchase_cost,0)+coalesce(pc.packaging_cost,0)+coalesce(pc.inbound_shipping_cost,0)+coalesce(pc.other_cost,0)
 into v_cost,v_brand from public.product_costs pc where pc.product_id=new.product_id;
 if new.unit_cost_snapshot is null then new.unit_cost_snapshot:=coalesce(v_cost,0); end if;
 if new.brand_snapshot is null then
  select coalesce(b.name,p.brand) into v_brand from public.products p left join public.brands b on b.id=p.brand_id where p.id=new.product_id;
  new.brand_snapshot:=v_brand;
 end if;
 if v_source='website' and v_product.availability_mode='pre_order' and not exists (
  select 1 from public.product_sources ps join public.suppliers s on s.id=ps.supplier_id and s.is_active=true
  where ps.product_id=new.product_id and ps.availability_confirmed_at>=now()-interval '24 hours'
 ) then raise exception 'Pre-order supplier availability is not confirmed within the last 24 hours.' using errcode='P0001'; end if;
 return new;
end; $$;
drop trigger if exists order_items_prepare_multibrand_metadata on public.order_items;
create trigger order_items_prepare_multibrand_metadata before insert on public.order_items for each row execute function public.prepare_order_item_metadata();

create or replace function public.reserve_website_order_inventory()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_source text; v_mode text; v_stock_counted boolean;
begin
 select o.source into v_source from public.orders o where o.id=new.order_id;
 select p.availability_mode,coalesce(i.stock_counted,false) into v_mode,v_stock_counted
 from public.products p left join public.inventory i on i.product_id=p.id where p.id=new.product_id;
 if v_source='website' and coalesce(v_mode,'auto')<>'pre_order' and v_stock_counted then
  update public.inventory set reserved=reserved+new.quantity,updated_at=now()
  where product_id=new.product_id and on_hand-reserved>=new.quantity;
  if not found then raise exception 'Available stock changed while confirming the order. Refresh and try again.' using errcode='P0001'; end if;
 end if;
 return new;
end; $$;
drop trigger if exists order_items_reserve_website_stock on public.order_items;
create trigger order_items_reserve_website_stock after insert on public.order_items for each row execute function public.reserve_website_order_inventory();

create or replace function public.apply_website_order_inventory_transition()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_item record;
begin
 if new.source<>'website' or old.order_status is not distinct from new.order_status then return new; end if;
 if new.order_status='delivered' then
  for v_item in select product_id,sum(quantity)::integer quantity from public.order_items where order_id=new.id group by product_id loop
   update public.inventory set on_hand=on_hand-v_item.quantity,reserved=reserved-v_item.quantity,updated_at=now()
   where product_id=v_item.product_id and reserved>=v_item.quantity;
  end loop;
 elsif new.order_status in ('cancelled','returned') then
  for v_item in select product_id,sum(quantity)::integer quantity from public.order_items where order_id=new.id group by product_id loop
   update public.inventory set reserved=greatest(reserved-v_item.quantity,0),updated_at=now()
   where product_id=v_item.product_id and reserved>0;
  end loop;
 end if;
 return new;
end; $$;
drop trigger if exists orders_apply_website_inventory_transition on public.orders;
create trigger orders_apply_website_inventory_transition after update of status,order_status on public.orders for each row execute function public.apply_website_order_inventory_transition();
commit;
