# Phase 15 — Loyalty & Membership

## Membership tiers
- Bronze: ৳0–৳9,999 cumulative verified payments
- Silver: ৳10,000–৳24,999
- Gold: ৳25,000–৳49,999
- Platinum: ৳50,000+

Tier qualification uses net verified payment value. Refunded or rejected verified payments reverse their qualifying spend and tier progress.

## Points earning
- 1 point for each complete ৳100 in an individual verified payment.
- Points are credited only when a payment row becomes `verified`.
- Pending, unpaid, cancelled orders do not generate points.
- A verified payment later marked `refunded` or `rejected` reverses the points and qualifying spend associated with that payment.
- A refunded payment later re-verified restores its original earning once; duplicate points are prevented by the payment-linked loyalty ledger.

## Admin UI
- New `Loyalty & Rewards` navigation section.
- Tier distribution, total points outstanding and total qualifying spend.
- Search, tier filter and sorting by points, spend or tier.
- Customer profile includes current tier, points balance, lifetime points and qualifying spend.

## Deliberately not enabled
- Points redemption, cash value, tier discounts or coupons are not enabled. No reward liability or discount promise should be created until ZARIAH approves the commercial rules.

## Database
Apply `supabase/migrations/202611080001_customer_loyalty_membership.sql` after the Phase 13 payment migration. Existing verified payments are backfilled into the loyalty ledger and accounts.

## Validation boundary
Static source checks only. No live Supabase migration, trigger, RLS or production browser tests were run.
