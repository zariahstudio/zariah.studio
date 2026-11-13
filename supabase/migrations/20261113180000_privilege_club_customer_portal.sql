-- Secure customer self-service access to ZARIAH Privilege Club via verified phone OTP.
begin;

alter table public.customers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists customers_auth_user_id_uidx
  on public.customers(auth_user_id)
  where auth_user_id is not null;

create or replace function public.get_my_privilege_club()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
  v_digits text;
  v_customer_id uuid;
  v_match_count integer;
  v_account public.customer_loyalty_accounts%rowtype;
  v_transactions jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in with your verified mobile number first.' using errcode='42501';
  end if;

  select u.phone
    into v_phone
  from auth.users u
  where u.id=v_uid
    and u.phone_confirmed_at is not null;

  if v_phone is null then
    raise exception 'A verified mobile number is required.' using errcode='42501';
  end if;

  v_digits := regexp_replace(v_phone,'[^0-9]','','g');
  if left(v_digits,3)='880' then
    v_digits := '0' || substr(v_digits,4);
  end if;

  select count(*)::integer, min(c.id)
    into v_match_count,v_customer_id
  from public.customers c
  where regexp_replace(c.phone,'[^0-9]','','g') =
    case when left(v_digits,3)='880' then '0'||substr(v_digits,4) else v_digits end;

  if v_match_count=0 then
    return jsonb_build_object('found',false,'message','No ZARIAH customer profile is linked to this verified mobile number yet.');
  elsif v_match_count>1 then
    raise exception 'More than one customer profile matches this mobile number. Please contact support for a safe account review.' using errcode='P0001';
  end if;

  update public.customers
  set auth_user_id=v_uid,updated_at=now()
  where id=v_customer_id
    and (auth_user_id is null or auth_user_id=v_uid);

  if not found then
    raise exception 'This customer profile is already linked to another login. Please contact support.' using errcode='42501';
  end if;

  select * into v_account
  from public.customer_loyalty_accounts
  where customer_id=v_customer_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'date',lt.created_at,
    'points',case when lt.status='earned' then lt.points_delta else -abs(lt.points_delta) end,
    'spend_bdt',lt.spend_delta_bdt,
    'status',lt.status
  ) order by lt.created_at desc),'[]'::jsonb)
  into v_transactions
  from public.loyalty_transactions lt
  where lt.customer_id=v_customer_id;

  return jsonb_build_object(
    'found',true,
    'member_id','ZS-'||upper(substr(replace(v_customer_id::text,'-',''),1,12)),
    'member_name',(select c.full_name from public.customers c where c.id=v_customer_id),
    'tier',coalesce(v_account.tier,'bronze'),
    'points_balance',coalesce(v_account.points_balance,0),
    'lifetime_points',coalesce(v_account.lifetime_points,0),
    'qualifying_spend_bdt',coalesce(v_account.lifetime_spend_bdt,0),
    'transactions',v_transactions
  );
end;
$$;

revoke all on function public.get_my_privilege_club() from public,anon;
grant execute on function public.get_my_privilege_club() to authenticated;

commit;
