-- Owner-only POS idempotency wrapper.
-- Preserves the existing staff/admin create_pos_sale RPC and its signature.
create table if not exists private.owner_pos_sale_idempotency (
  actor_id uuid not null,
  idempotency_key text not null,
  request_hash text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_id, idempotency_key),
  constraint owner_pos_sale_idempotency_key_length
    check (length(idempotency_key) between 16 and 128)
);

alter table private.owner_pos_sale_idempotency enable row level security;
revoke all on table private.owner_pos_sale_idempotency from public, anon, authenticated;

create or replace function public.owner_app_create_pos_sale(
  p_customer jsonb,
  p_items jsonb,
  p_payment_amount_bdt integer default 0,
  p_payment_method text default 'cash',
  p_payment_reference text default null,
  p_notes text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid;
  v_hash text;
  v_rows integer;
  v_existing_hash text;
  v_response jsonb;
begin
  v_actor := (select auth.uid());
  if v_actor is null or not private.is_admin() then
    raise exception 'Not authorized to create Owner App sales.' using errcode = '42501';
  end if;

  if p_idempotency_key is null
     or length(p_idempotency_key) < 16
     or length(p_idempotency_key) > 128
     or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$' then
    raise exception 'A valid idempotency key is required.' using errcode = '22023';
  end if;

  v_hash := md5(jsonb_build_object(
    'customer', p_customer,
    'items', p_items,
    'payment_amount_bdt', coalesce(p_payment_amount_bdt, 0),
    'payment_method', p_payment_method,
    'payment_reference', p_payment_reference,
    'notes', p_notes
  )::text);

  insert into private.owner_pos_sale_idempotency(
    actor_id, idempotency_key, request_hash
  ) values (v_actor, p_idempotency_key, v_hash)
  on conflict (actor_id, idempotency_key) do nothing;

  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    select request_hash, response
      into v_existing_hash, v_response
    from private.owner_pos_sale_idempotency
    where actor_id = v_actor and idempotency_key = p_idempotency_key
    for update;

    if v_existing_hash is distinct from v_hash then
      raise exception 'This idempotency key was already used for a different sale.' using errcode = '22023';
    end if;
    if v_response is null then
      raise exception 'The previous sale request is incomplete. Contact support before retrying.' using errcode = '55000';
    end if;
    return v_response;
  end if;

  v_response := public.create_pos_sale(
    p_customer, p_items, p_payment_amount_bdt, p_payment_method,
    p_payment_reference, p_notes
  );

  update private.owner_pos_sale_idempotency
  set response = v_response
  where actor_id = v_actor and idempotency_key = p_idempotency_key;

  return v_response;
end;
$function$;

revoke all on function public.owner_app_create_pos_sale(jsonb,jsonb,integer,text,text,text,text) from public, anon;
grant execute on function public.owner_app_create_pos_sale(jsonb,jsonb,integer,text,text,text,text) to authenticated;
