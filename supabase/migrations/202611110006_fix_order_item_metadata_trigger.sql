-- Correct the metadata trigger's product-row selection and cost component typing.
create or replace function public.prepare_order_item_metadata()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_source text; v_product public.products%rowtype; v_cost numeric; v_total_cost numeric; v_brand text;
begin
 select o.source into v_source from public.orders o where o.id=new.order_id;
 select p.* into v_product from public.products p where p.id=new.product_id;
 if not found then return new; end if;
 select pc.cost_bdt,coalesce(pc.purchase_cost,0)+coalesce(pc.packaging_cost,0)+coalesce(pc.inbound_shipping_cost,0)+coalesce(pc.other_cost,0)
 into v_cost,v_total_cost from public.product_costs pc where pc.product_id=new.product_id;
 if new.unit_cost_snapshot is null then new.unit_cost_snapshot:=coalesce(v_cost,v_total_cost); end if;
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
