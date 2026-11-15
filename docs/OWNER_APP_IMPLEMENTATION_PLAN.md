# ZARIAH Owner App — Implementation Plan

## Goal
Build a separate, mobile-first, installable Progressive Web App (PWA) for ZARIAH Studio operations. The existing storefront and Admin Panel remain unchanged. The app reuses the existing production Supabase project and business records; it must not create a parallel order, product, customer, inventory, or finance database.

## Delivery principles
- Work only on `feature/zariah-owner-app`; never commit Owner App work directly to `main`.
- Do not modify the storefront, existing Admin Panel, current deployment workflow, or production database as part of the initial UI foundation.
- Use the existing Supabase Auth client and publishable key only. Never expose a service-role key in browser code.
- Enforce authorization in database policies/RPCs, not only by hiding UI controls.
- Keep existing online checkout/order creation behavior intact.
- Archive/unpublish products rather than hard-delete records referenced by historical orders.
- Every financial or stock-changing action must be server-validated and transactional.
- Notifications are supplementary: notification failure must never prevent or roll back a successfully saved order.

## Existing backend capabilities confirmed during audit
- `orders`, `order_items`, `products`, `customers`, `payments`, `inventory`, `inventory_movements`, `expenses`, `business_investments`, `activity_logs`, and `profiles` tables exist.
- `create_pos_sale` creates an in-store order, order items, payment record when applicable, inventory movements, tracking event, and activity log.
- `record_order_payment` records verified payments and updates paid/due balances.
- `adjust_inventory_stock` records stock adjustments and activity logs.
- Existing Admin app uses Supabase Auth and checks profile roles `admin` and `staff`.
- Existing Admin POS has receipt display with browser Print / Save PDF.
- The current source audit did not find a PWA manifest/service worker in the Admin app source.

## Important backend gaps to resolve before enabling write operations
1. Replace broad `admin/staff` access with explicit permission checks for owner, manager, order operations, inventory, finance, and marketing. Enforce in RLS/RPCs.
2. Inspect all current policies and function grants before changing them; preserve current Admin behavior while introducing the new permission model.
3. Add safe idempotency protection for POS submission to prevent duplicate sales after double taps, network retries, or repeated requests.
4. Decide and implement walk-in customer handling: current POS RPC requires a valid Bangladesh mobile number and customer name. Any optional-customer flow must be supported server-side.
5. Verify receipt number uniqueness, receipt data integrity, payment totals, stock concurrency, and rollback behavior.
6. Verify notification delivery/retry logging separately from order persistence.
7. Test migrations on a disposable test environment or isolated schema before production rollout. No production migrations are authorized by this plan.

## App modules
### Phase 1 — Owner operations MVP
- Secure sign-in and session handling.
- Overview: today's orders, sales, pending orders, low-stock count, recent activity.
- Online orders: list, details, customer contact, status updates, payment status, courier/tracking details.
- Products: create/edit, pricing, SKU, images, publish/unpublish, archive; no permanent delete.
- POS: search/select products, quantities, customer details, payment method, partial payment, confirm sale.
- Receipts: receipt history, A4 invoice, 58mm/80mm print layouts, PDF/share; printer compatibility tested on target Android devices.
- Push notifications for new online orders, with in-app notification history and delivery status.

### Phase 2 — Inventory, finance, customer operations
- Stock movement history, low-stock thresholds, purchase/stock intake.
- Expenses, investments, revenue and profit reports.
- Customer profiles, order history, notes and repeat-customer indicators.

### Phase 3 — Growth and team operations
- Collections, homepage merchandising, coupon/campaign controls.
- Staff accounts, role/permission administration, audit log and login activity.
- Advanced analytics and notification health monitoring.

## Proposed permission model
- Owner: full access, including user and permission management.
- Manager: operational access granted by owner; no permission administration by default.
- Order staff: orders, customer details needed for fulfilment, and permitted status updates.
- Inventory staff: product availability and stock movements only.
- Finance staff: payment records, expenses, investments, and financial reports as explicitly granted.
- Marketing staff: product merchandising, collections, coupons and campaign analytics as explicitly granted.

Start with owner-only access in the UI, but design the authorization model to support these future roles. Do not create staff accounts or grant permissions without owner action.

## Acceptance criteria
- App is installable on supported Android browsers and remains usable on mobile screen sizes.
- No storefront or existing Admin Panel regression.
- Unauthorized users cannot read or mutate restricted data by calling Supabase APIs directly.
- Duplicate taps/retries cannot create duplicate POS sales.
- Stock and payment records remain consistent after concurrent actions and failed requests.
- Receipt totals reconcile exactly to order items and verified payments.
- Notification outages do not lose orders.
- Every write action has an auditable actor and timestamp.
- Build and automated checks pass before a pull request is opened; production deployment requires separate explicit approval.

## Immediate next implementation tasks
1. Scaffold the PWA in an isolated `owner-app/` directory with its own build configuration and no changes to current Admin or storefront entry points.
2. Implement a read-only owner dashboard using existing data and authenticated access.
3. Add the app manifest, service worker, install UX, and mobile navigation.
4. Review and test existing RLS policies before adding any write-capable screens.
5. Add write workflows only after the backend security and idempotency gaps above are resolved.
