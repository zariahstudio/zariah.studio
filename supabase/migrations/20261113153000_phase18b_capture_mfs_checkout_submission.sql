-- Phase 2B follow-up: capture customer-submitted MFS references as pending payment rows.
-- Additive trigger only. Existing orders/payments are not backfilled or rewritten.
-- Populate both legacy NOT NULL and current columns; the existing BEFORE trigger keeps them synchronized.
begin;

create or replace function public.capture_website_mfs_payment_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_method text;
  v_reference text;
  v_amount integer;
begin
  if coalesce(new.source,'') <> 'website' then
    return new;
  end if;

  v_method := lower(btrim(coalesce(new.payment_method,'')));
  v_reference := nullif(btrim(coalesce(new.payment_reference,'')), '');
  v_amount := coalesce(new.total_bdt,0);

  if v_method not in ('bkash','nagad','rocket')
     or v_reference is null
     or v_amount <= 0 then
    return new;
  end if;

  if exists (
    select 1 from public.payments p
    where p.order_id = new.id
      and p.status = 'pending'
      and p.method = v_method
      and p.reference = v_reference
  ) then
    update public.payments
    set amount = v_amount,
        amount_bdt = v_amount
    where order_id = new.id
      and status = 'pending'
      and method = v_method
      and reference = v_reference;
    return new;
  end if;

  update public.payments
  set status = 'rejected',
      verified_at = now(),
      notes = concat_ws(E'\\n', notes, 'Superseded by a newer checkout payment reference.')
  where order_id = new.id and status = 'pending';

  insert into public.payments(
    order_id, amount, payment_method, payment_status, transaction_reference,
    method, amount_bdt, status, reference, notes
  ) values (
    new.id, v_amount, v_method, 'pending', v_reference,
    v_method, v_amount, 'pending', v_reference,
    'Customer-submitted website checkout reference. Awaiting manual verification.'
  );

  return new;
end;
$$;

drop trigger if exists orders_capture_website_mfs_payment on public.orders;
create trigger orders_capture_website_mfs_payment
after insert or update of total_bdt, payment_method, payment_reference
on public.orders
for each row
execute function public.capture_website_mfs_payment_submission();

commit;
