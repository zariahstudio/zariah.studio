-- Phase 2B: secure manual payment verification.
-- Additive only. Apply after review and explicit production approval.
begin;

create or replace function public.review_order_payment(
  p_payment_id uuid,
  p_decision text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_due numeric;
  v_paid numeric;
  v_reason text := nullif(btrim(coalesce(p_reason,'')), '');
begin
  if auth.uid() is null or not public.is_staff_or_admin() then
    raise exception 'You are not authorised to review payments.' using errcode = '42501';
  end if;
  if p_payment_id is null or p_decision not in ('verify','reject') then
    raise exception 'Invalid payment review request.' using errcode = '22023';
  end if;
  if length(coalesce(v_reason,'')) > 500 then
    raise exception 'Review reason is too long.' using errcode = '22023';
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;
  if not found then
    raise exception 'Payment record not found.' using errcode = 'P0002';
  end if;
  if v_payment.status <> 'pending' then
    raise exception 'Only pending payments can be reviewed.' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where id = v_payment.order_id
  for update;
  if not found then
    raise exception 'Related order not found.' using errcode = 'P0002';
  end if;
  if v_order.order_status in ('cancelled','returned') then
    raise exception 'Cannot verify payment for a cancelled or returned order.' using errcode = '22023';
  end if;

  if p_decision = 'verify' then
    if v_payment.amount_bdt is null or v_payment.amount_bdt <= 0 then
      raise exception 'Payment amount is invalid.' using errcode = '22023';
    end if;
    if v_payment.method not in ('bkash','nagad','rocket','bank_transfer') then
      raise exception 'Only traceable transfer methods can be manually verified here.' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(v_payment.reference,'')), '') is null then
      raise exception 'Transaction reference is required before verification.' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.payments p
      where p.id <> v_payment.id
        and p.status = 'verified'
        and lower(btrim(coalesce(p.reference,''))) = lower(btrim(v_payment.reference))
    ) then
      raise exception 'This transaction reference has already been verified on another payment.' using errcode = '23505';
    end if;
    select coalesce(sum(p.amount_bdt),0) into v_paid
    from public.payments p
    where p.order_id = v_order.id and p.status = 'verified';
    v_due := greatest(v_order.total_bdt - v_paid,0);
    if v_payment.amount_bdt > v_due then
      raise exception 'Payment amount exceeds the outstanding order balance.' using errcode = '22023';
    end if;
    update public.payments
    set status = 'verified',
        verified_by = auth.uid(),
        verified_at = now(),
        notes = case when v_reason is null then notes else concat_ws(E'\n',notes,'Verification: '||v_reason) end
    where id = p_payment_id;
  else
    if v_reason is null then
      raise exception 'A rejection reason is required.' using errcode = '22023';
    end if;
    update public.payments
    set status = 'rejected',
        verified_by = auth.uid(),
        verified_at = now(),
        notes = concat_ws(E'\n',notes,'Rejected: '||v_reason)
    where id = p_payment_id;
  end if;

  insert into public.activity_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),
    case when p_decision='verify' then 'payment_verified' else 'payment_rejected' end,
    'payment',p_payment_id,
    jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,
      'amount_bdt',v_payment.amount_bdt,'method',v_payment.method,
      'reference',v_payment.reference,'reason',v_reason));

  return jsonb_build_object('success',true,'decision',p_decision,
    'payment_id',p_payment_id,'order_id',v_order.id);
end;
$$;

revoke all on function public.review_order_payment(uuid,text,text) from public, anon;
grant execute on function public.review_order_payment(uuid,text,text) to authenticated;

commit;
