# Checkout and order-tracking security gateway

## Scope
- Adds one public Edge Function gateway for guest checkout and order lookup.
- Moves privileged RPC calls to a server-side Supabase client.
- Adds fixed-window, atomic database rate limits. Only SHA-256 identifiers are stored; raw phone numbers and IP addresses are not persisted in the rate-limit table.
- Keeps public catalogue and SEO RPCs unchanged.

## Deployment prerequisites
1. Confirm the Edge Function runtime has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. Add `SUPABASE_PUBLISHABLE_KEY` as an Edge Function secret, matching the publishable key used by `storefront-config.js`. If this project still uses the legacy anon key, set `SUPABASE_ANON_KEY` instead.
3. Deploy `zariah-public-orders` with JWT verification disabled because the storefront sends a publishable key, not a user JWT. The function independently checks the exact `apikey` header against the configured key. Do not send the publishable key as a bearer credential.
4. Apply the SQL migration.
5. Deploy the frontend pages in this PR.
6. Test successful checkout, idempotent retry, stock rejection, invalid phone, tracking match/mismatch, rate-limit responses, and both canonical domains.
7. Only after those checks, revoke direct `anon` and `authenticated` execution on `create_website_order` and `lookup_order_tracking`. This final grant change is intentionally NOT included or applied by this PR because doing it before the cutover would break live checkout/tracking.

## Rate limits
- Checkout: 10 requests / IP / 10 minutes; 5 / normalized phone / hour.
- Tracking: 12 requests / IP / 15 minutes; 6 / order-number + phone pair / 15 minutes.
- Responses do not reveal whether an order exists when the pair does not match.
- The edge gateway is not deployed by this PR. Configure secrets and deploy only after reviewing this change.

## Important operational note
The current Supabase Edge Function deployment and database are production resources. This PR changes GitHub source only; it does not deploy the function, apply SQL, or alter production grants.
