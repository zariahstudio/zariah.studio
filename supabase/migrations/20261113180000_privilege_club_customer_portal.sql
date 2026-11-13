-- Verified-email self-service access for ZARIAH Privilege Club.
-- Mobile number is collected as profile data; it is not used as an authentication factor.
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
  v_email text;
  v_phone text;
  v_digits text;
  v_name text;
  v_customer_id uuid;
  v_email_count integer;
  v_phone_count integer;
  v_account public.customer_loyalty_accounts%rowtype;
  v_transactions jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in with your verified email address first.' using errcode='42501';
  end if;

  select lower(trim(u.email)), u.raw_user_meta_data->>'phone', nullif(trim(u.raw_user_meta_data->>'full_name'),'')
    into v_email, v_phone, v_name
  from auth.users u
  where u.id=v_uid
    and u.email_confirmed_at is not null;

  if v_email is null then
    raise exception 'A verified email address is required.' using errcode='42501';
  end if;

  -- Existing linked accounts are resolved by auth identity, not editable signup metadata.
  select c.id into v_customer_id
  from public.customers c
  where c.auth_user_id=v_uid;

  if v_customer_id is null then
    v_digits := regexp_replace(coalesce(v_phone,''),'[^0-9]','','g');
    if left(v_digits,5)='00880' then
      v_digits := substr(v_digits,3);
    end if;
    if left(v_digits,3)='880' then
      v_digits := '0'||substr(v_digits,4);
    end if;
    if v_digits !~ '^01[3-9][0-9]{8}$' then
      raise exception 'A valid Bangladesh mobile number is required to create your membership.' using errcode='22023';
    end if;

    select count(*)::integer into v_email_count
    from public.customers c
    where lower(trim(coalesce(c.email,'')))=v_email;

    if v_email_count > 1 then
      raise exception 'Multiple customer profiles use this email. Please contact support.' using errcode='P0001';
    elsif v_email_count = 1 then
      select c.id into v_customer_id
      from public.customers c
      where lower(trim(coalesce(c.email,'')))=v_email
      limit 1;

      if (
        case
          when left(regexp_replace(coalesce((select c.phone from public.customers c where c.id=v_customer_id),''),'[^0-9]','','g'),5)='00880'
            then substr(regexp_replace((select c.phone from public.customers c where c.id=v_customer_id),'[^0-9]','','g'),3)
          else regexp_replace((select c.phone from public.customers c where c.id=v_customer_id),'[^0-9]','','g')
        end
      ) is distinct from v_digits then
        raise exception 'The email matches an existing customer, but the mobile number does not. Please contact support to link your account safely.' using errcode='42501';
      end if;
    else
      select count(*)::integer into v_phone_count
      from public.customers c
      where case
        when left(regexp_replace(coalesce(c.phone,''),'[^0-9]','','g'),5)='00880'
          then substr(regexp_replace(c.phone,'[^0-9]','','g'),3)
        when left(regexp_replace(coalesce(c.phone,''),'[^0-9]','','g'),3)='880'
          then '0'||substr(regexp_replace(c.phone,'[^0-9]','','g'),4)
        else regexp_replace(coalesce(c.phone,''),'[^0-9]','','g')
      end = v_digits;

      if v_phone_count > 0 then
        raise exception 'This mobile number is already associated with another customer profile. Please contact support.' using errcode='42501';
      end if;

      insert into public.customers(full_name,phone,email)
      values(coalesce(v_name,'ZARIAH Member'),v_digits,v_email)
      returning id into v_customer_id;
    end if;

    update public.customers
      set auth_user_id=v_uid, updated_at=now()
    where id=v_customer_id
      and (auth_user_id is null or auth_user_id=v_uid);

    if not found then
      raise exception 'This customer profile is already linked to another login. Please contact support.' using errcode='42501';
    end if;
  end if;

  insert into public.customer_loyalty_accounts(customer_id)
  values(v_customer_id)
  on conflict(customer_id) do nothing;

  select * into v_account
  from public.customer_loyalty_accounts
  where customer_id=v_customer_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'date',activity.created_at,
    'points',case when activity.status='earned' then activity.points_delta else -abs(activity.points_delta) end,
    'spend_bdt',activity.spend_delta_bdt,
    'status',activity.status
  ) order by activity.created_at desc),'[]'::jsonb)
  into v_transactions
  from (
    select lt.created_at,lt.points_delta,lt.spend_delta_bdt,lt.status
    from public.loyalty_transactions lt
    where lt.customer_id=v_customer_id
    order by lt.created_at desc
    limit 30
  ) activity;

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
