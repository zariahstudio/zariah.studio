# Phase 14 — Customer Management & Receipt History

## Included
- Replaced the Customers & Members placeholder with an admin customer directory.
- Customer directory loads the `customers` table and each customer's linked orders and verified payment rows using existing Supabase relationships and RLS.
- Search by name, mobile number, email or district.
- Sort by recent customer, lifetime spend, order count or outstanding due.
- Summary metrics: total customers, repeat customers, lifetime sales and outstanding due.
- Customer profile shows contact/address information, order history, receipt numbers, channel, totals and payment status.
- Each historical order can open its existing Phase 13 digital receipt.
- Staff can update customer name, phone, email, address and district through the existing staff-protected customers table policy.
- Customer totals exclude cancelled and returned orders. Paid amounts include only verified payment ledger rows.

## Database
No new migration is required. This phase uses the existing `customers`, `orders` and `payments` tables and the existing `customers_staff_access` / payment read policies. The Phase 13 migration is still a prerequisite for receipt numbers and payment history.

## Validation boundary
Source-level JSX/JavaScript and production build checks are required. Supabase live RLS, embedded relationship query behavior, and real customer records were not tested against the production project in this environment.
