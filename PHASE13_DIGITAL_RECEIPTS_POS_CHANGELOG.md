# Phase 13 — Digital Money Receipt & POS

- Added automatic unique receipt numbers for new orders and backfilled existing orders.
- Added authenticated RPCs for verified payments and in-store POS sales.
- Added outstanding due, partial-payment and payment-history handling in Admin.
- Added printable / Save as PDF digital receipts and prefilled WhatsApp sharing.
- POS uses published catalogue prices and decrements stock only for stock-counted items.
- Restricted direct browser writes to the payments ledger; writes go through RPCs.

Apply `supabase/migrations/202611080001_digital_receipts_pos_payments.sql` before using the new Payments module.
WhatsApp is a staff-confirmed share action, not automated delivery. Production Supabase and browser runtime tests remain outstanding.
