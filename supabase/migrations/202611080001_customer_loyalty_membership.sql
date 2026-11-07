-- ZARIAH Studio Phase 15: customer loyalty points and spend-based membership tiers.
-- Apply after Phase 13 payment/receipt migration.

begin;

create table if not exists public.customer_loyalty_accounts (
  customer_id uuid primary key references public.customers(id) on delete restrict,
  points_balance bigint not null default 0 check (points_balance >= 0),
  lifetime_points bigint not null default 0 check (lifetime_points >= 0),
  lifetime_spend_bdt bigint not null default 0 check (lifetime_spend_bdt >= 0),
  tier text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  points_delta integer not null default 0,
  spend_delta_bdt integer not null,
  status text not null default 'earned' check (status in ('earned','reversed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_customer_created_idx
  on public.loyalty_transactions(customer_id, created_at desc);

alter table public.customer_loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;

drop policy if exists "loyalty_accounts_staff_read" on public.customer_loyalty_accounts;
create policy "loyalty_accounts_staff_read" on public.customer_loyalty_accounts
for select to authenticated using ((select public.is_staff_or_admin()));

drop policy if exists "loyalty_transactions_staff_read" on public.loyalty_transactions;
create policy "loyalty_transactions_staff_read" on public.loyalty_transactions
for select to authenticated using ((select public.is_staff_or_admin()));

revoke all on public.customer_loyalty_accounts from anon, authenticated;
revoke all on public.loyalty_transactions from anon, authenticated;
grant select on public.customer_loyalty_accounts to authenticated;
grant select on public.loyalty_transactions to authenticated;

-- Backfill loyalty balances and ledger entries from all currently verified payments.
-- Earning rule: 1 point for each complete ৳100 in an individual verified payment.
insert into public.loyalty_transactions(customer_id, payment_id, points_delta, spend_delta_bdt, status)
select o.customer_id, p.id, floor(p.amount_bdt / 100.0)::integer, p.amount_bdt, 'earned'
from public.payments p
join public.orders o on o.id = p.order_id
where p.status = 'verified'
on conflict (payment_id) do nothing;

insert into public.customer_loyalty_accounts(
  customer_id, points_balance, lifetime_points, lifetime_spend_bdt, tier
)
select
  c.id,
  coalesce(sum(case when lt.status = 'earned' then greatest(lt.points_delta,0) else 0 end),0)::bigint,
  coalesce(sum(case when lt.status = 'earned' then greatest(lt.points_delta,0) else 0 end),0)::bigint,
  coalesce(sum(case when lt.status = 'earned' then greatest(lt.spend_delta_bdt,0) else 0 end),0)::bigint,
  case
    when coalesce(sum(case when lt.status = 'earned' then greatest(lt.spend_delta_bdt,0) else 0 end),0) >= 50000 then 'platinum'
    when coalesce(sum(case when lt.status = 'earned' then greatest(lt.spend_delta_bdt,0) else 0 end),0) >= 25000 then 'gold'
    when coalesce(sum(case when lt.status = 'earned' then greatest(lt.spend_delta_bdt,0) else 0 end),0) >= 10000 then 'silver'
    else 'bronze'
  end
from public.customers c
left join public.loyalty_transactions lt on lt.customer_id = c.id
group by c.id
on conflict (customer_id) do nothing;

create or replace function public.refresh_customer_loyalty_tier(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_spend bigint;
  v_tier text;
begin
  select lifetime_spend_bdt into v_spend
  from public.customer_loyalty_accounts
  where customer_id = p_customer_id
  for update;

  if not found then return; end if;

  v_tier := case
    when v_spend >= 50000 then 'platinum'
    when v_spend >= 25000 then 'gold'
    when v_spend >= 10000 then 'silver'
    else 'bronze'
  end;

  update public.customer_loyalty_accounts
  set tier = v_tier, updated_at = now()
  where customer_id = p_customer_id;
end;
$$;

create or replace function public.apply_verified_payment_loyalty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_existing public.loyalty_transactions%rowtype;
  v_points integer;
begin
  select o.customer_id into v_customer_id
  from public.orders o
  where o.id = new.order_id;

  if v_customer_id is null then return new; end if;

  insert into public.customer_loyalty_accounts(customer_id)
  values (v_customer_id)
  on conflict (customer_id) do nothing;

  if new.status = 'verified'
     and (tg_op = 'INSERT' or old.status is distinct from 'verified') then
    select * into v_existing
    from public.loyalty_transactions
    where payment_id = new.id
    for update;

    if found and v_existing.status = 'reversed' then
      update public.customer_loyalty_accounts
      set points_balance = points_balance + greatest(v_existing.points_delta,0),
          lifetime_spend_bdt = lifetime_spend_bdt + greatest(v_existing.spend_delta_bdt,0),
          updated_at = now()
      where customer_id = v_customer_id;

      update public.loyalty_transactions
      set status = 'earned', updated_at = now()
      where payment_id = new.id;
    elsif not found then
      v_points := floor(new.amount_bdt / 100.0)::integer;
      update public.customer_loyalty_accounts
      set points_balance = points_balance + v_points,
          lifetime_points = lifetime_points + v_points,
          lifetime_spend_bdt = lifetime_spend_bdt + new.amount_bdt,
          updated_at = now()
      where customer_id = v_customer_id;

      insert into public.loyalty_transactions(customer_id,payment_id,points_delta,spend_delta_bdt,status)
      values(v_customer_id,new.id,v_points,new.amount_bdt,'earned');
    end if;

    perform public.refresh_customer_loyalty_tier(v_customer_id);

  elsif tg_op = 'UPDATE'
    and old.status = 'verified'
    and new.status in ('refunded','rejected') then
    select * into v_existing
    from public.loyalty_transactions
    where payment_id = new.id
    for update;

    if found and v_existing.status = 'earned' then
      update public.customer_loyalty_accounts
      set points_balance = greatest(points_balance - greatest(v_existing.points_delta,0),0),
          lifetime_spend_bdt = greatest(lifetime_spend_bdt - greatest(v_existing.spend_delta_bdt,0),0),
          updated_at = now()
      where customer_id = v_customer_id;

      update public.loyalty_transactions
      set status = 'reversed', updated_at = now()
      where payment_id = new.id;

      perform public.refresh_customer_loyalty_tier(v_customer_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists payments_apply_loyalty on public.payments;
create trigger payments_apply_loyalty
after insert or update of status on public.payments
for each row execute function public.apply_verified_payment_loyalty();

revoke all on function public.refresh_customer_loyalty_tier(uuid) from public;
revoke all on function public.apply_verified_payment_loyalty() from public;

commit;
