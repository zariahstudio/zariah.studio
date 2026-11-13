-- ZARIAH Privilege Club: purchase-qualified, lifetime membership tiers.
-- Qualifying spend counts only verified payments on orders that are both delivered and fully paid.
-- Membership tiers are monotonic: refunds can reduce qualifying spend/points, but never revoke an earned tier.

begin;

alter table public.customer_loyalty_accounts
  drop constraint if exists customer_loyalty_accounts_tier_check;

update public.customer_loyalty_accounts
set tier = case when tier = 'platinum' then 'vip' else tier end
where tier = 'platinum';

alter table public.customer_loyalty_accounts
  add constraint customer_loyalty_accounts_tier_check
  check (tier in ('bronze','silver','gold','vip'));

-- Reconcile the existing loyalty ledger against the new Delivered + Paid eligibility rule.
update public.loyalty_transactions lt
set status = case
      when o.status = 'delivered'
       and o.payment_status = 'paid'
       and p.status = 'verified' then 'earned'
      else 'reversed'
    end,
    spend_delta_bdt = p.amount_bdt,
    points_delta = floor(p.amount_bdt / 100.0)::integer,
    updated_at = now()
from public.payments p
join public.orders o on o.id = p.order_id
where lt.payment_id = p.id;

with totals as (
  select c.id as customer_id,
    coalesce(sum(case when lt.status='earned' then greatest(lt.points_delta,0) else 0 end),0)::bigint as points_balance,
    coalesce(sum(case when lt.status='earned' then greatest(lt.spend_delta_bdt,0) else 0 end),0)::bigint as qualifying_spend
  from public.customers c
  left join public.loyalty_transactions lt on lt.customer_id=c.id
  group by c.id
)
insert into public.customer_loyalty_accounts(customer_id,points_balance,lifetime_points,lifetime_spend_bdt,tier)
select customer_id,points_balance,points_balance,qualifying_spend,
  case when qualifying_spend>=30000 then 'vip'
       when qualifying_spend>=15000 then 'gold'
       when qualifying_spend>=5000 then 'silver'
       else 'bronze' end
from totals
on conflict(customer_id) do update
set points_balance=excluded.points_balance,
    lifetime_points=greatest(public.customer_loyalty_accounts.lifetime_points,excluded.lifetime_points),
    lifetime_spend_bdt=excluded.lifetime_spend_bdt,
    tier=excluded.tier,
    updated_at=now();

create or replace function public.sync_customer_loyalty_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_order_status text;
  v_payment_status text;
  v_payment record;
  v_old_tier text;
  v_new_tier text;
  v_points bigint;
  v_spend bigint;
begin
  select customer_id,status,payment_status
    into v_customer_id,v_order_status,v_payment_status
  from public.orders
  where id=p_order_id;

  if not found or v_customer_id is null then return; end if;

  insert into public.customer_loyalty_accounts(customer_id)
  values(v_customer_id)
  on conflict(customer_id) do nothing;

  for v_payment in
    select id,amount_bdt,status
    from public.payments
    where order_id=p_order_id
  loop
    if v_order_status='delivered'
       and v_payment_status='paid'
       and v_payment.status='verified' then
      insert into public.loyalty_transactions(customer_id,payment_id,points_delta,spend_delta_bdt,status)
      values(v_customer_id,v_payment.id,floor(v_payment.amount_bdt/100.0)::integer,v_payment.amount_bdt,'earned')
      on conflict(payment_id) do update
      set customer_id=excluded.customer_id,
          points_delta=excluded.points_delta,
          spend_delta_bdt=excluded.spend_delta_bdt,
          status='earned',
          updated_at=now();
    else
      update public.loyalty_transactions
      set status='reversed',updated_at=now()
      where payment_id=v_payment.id and status<>'reversed';
    end if;
  end loop;

  select
    coalesce(sum(case when status='earned' then greatest(points_delta,0) else 0 end),0)::bigint,
    coalesce(sum(case when status='earned' then greatest(spend_delta_bdt,0) else 0 end),0)::bigint
  into v_points,v_spend
  from public.loyalty_transactions
  where customer_id=v_customer_id;

  select tier into v_old_tier
  from public.customer_loyalty_accounts
  where customer_id=v_customer_id
  for update;

  v_new_tier := case
    when v_spend>=30000 then 'vip'
    when v_spend>=15000 then 'gold'
    when v_spend>=5000 then 'silver'
    else 'bronze'
  end;

  -- Keep the highest tier ever achieved, even if later qualifying spend is reversed.
  if case v_old_tier when 'vip' then 3 when 'gold' then 2 when 'silver' then 1 else 0 end
     > case v_new_tier when 'vip' then 3 when 'gold' then 2 when 'silver' then 1 else 0 end then
    v_new_tier := v_old_tier;
  end if;

  update public.customer_loyalty_accounts
  set points_balance=v_points,
      lifetime_spend_bdt=v_spend,
      tier=v_new_tier,
      updated_at=now()
  where customer_id=v_customer_id;
end;
$$;

create or replace function public.apply_verified_payment_loyalty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sync_customer_loyalty_for_order(new.order_id);
  return new;
end;
$$;

create or replace function public.sync_order_loyalty_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sync_customer_loyalty_for_order(new.id);
  return new;
end;
$$;

drop trigger if exists payments_apply_loyalty on public.payments;
create trigger payments_apply_loyalty
after insert or update of status on public.payments
for each row execute function public.apply_verified_payment_loyalty();

drop trigger if exists orders_sync_loyalty on public.orders;
create trigger orders_sync_loyalty
after update of status,payment_status on public.orders
for each row
when (old.status is distinct from new.status or old.payment_status is distinct from new.payment_status)
execute function public.sync_order_loyalty_after_status_change();

revoke all on function public.sync_customer_loyalty_for_order(uuid) from public,anon,authenticated;
revoke all on function public.apply_verified_payment_loyalty() from public,anon,authenticated;
revoke all on function public.sync_order_loyalty_after_status_change() from public,anon,authenticated;

commit;
