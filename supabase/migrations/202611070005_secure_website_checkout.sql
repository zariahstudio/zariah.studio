-- ZARIAH Studio Phase 2: secure guest checkout.
-- Orders are created only through this SECURITY DEFINER RPC. Prices and product
-- availability are read from the database; client-supplied prices are ignored.

begin;

create or replace function public.create_website_order(
  p_customer jsonb,
  p_items jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_phone text;
  v_phone_digits text;
  v_email text;
  v_district text;
  v_area text;
  v_address text;
  v_notes text;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_line_total integer;
  v_sku text;
  v_qty integer;
  v_product record;
  v_existing public.orders%rowtype;
  v_item jsonb;
  v_count integer := 0;
begin
  if jsonb_typeof(p_customer) <> 'object' or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid checkout request.' using errcode = '22023';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 16 or length(p_idempotency_key) > 100 then
    raise exception 'Invalid checkout reference. Please refresh and try again.' using errcode = '22023';
  end if;

  -- Idempotent retry: never create a second order for the same checkout attempt.
  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('success', true, 'order_id', v_existing.id,
      'order_number', v_existing.order_number, 'subtotal_bdt', v_existing.subtotal_bdt,
      'delivery_fee_bdt', v_existing.delivery_fee_bdt, 'total_bdt', v_existing.total_bdt,
      'reused', true);
  end if;

  v_name := nullif(trim(p_customer->>'full_name'), '');
  v_phone := nullif(trim(p_customer->>'phone'), '');
  v_phone_digits := regexp_replace(coalesce(v_phone, ''), '[^0-9]', '', 'g');
  v_email := nullif(trim(p_customer->>'email'), '');
  v_district := nullif(trim(p_customer->>'district'), '');
  v_area := nullif(trim(p_customer->>'area'), '');
  v_address := nullif(trim(p_customer->>'address'), '');
  v_notes := nullif(trim(p_customer->>'notes'), '');

  if v_name is null or length(v_name) > 80
     or v_phone is null or length(v_phone) > 20
     or v_phone_digits !~ '^(8801[3-9][0-9]{8}|01[3-9][0-9]{8})$'
     or v_district is null or length(v_district) > 60
     or v_area is null or length(v_area) > 80
     or v_address is null or length(v_address) > 400
     or (v_email is not null and (length(v_email) > 100 or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'))
     or (v_notes is not null and length(v_notes) > 500) then
    raise exception 'Please check your name, Bangladesh phone number and delivery address.' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 18 then
    raise exception 'Your bag must contain between 1 and 18 different products.' using errcode = '22023';
  end if;

  -- Reuse a customer record with the same normalized phone number.
  select c.id into v_customer_id
  from public.customers c
  where regexp_replace(c.phone, '[^0-9]', '', 'g') = v_phone_digits
  order by c.created_at desc
  limit 1
  for update;

  if v_customer_id is null then
    insert into public.customers(full_name, phone, email, address, district)
    values (v_name, v_phone, v_email, v_area || ', ' || v_address, v_district)
    returning id into v_customer_id;
  else
    update public.customers
    set full_name = v_name, phone = v_phone, email = v_email,
        address = v_area || ', ' || v_address, district = v_district
    where id = v_customer_id;
  end if;

  v_order_number := 'ZS-' || to_char(now() at time zone 'Asia/Dhaka', 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders(
    order_number, source, customer_id, status, subtotal_bdt, discount_bdt,
    delivery_fee_bdt, total_bdt, payment_status, payment_method,
    notes, idempotency_key
  ) values (
    v_order_number, 'website', v_customer_id, 'new', 0, 0,
    0, 0, 'unpaid', 'cash_on_delivery',
    concat_ws(E'\n', 'Area: ' || v_area, 'Address: ' || v_address,
      case when v_notes is not null then 'Customer notes: ' || v_notes end),
    p_idempotency_key
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_count := v_count + 1;
    v_sku := upper(trim(coalesce(v_item->>'sku', '')));
    if v_sku = '' then
      raise exception 'A product in your bag could not be identified. Please return to your bag.' using errcode = '22023';
    end if;

    begin
      v_qty := (v_item->>'quantity')::integer;
    exception when others then
      raise exception 'Invalid product quantity.' using errcode = '22023';
    end;
    if v_qty < 1 or v_qty > 10 then
      raise exception 'Each product quantity must be between 1 and 10.' using errcode = '22023';
    end if;

    -- Lock the product row so price/publication/availability checks are consistent
    -- while this order is being assembled.
    select p.id, p.sku, p.name, p.price_bdt,
           coalesce(p.availability_mode, 'auto') as availability_mode,
           coalesce(i.stock_counted, false) as stock_counted,
           coalesce(i.on_hand - i.reserved, 0) as available_qty,
           p.is_published
    into v_product
    from public.products p
    left join public.inventory i on i.product_id = p.id
    where upper(p.sku) = v_sku or lower(p.slug) = lower(v_sku)
    order by case when upper(p.sku) = v_sku then 0 else 1 end
    limit 1
    for update of p;

    if not found or not v_product.is_published then
      raise exception 'One of the products in your bag is no longer available. Please refresh your bag.' using errcode = 'P0001';
    end if;
    if v_product.availability_mode <> 'pre_order'
       and v_product.stock_counted
       and v_product.available_qty < v_qty then
      raise exception 'Insufficient stock for % (%). Please update your bag.', v_product.name, v_product.sku using errcode = 'P0001';
    end if;

    v_line_total := v_product.price_bdt * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items(
      order_id, product_id, sku_snapshot, name_snapshot,
      unit_price_bdt, quantity, line_total_bdt
    ) values (
      v_order_id, v_product.id, v_product.sku, v_product.name,
      v_product.price_bdt, v_qty, v_line_total
    );
  end loop;

  update public.orders
  set subtotal_bdt = v_subtotal, total_bdt = v_subtotal
  where id = v_order_id;

  insert into public.order_tracking_events(order_id, status, message)
  values (v_order_id, 'new', 'Your order request has been received. Our team will contact you to confirm availability and delivery charge.');

  return jsonb_build_object('success', true, 'order_id', v_order_id,
    'order_number', v_order_number, 'subtotal_bdt', v_subtotal,
    'delivery_fee_bdt', 0, 'total_bdt', v_subtotal, 'reused', false);
end;
$$;

revoke all on function public.create_website_order(jsonb, jsonb, text) from public;
grant execute on function public.create_website_order(jsonb, jsonb, text) to anon, authenticated;

commit;
