# Phase 16 — Inventory & Sales Intelligence

## Admin features
- Added a Sales Intelligence navigation section.
- Booked product revenue, units sold, estimated gross profit and gross margin.
- Monthly product revenue trend for the last 6 or 12 months.
- Bestselling products ranked by units sold.
- Low-stock alerts based on stock-counted inventory, available quantity (`on_hand - reserved`) and each product's configured threshold.
- Recent inventory movement audit table.
- Product editor now supports an internal Product Cost (BDT) field.
- Inventory adjustments from the Inventory page and Product Editor now call the audited `adjust_inventory_stock` RPC.

## Cost privacy
- Product purchase costs are stored in a separate `product_costs` table.
- The table has staff/admin RLS and no anon access.
- Cost data is not added to the public `products` table or storefront catalogue payload.
- Profit/margin is explicitly marked as estimated and only calculated for lines with a known cost.
- The calculation uses current product cost, not historical cost snapshots. Accounting-grade historical margin requires cost snapshots on order items in a future migration.

## Inventory integrity
- Stock adjustments cannot set on-hand below reserved quantity.
- Stock adjustments are serialized by locking the product row.
- Every non-zero adjustment writes an `inventory_movements` row and an `activity_logs` entry.
- Existing POS stock deductions already write inventory movement rows.

## Revenue definition
- Product revenue is the sum of order item line totals, excluding cancelled and returned orders.
- It includes orders not yet paid and excludes order-level delivery fees/discounts.
- It is therefore booked product revenue, not cash collected or accounting net revenue.

## Database
Apply `supabase/migrations/202611080002_inventory_sales_intelligence.sql` after the initial schema and the existing storefront/catalogue migration that adds `inventory.stock_counted`.

## Validation boundary
- Admin TSX transpile parse: 0 diagnostics.
- Stylesheet PostCSS parse: 0 errors.
- Feature assertions for private product cost storage, sales queries, stock adjustment RPC, low-stock thresholds and movement audit passed.
- ZIP integrity checked after packaging.
- No Vite production build, live Supabase migration/RLS, browser, or device runtime test was performed.
