# Phase 7 — Third-Party Script Optimization

## Scope

Applied only to the homepage (`index.html`) and All Bags page (`collections/all-bags/index.html`), the two HTML pages in this source package that contained the GA4, Meta Pixel, and Microsoft Clarity bootstrap code.

## Changes

- Added `zariah-analytics-loader.js` as a small same-origin bootstrap.
- GA4 (`G-VWTCQTCSN1`), Meta Pixel (`1765030204483711`), and Microsoft Clarity (`wznd21x0gs`) APIs are initialized with their queue stubs immediately.
- Existing GA4 `js` and `config` calls and Meta Pixel `init` / `PageView` calls are queued before third-party libraries load.
- Third-party scripts are injected asynchronously after a 1.5-second initial-render head start and an idle callback (with a bounded timeout where supported).
- Existing homepage ecommerce/WhatsApp tracking calls can continue to use `gtag` and `fbq`; calls made before the external libraries arrive are queued.
- Existing Meta Pixel `noscript` PageView fallback is retained.
- No analytics IDs, page routes, product logic, order flow, layout, CSS, or visual styling were changed.

## Validation

- All 36 HTML documents parsed successfully.
- All inline JavaScript blocks passed `node --check`.
- Analytics loader passed `node --check`.
- Confirmed both tracker-bearing pages load the local bootstrap once and no longer directly include the three third-party script URLs.
- Confirmed all three existing analytics identifiers and queued PageView initialization remain present.
- ZIP integrity checked after packaging.

## Limitations

This is source-level validation only. The package has not been deployed, and no browser/device test, analytics-provider event verification, Lighthouse run, or Core Web Vitals measurement was available in this environment. Deferring trackers can shift their request timing; verify GA4 Realtime, Meta Events Manager, and Clarity recordings after deployment before treating analytics continuity as production-confirmed.
