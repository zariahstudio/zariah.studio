-- Compatibility bridge for the current ZARIAH Studio Admin UI.
-- Safe on the current live schema and on the repository's core schema.
-- Keeps both legacy "partial" and current UI "partially_paid" values readable.

begin;

alter table public.orders
  add column if not exists amount_paid numeric not null default 0;

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status = any (array['unpaid','partial','partially_paid','paid','refunded']::text[]));

alter table public.product_costs add column if not exists cost_bdt integer;
alter table public.product_costs drop constraint if exists product_costs_cost_bdt_check;
alter table public.product_costs add constraint product_costs_cost_bdt_check
  check (cost_bdt is null or cost_bdt >= 0);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='product_costs' and column_name='purchase_cost'
  ) then
    execute 'update public.product_costs set cost_bdt = round(coalesce(purchase_cost,0)+coalesce(packaging_cost,0)+coalesce(inbound_shipping_cost,0)+coalesce(other_cost,0))::integer where cost_bdt is null';
  end if;
end $$;

create or replace function public.record_order_payment(
 p_order_id uuid,p_amount_bdt integer,p_method text,p_reference text default null,p_notes text default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_order public.orders%rowtype;v_paid integer;v_due integer;v_payment_id uuid;v_status text;
begin
 if not public.is_staff_or_admin() then raise exception 'You are not authorised to record payments.' using errcode='42501'; end if;
 if p_order_id is null or p_amount_bdt is null or p_amount_bdt<=0 then raise exception 'Enter a valid payment amount.' using errcode='22023'; end if;
 if p_method not in ('cash_on_delivery','bkash','nagad','bank_transfer','other') then raise exception 'Select a valid payment method.' using errcode='22023'; end if;
 if length(coalesce(p_reference,''))>120 or length(coalesce(p_notes,''))>500 then raise exception 'Payment reference or notes are too long.' using errcode='22023'; end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found.' using errcode='P0002'; end if;
 if v_order.status in ('cancelled','returned') then raise exception 'Cannot record a payment for a cancelled or returned order.' using errcode='22023'; end if;
 select coalesce(sum(amount_bdt),0)::integer into v_paid from public.payments where order_id=p_order_id and status='verified';
 v_due:=v_order.total_bdt-v_paid;
 if p_amount_bdt>v_due then raise exception 'Payment exceeds outstanding balance.' using errcode='22023'; end if;
 insert into public.payments(order_id,method,amount_bdt,status,reference,notes,verified_by,verified_at)
 values(p_order_id,p_method,p_amount_bdt,'verified',nullif(btrim(p_reference),''),nullif(btrim(p_notes),''),auth.uid(),now())
 returning id into v_payment_id;
 v_paid:=v_paid+p_amount_bdt;
 v_status:=case when v_paid>=v_order.total_bdt then 'paid' when v_paid>0 then 'partially_paid' else 'unpaid' end;
 update public.orders set payment_status=v_status,amount_paid=v_paid,payment_method=p_method,payment_reference=nullif(btrim(p_reference),'')
 where id=p_order_id;
 insert into public.activity_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'payment_recorded','order',p_order_id,jsonb_build_object('payment_id',v_payment_id,'amount_bdt',p_amount_bdt,'method',p_method,'payment_status',v_status));
 return jsonb_build_object('success',true,'payment_id',v_payment_id,'paid_bdt',v_paid,
  'due_bdt',greatest(v_order.total_bdt-v_paid,0),'payment_status',v_status,'receipt_number',v_order.receipt_number);
end $$;
revoke all on function public.record_order_payment(uuid,integer,text,text,text) from public;
grant execute on function public.record_order_payment(uuid,integer,text,text,text) to authenticated;

