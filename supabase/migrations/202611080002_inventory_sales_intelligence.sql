-- ZARIAH Studio Phase 16: product cost basis and audited inventory adjustments.
-- Apply after the initial schema and Phase 13 payments/POS migration.

begin;

-- Keep purchase costs in a separate staff-only table. Adding cost to the public
-- products table would expose margin data through the storefront product policy.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_bdt integer not null check (cost_bdt >= 0),
  updated_at timestamptz not null default now()
);

alter table public.product_costs enable row level security;
drop policy if exists "product_costs_staff_access" on public.product_costs;
create policy "product_costs_staff_access" on public.product_costs
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
revoke all on public.product_costs from anon, authenticated;
grant select, insert, update, delete on public.product_costs to authenticated;

create or replace function public.adjust_inventory_stock(
  p_product_id uuid,
  p_new_on_hand integer,
  p_reason text default 'manual_adjustment'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_reserved integer;
  v_delta integer;
  v_name text;
  v_movement_id uuid;
begin
  if not public.is_staff_or_admin() then
    raise exception 'You are not authorised to adjust inventory.' using errcode = '42501';
  end if;
  if p_product_id is null or p_new_on_hand is null or p_new_on_hand < 0 then
    raise exception 'Enter a valid non-negative stock quantity.' using errcode = '22023';
  end if;
  if coalesce(length(btrim(p_reason)),0) < 3 or length(p_reason) > 120 then
    raise exception 'Enter a stock adjustment reason.' using errcode = '22023';
  end if;

  select coalesce(i.on_hand,0), coalesce(i.reserved,0), p.name
    into v_current, v_reserved, v_name
  from public.products p
  left join public.inventory i on i.product_id = p.id
  where p.id = p_product_id
  for update of p;

  if not found then
    raise exception 'Product not found.' using errcode = 'P0002';
  end if;
  if p_new_on_hand < v_reserved then
    raise exception 'Stock cannot be lower than reserved quantity (%).', v_reserved using errcode = '22023';
  end if;

  v_delta := p_new_on_hand - v_current;
  if v_delta = 0 then
    return jsonb_build_object('success',true,'changed',false,'on_hand',v_current,'delta',0);
  end if;

  insert into public.inventory(product_id,on_hand,reserved,low_stock_threshold,stock_counted)
  values(p_product_id,p_new_on_hand,v_reserved,2,true)
  on conflict (product_id) do update
    set on_hand = excluded.on_hand,
        stock_counted = true,
        updated_at = now();

  insert into public.inventory_movements(product_id,quantity_delta,reason,reference,actor_id)
  values(p_product_id,v_delta,btrim(p_reason), 'admin_stock_adjustment',auth.uid())
  returning id into v_movement_id;

  insert into public.activity_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'inventory_adjusted','product',p_product_id,
    jsonb_build_object('product_name',v_name,'previous_on_hand',v_current,'new_on_hand',p_new_on_hand,'delta',v_delta,'reason',btrim(p_reason)));

  return jsonb_build_object('success',true,'changed',true,'on_hand',p_new_on_hand,'delta',v_delta,'movement_id',v_movement_id);
end;
$$;

revoke all on function public.adjust_inventory_stock(uuid,integer,text) from public;
grant execute on function public.adjust_inventory_stock(uuid,integer,text) to authenticated;

commit;
