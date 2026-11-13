-- Checkout and tracking API rate limits. Apply only after the Edge Function is deployed
-- and both storefront pages are switched to it. Do not revoke existing RPC grants
-- until the cutover has been verified in production.

create schema if not exists private;

create table if not exists private.public_api_rate_limits (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash, window_start),
  constraint public_api_rate_limits_scope_check
    check (scope in ('checkout_ip', 'checkout_phone', 'tracking_ip', 'tracking_pair')),
  constraint public_api_rate_limits_count_check check (request_count >= 0)
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.public_api_rate_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on table private.public_api_rate_limits to service_role;

create or replace function public.consume_public_api_rate_limit(
  p_scope text,
  p_key_hash text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_scope not in ('checkout_ip', 'checkout_phone', 'tracking_ip', 'tracking_pair')
     or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_window_seconds < 1 or p_window_seconds > 86400
     or p_max_requests < 1 or p_max_requests > 1000 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into private.public_api_rate_limits(scope, key_hash, window_start, request_count, updated_at)
  values (p_scope, p_key_hash, v_window_start, 1, now())
  on conflict (scope, key_hash, window_start)
  do update set request_count = private.public_api_rate_limits.request_count + 1,
                updated_at = now()
  returning request_count into v_count;

  -- Opportunistic bounded retention cleanup.
  delete from private.public_api_rate_limits
  where window_start < now() - interval '2 days'
    and updated_at < now() - interval '2 days';

  return query select
    (v_count <= p_max_requests),
    greatest(p_max_requests - v_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_public_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_api_rate_limit(text, text, integer, integer) to service_role;


-- Cutover guard: this migration MUST be applied only after the new Edge Function
-- is deployed and both storefront pages are live on the gateway-backed version.
-- The Edge Function uses service_role for these two RPC calls.
revoke execute on function public.create_website_order(jsonb, jsonb, text)
  from public, anon, authenticated;
revoke execute on function public.lookup_order_tracking(text, text)
  from public, anon, authenticated;
grant execute on function public.create_website_order(jsonb, jsonb, text) to service_role;
grant execute on function public.lookup_order_tracking(text, text) to service_role;
