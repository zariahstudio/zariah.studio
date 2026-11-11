# Website Order Inventory Lifecycle — Regression Test Plan

**Scope:** Per-order reservation ledger, website order reservation trigger, and the existing order inventory transition trigger.

**Safety:** Draft only. Do not apply this migration to the live Supabase project until the preflight reconciliation and scenarios below pass in an isolated staging database. Never use a real customer order as a test fixture.

## Read-only audit finding

At the time of drafting, two open website orders were found for counted, non-pre-order products while their inventory rows showed zero reserved units. The migration therefore includes a preflight guard: it aborts if aggregate open website order quantities do not exactly match inventory.reserved for any affected SKU. This avoids guessing which order owns pooled reservations. Reconcile those orders before production migration.

## Behaviour contract

- Website orders reserve counted, non-pre-order stock when order items are inserted.
- Each successful reservation is recorded against its exact order and product.
- Delivery consumes only that order's ledger reservation and reduces on-hand quantity in the same transaction as the status change.
- Cancellation, or a return before delivery, releases only that order's ledger reservation.
- Product availability-mode changes do not reassign another order's reservation.
- Pre-orders and uncounted stock do not create physical stock reservations.
- Repeated terminal-state updates must not consume or release stock a second time.
- Missing or inconsistent ledger reservations for counted stock must raise an exception and roll back the order-status update.
- A delivered return is not automatically put back into sellable stock. It requires inspection and a separate approved stock adjustment.

## Required staging scenarios

| # | Setup / action | Expected result |
|---|---|---|
| 1 | Counted product: on_hand 10; order quantity 2 reserves stock | on_hand 10, reserved 2; matching per-order ledger row quantity 2 |
| 2 | Counted product: reservation 2; order moves processing → delivered | on_hand 8, reserved 0; ledger state consumed; one inventory movement audit entry records -2 |
| 3 | Counted product: reservation 2; order moves pending → cancelled | on_hand 10, reserved 0; ledger state released |
| 4 | Counted product: reservation 2; order moves shipped → returned before delivery | on_hand 10, reserved 0; ledger state released |
| 5 | Delivered order changes to returned | No inventory change; no automatic restock |
| 6 | Already delivered order receives another delivered update | No second stock deduction |
| 7 | Product is changed to pre-order after an order reservation is recorded, then order is delivered | That order's recorded reservation is still consumed correctly |
| 8 | Product is changed from pre-order to counted/auto after an order was placed without reservation | Delivery fails safely; no other order's reservation is consumed |
| 9 | Pre-order product moves to delivered | No physical stock decrement; no reservation ledger row required |
| 10 | Uncounted product moves to delivered | No physical stock decrement; no reservation ledger row required |
| 11 | Counted product has no matching reservation ledger row | Exception; status remains unchanged |
| 12 | Multi-item order: first SKU has valid reservation, second SKU has insufficient inventory reservation | Entire status update and first SKU deduction roll back |
| 13 | Two concurrent orders compete for counted stock | No negative on_hand/reserved; each transition is isolated to its own ledger row |
| 14 | Non-website (POS/manual) order changes to delivered | No website reservation logic is applied |
| 15 | Migration preflight: aggregate reserved quantity differs from open website order quantity for a SKU | Migration aborts with product ID and expected/actual quantities; no partial migration commits |

## Verification queries

Run before and after each isolated test and compare exact fixture IDs:

```sql
select product_id, on_hand, reserved, stock_counted
from public.inventory
where product_id = '<fixture-product-uuid>'::uuid;

select order_number, source, order_status
from public.orders
where id = '<fixture-order-uuid>'::uuid;

select order_id, product_id, quantity, reservation_status, created_at, updated_at
from private.website_order_inventory_reservations
where order_id = '<fixture-order-uuid>'::uuid;

select product_id, movement_type, quantity_change, reference_type, reference_id, created_at
from public.inventory_movements
where product_id = '<fixture-product-uuid>'::uuid
order by created_at desc;
```

## Release gate

1. Reconcile the currently open website orders against actual inventory before applying the migration.
2. Apply only to a disposable/staging database using the repository migration workflow.
3. Execute all 15 scenarios, including multi-SKU rollback and concurrency.
4. Confirm function ownership, SECURITY DEFINER, empty search_path, and existing trigger attachment remain intact.
5. Review inventory movement audit entries, reservation ledger states, and order status history.
6. Confirm the live database schema and data remain unchanged until explicit production approval.

## Open business policy

A returned item may be restocked only after physical inspection confirms it is sellable. This migration intentionally does not automate that decision. A separate QC outcome and stock-adjustment workflow should be designed before automating returned-goods restocking.
