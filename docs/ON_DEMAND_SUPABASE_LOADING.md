# ZARIAH Studio — On-Demand Supabase Loading
Date: 7 November 2026

## Goal
Reduce parser-blocking third-party JavaScript work without changing the storefront design or user flows.

## Changes
- Added `zariah-supabase-loader.js`, a small first-party loader that injects the Supabase SDK asynchronously on demand.
- Homepage: starts the SDK request asynchronously and loads the published catalogue after the SDK is ready; embedded catalogue remains the fallback.
- All Bags: renders its fallback catalogue immediately, then requests the SDK asynchronously and refreshes with the published catalogue when available.
- Track Order: loads the SDK only after the customer submits the tracking form.
- Checkout: loads the SDK only after the customer submits a valid checkout form; existing secure order RPC and failure handling remain in place.
- Replaced parser-blocking Supabase CDN script tags on the four pages with the first-party loader.

## Validation
- 117 inline JavaScript blocks checked with `node --check`: passed.
- `zariah-supabase-loader.js` syntax: passed.
- Loader smoke test: concurrent requests share one SDK load; passed.
- ZIP integrity: pending packaging verification.
- Browser runtime, live Supabase, mobile network waterfall, Lighthouse and Core Web Vitals: not tested in this environment.

## Notes
- No CSS, visual layout, product data, cart logic, order RPC, or WhatsApp behavior was intentionally changed.
- The loader still uses the existing Supabase CDN URL/version range to preserve current integration compatibility.
- This is not deployed. Test homepage catalogue refresh, All Bags refresh, order tracking submit, and checkout submit in a browser before production deployment.
