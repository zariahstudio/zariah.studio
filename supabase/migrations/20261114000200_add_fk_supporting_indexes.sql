-- Add indexes for currently unindexed public-schema foreign-key columns.
-- These indexes support admin joins, audit history lookups and referential checks.
-- This migration is committed for review only; it is not applied to production here.
begin;

create index if not exists activity_logs_actor_id_idx on public.activity_logs (actor_id);
create index if not exists authenticity_evidence_verified_by_idx on public.authenticity_evidence (verified_by);
create index if not exists business_investments_created_by_idx on public.business_investments (created_by);
create index if not exists expenses_created_by_idx on public.expenses (created_by);
create index if not exists inventory_movements_actor_id_idx on public.inventory_movements (actor_id);
create index if not exists inventory_movements_created_by_idx on public.inventory_movements (created_by);
create index if not exists inventory_movements_product_id_idx on public.inventory_movements (product_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists order_status_history_changed_by_idx on public.order_status_history (changed_by);
create index if not exists order_status_history_order_id_idx on public.order_status_history (order_id);
create index if not exists order_tracking_events_created_by_idx on public.order_tracking_events (created_by);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists payments_recorded_by_idx on public.payments (recorded_by);
create index if not exists payments_verified_by_idx on public.payments (verified_by);

commit;
