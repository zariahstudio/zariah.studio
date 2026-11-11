# Website Order Inventory Lifecycle — Regression Test Plan

**Scope:** `public.apply_website_order_inventory_transition()` and its existing `orders_apply_website_inventory_transition` trigger.

**Safety:** Draft only. Do not apply this migration to the live Supabase project until the scenarios below pass in an isolated staging database. Never use a real customer order as a test fixture.

## Behaviour contract
- Website orders reserve counted, non-pre-order stock when order items are inserted.
- Delivery consumes the matching reservation and reduces on-hand quantity in the same transaction as the status change.
- Cancellation, or a return before delivery, releases the matching reservation.
- Pre-orders and uncounted stock are not adjusted by this trigger.
- Repeated terminal-state updates must not consume or release stock a second time.
- Missing or insufficient reservations for counted stock must raise an exception and roll back the order-status update.
- A delivered return is not automatically put back into sellable stock. It requires inspection and a separate approved stock adjustment.

## Required staging scenarios

| # | Setup / action | Expected result |
|---|---|---|
| 1 | Counted product: on_hand 10, reserved 2; website order quantity 2 moves processing → delivered | on_hand 8, reserved 0; one inventory movement audit entry records -2 |
| 2 | Counted product: on_hand 10, reserved 2; website order quantity 2 moves pending → cancelled | on_hand 10, reserved 0 |
| 3 | Counted product: on_hand 10, reserved 2; order moves shipped → returned before delivery | on_hand 10, reserved 0 |
| 4 | Delivered order changes to returned | No inventory change; no automatic restock |
| 5 | Already delivered order receives another delivered update | No second stock deduction |
| 6 | Pre-order product moves to delivered | No physical stock decrement; supplier confirmation remains governed by checkout validation |
| 7 | Uncounted product moves to delivered | No physical stock decrement |
| 8 | Counted product has no inventory row and moves to delivered | Exception; status remains unchanged |
| 9 | Counted product has reserved quantity below order quantity and moves to delivered | Exception; status and all inventory rows roll back |
| 10 | Multi-item order: first SKU has valid reservation, second SKU has insufficient reservation | Entire status update and first SKU deduction roll back |
| 11 | Two concurrent orders compete for the same counted stock; only one has enough reservation | No negative on_hand/reserved; failed transition rolls back cleanly |
| 12 | Non-website (POS/manual) order changes to delivered | No website reservation logic is applied |

## Verification queries
Run before and after each isolated test and compare the exact fixture product IDs:

```sql
select product_id, on_hand, reserved, stock_counted
from public.inventory
where product_id = any(array['<fixture-product-uuid>'::uuid]);

select order_number, source, order_status
from public.orders
where id = '<fixture-order-uuid>'::uuid;

select product_id, movement_type, quantity_change, reference_type, reference_id, created_at
from public.inventory_movements
where product_id = '<fixture-product-uuid>'::uuid
order by created_at desc;
```

## Release gate
1. Apply only to a disposable/staging database using the repository migration workflow.
2. Execute all 12 scenarios, including multi-SKU rollback and concurrency.
3. Confirm function ownership, SECURITY DEFINER, empty search_path, and existing trigger attachment remain intact.
4. Review inventory movement audit entries and order status history.
5. Confirm the live database schema and data remain unchanged until an explicit production approval.

## Open business policy
A returned item may be restocked only after physical inspection confirms it is sellable. This migration intentionally does not automate that decision. A separate QC outcome and stock-adjustment workflow should be designed before automating returned-goods restocking.