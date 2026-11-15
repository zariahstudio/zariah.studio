-- Correct Owner App read-only Orders RPCs to match the canonical schema.
-- The original Owner App migration referenced legacy/nonexistent column names.
-- This migration changes no business records and preserves the RPC signatures.
create or replace function public.owner_app_list_orders(
  p_search text default null,p_status text default null,p_limit integer default 25,p_offset integer default 0
)
returns table (
  id uuid,order_number text,customer_name text,customer_phone text,total_bdt integer,
  amount_paid numeric,payment_status text,order_status text,order_source text,created_at timestamptz
)
language plpgsql stable security definer set search_path to ''
as $$
begin
  if (select auth.uid()) is null or not private.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 or p_offset is null or p_offset < 0 then
    raise exception 'Invalid pagination parameters' using errcode = '22023';
  end if;
  if p_status is not null and p_status <> ''
     and p_status not in ('new','confirmed','processing','shipped','delivered','cancelled','returned') then
    raise exception 'Invalid order status filter' using errcode = '22023';
  end if;
  return query
  select o.id,o.order_number,c.full_name,c.phone,o.total_bdt,
    coalesce((select sum(p.amount_bdt)::numeric from public.payments p
      where p.order_id=o.id and p.status='verified'),0::numeric),
    o.payment_status,o.status,o.source,o.created_at
  from public.orders o join public.customers c on c.id=o.customer_id
  where (nullif(btrim(p_status),'') is null or o.status=p_status)
    and (nullif(btrim(p_search),'') is null
      or o.order_number ilike '%'||left(btrim(p_search),120)||'%'
      or c.full_name ilike '%'||left(btrim(p_search),120)||'%'
      or c.phone ilike '%'||left(btrim(p_search),120)||'%')
  order by o.created_at desc,o.id desc limit p_limit offset p_offset;
end;
$$;

create or replace function public.owner_app_get_order(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path to ''
as $$
declare v_order jsonb; v_items jsonb; v_payments jsonb;
begin
  if (select auth.uid()) is null or not private.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_order_id is null then raise exception 'Order ID is required' using errcode = '22023'; end if;
  select jsonb_build_object(
    'id',o.id,'order_number',o.order_number,'customer_name',c.full_name,
    'customer_phone',c.phone,'delivery_address',c.address,
    'subtotal_bdt',o.subtotal_bdt,'discount_bdt',o.discount_bdt,
    'delivery_fee_bdt',o.delivery_fee_bdt,'total_bdt',o.total_bdt,
    'amount_paid',coalesce((select sum(p.amount_bdt)::numeric from public.payments p
      where p.order_id=o.id and p.status='verified'),0::numeric),
    'payment_status',o.payment_status,'order_status',o.status,'order_source',o.source,
    'payment_method',o.payment_method,'payment_reference',o.payment_reference,
    'notes',o.notes,'created_at',o.created_at
  ) into v_order from public.orders o join public.customers c on c.id=o.customer_id where o.id=p_order_id;
  if v_order is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,'product_name',i.name_snapshot,'sku',i.sku_snapshot,'quantity',i.quantity,
    'unit_price_bdt',i.unit_price_bdt,'line_total_bdt',i.line_total_bdt
  ) order by i.created_at),'[]'::jsonb) into v_items
  from public.order_items i where i.order_id=p_order_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'amount_bdt',p.amount_bdt,'payment_method',p.method,'status',p.status,
    'reference',p.reference,'received_at',p.created_at
  ) order by p.created_at desc),'[]'::jsonb) into v_payments
  from public.payments p where p.order_id=p_order_id;
  return jsonb_build_object('order',v_order,'items',v_items,'payments',v_payments);
end;
$$;

revoke all on function public.owner_app_list_orders(text,text,integer,integer) from public,anon;
revoke all on function public.owner_app_get_order(uuid) from public,anon;
grant execute on function public.owner_app_list_orders(text,text,integer,integer) to authenticated;
grant execute on function public.owner_app_get_order(uuid) to authenticated;