create or replace function public.create_pos_sale(
 p_customer jsonb,p_items jsonb,p_payment_amount_bdt integer default 0,
 p_payment_method text default 'cash_on_delivery',p_payment_reference text default null,p_notes text default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_name text;v_phone text;v_digits text;v_email text;v_customer_id uuid;v_order_id uuid;
 v_order public.orders%rowtype;v_item jsonb;v_product record;v_sku text;v_qty integer;
 v_subtotal integer:=0;v_line_total integer;v_paid integer:=0;v_status text:='unpaid';
begin
 if not public.is_staff_or_admin() then raise exception 'You are not authorised to create store sales.' using errcode='42501'; end if;
 if jsonb_typeof(p_customer)<>'object' or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>30 then
  raise exception 'Enter customer details and at least one valid product.' using errcode='22023';
 end if;
 v_name:=nullif(btrim(p_customer->>'full_name'),'');v_phone:=nullif(btrim(p_customer->>'phone'),'');
 v_digits:=regexp_replace(coalesce(v_phone,''),'[^0-9]','','g');v_email:=nullif(btrim(p_customer->>'email'),'');
 if v_name is null or length(v_name)>80 or v_phone is null or length(v_phone)>20
  or v_digits !~ '^(8801[3-9][0-9]{8}|01[3-9][0-9]{8})$'
  or (v_email is not null and (length(v_email)>100 or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')) then
  raise exception 'Enter a customer name and valid Bangladesh mobile number.' using errcode='22023';
 end if;
 if coalesce(p_payment_amount_bdt,0)<0 or length(coalesce(p_payment_reference,''))>120 or length(coalesce(p_notes,''))>500 then
  raise exception 'Invalid payment amount or notes.' using errcode='22023';
 end if;
 if p_payment_method not in ('cash_on_delivery','bkash','nagad','bank_transfer','other') then
  raise exception 'Select a valid payment method.' using errcode='22023';
 end if;
 select c.id into v_customer_id from public.customers c
 where regexp_replace(c.phone,'[^0-9]','','g')=v_digits order by c.created_at desc limit 1 for update;
 if v_customer_id is null then
  insert into public.customers(full_name,phone,email) values(v_name,v_phone,v_email) returning id into v_customer_id;
 else
  update public.customers set full_name=v_name,phone=v_phone,email=coalesce(v_email,email) where id=v_customer_id;
 end if;
 insert into public.orders(order_number,source,customer_id,status,subtotal_bdt,discount_bdt,delivery_fee_bdt,total_bdt,payment_status,payment_method,notes)
 values('ZS-POS-'||to_char(now() at time zone 'Asia/Dhaka','YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  'manual',v_customer_id,'delivered',0,0,0,0,'unpaid',p_payment_method,nullif(btrim(p_notes),'')) returning id into v_order_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_sku:=upper(btrim(coalesce(v_item->>'sku','')));
  begin v_qty:=(v_item->>'quantity')::integer; exception when others then raise exception 'Invalid quantity for a product.' using errcode='22023'; end;
  if v_sku='' or v_qty<1 or v_qty>20 then raise exception 'Each product must have a valid SKU and quantity from 1 to 20.' using errcode='22023'; end if;
  select p.id,p.sku,p.name,p.price_bdt,coalesce(i.stock_counted,false) stock_counted,
   coalesce(i.on_hand-i.reserved,0) available_qty into v_product
  from public.products p left join public.inventory i on i.product_id=p.id
  where upper(p.sku)=v_sku and p.is_published=true for update of p;
  if not found then raise exception 'Product % is not published or does not exist.',v_sku using errcode='P0001'; end if;
  if v_product.stock_counted and v_product.available_qty<v_qty then raise exception 'Insufficient stock for % (%).',v_product.name,v_product.sku using errcode='P0001'; end if;
  v_line_total:=v_product.price_bdt*v_qty;v_subtotal:=v_subtotal+v_line_total;
  insert into public.order_items(order_id,product_id,sku_snapshot,name_snapshot,unit_price_bdt,quantity,line_total_bdt)
  values(v_order_id,v_product.id,v_product.sku,v_product.name,v_product.price_bdt,v_qty,v_line_total);
  if v_product.stock_counted then
   update public.inventory set on_hand=on_hand-v_qty where product_id=v_product.id;
   insert into public.inventory_movements(product_id,quantity_delta,reason,reference,actor_id)
   values(v_product.id,-v_qty,'sale',v_order_id::text,auth.uid());
  end if;
 end loop;
 if coalesce(p_payment_amount_bdt,0)>v_subtotal then raise exception 'Payment cannot exceed the sale total.' using errcode='22023'; end if;
 update public.orders set subtotal_bdt=v_subtotal,total_bdt=v_subtotal where id=v_order_id;
 if coalesce(p_payment_amount_bdt,0)>0 then
  insert into public.payments(order_id,method,amount_bdt,status,reference,verified_by,verified_at)
  values(v_order_id,p_payment_method,p_payment_amount_bdt,'verified',nullif(btrim(p_payment_reference),''),auth.uid(),now());
  v_paid:=p_payment_amount_bdt;
 end if;
 v_status:=case when v_paid>=v_subtotal then 'paid' when v_paid>0 then 'partially_paid' else 'unpaid' end;
 update public.orders set payment_status=v_status,amount_paid=v_paid where id=v_order_id;
 insert into public.order_tracking_events(order_id,status,message,created_by)
 values(v_order_id,'delivered','In-store sale recorded.',auth.uid());
 insert into public.activity_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'pos_sale_created','order',v_order_id,jsonb_build_object('total_bdt',v_subtotal,'paid_bdt',v_paid,'due_bdt',v_subtotal-v_paid));
 select * into v_order from public.orders where id=v_order_id;
 return jsonb_build_object('success',true,'order_id',v_order.id,'order_number',v_order.order_number,
  'receipt_number',v_order.receipt_number,'total_bdt',v_order.total_bdt,'paid_bdt',v_paid,'due_bdt',v_order.total_bdt-v_paid,'payment_status',v_status);
end $$;
revoke all on function public.create_pos_sale(jsonb,jsonb,integer,text,text,text) from public;
grant execute on function public.create_pos_sale(jsonb,jsonb,integer,text,text,text) to authenticated;

create or replace function public.sync_order_payment_totals()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_order_id uuid;v_paid numeric;v_total numeric;v_status text;
begin
 v_order_id:=case when tg_op='DELETE' then old.order_id else new.order_id end;
 select coalesce(sum(p.amount_bdt),0) into v_paid from public.payments p where p.order_id=v_order_id and p.status='verified';
 select o.total_bdt into v_total from public.orders o where o.id=v_order_id;
 if found then
  v_status:=case when v_paid>=v_total then 'paid' when v_paid>0 then 'partially_paid' else 'unpaid' end;
  update public.orders set amount_paid=v_paid,payment_status=v_status where id=v_order_id;
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function public.sync_order_payment_totals() from public,anon,authenticated;
drop trigger if exists payments_sync_order_totals on public.payments;
create trigger payments_sync_order_totals
after insert or update of amount_bdt,status or delete on public.payments
for each row execute function public.sync_order_payment_totals();

commit;
