# Phase 13 — Digital Money Receipts, Payments & POS

## Included

- A unique `receipt_number` is assigned to every new order, including website orders. Existing orders are backfilled without changing their order numbers, totals, or `updated_at` timestamps.
- Admin Payments screen lists online and in-store sales with total, verified paid amount, outstanding due, and payment status.
- `record_order_payment` records verified full or partial payments transactionally, rejects overpayments, updates the order payment status, and writes an activity log.
- POS modal creates an in-store (`manual`) sale using published catalogue SKUs and database prices. It stores customer details, creates order items, records an optional initial payment, and issues a digital receipt.
- For stock-counted products, POS checks available stock and decrements on-hand inventory in the same database transaction, with an inventory movement record.
- Receipt view displays line items, subtotal, discount, delivery, total, verified payments and remaining due. Print / Save PDF uses the browser print dialog.
- WhatsApp sharing opens a prefilled `wa.me` message. Staff must review and tap Send. This is not automatic delivery; unattended messaging requires an approved WhatsApp Business Platform integration, templates and customer opt-in.

## Database migration

Apply `supabase/migrations/202611080001_digital_receipts_pos_payments.sql` in the Supabase SQL Editor after the existing migrations. The browser admin calls two authenticated RPCs:

- `record_order_payment(uuid, integer, text, text, text)`
- `create_pos_sale(jsonb, jsonb, integer, text, text, text)`

Both RPCs verify the signed-in user has the existing `admin` or `staff` role. The client never writes verified payments directly.

## Operational notes

- Online orders start unpaid; the receipt shows the full outstanding balance until staff records a verified payment.
- Payment status is derived from verified payment rows: `unpaid`, `partially_paid`, or `paid`.
- A POS sale is recorded with order status `delivered` because it is an in-store completed sale.
- POS prices are read from the published product catalogue; this phase intentionally does not allow manual price overrides or discounts.
- Inventory is reduced only when the product's inventory row has `stock_counted = true`. Uncounted inventory is not guessed or decremented.
- Receipt PDF is generated through Print / Save PDF; no PDF file is automatically uploaded or emailed.

## Validation boundary

Source-level checks cover JSX/ES syntax, CSS parsing, migration structure and key payment/stock guards. The admin production build, Supabase migration execution, live RLS behavior, actual POS transaction, print rendering and WhatsApp delivery were not runtime-tested in this environment. Apply the migration before using the new Payments screen.
