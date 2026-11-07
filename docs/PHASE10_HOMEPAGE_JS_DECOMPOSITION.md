# ZARIAH Studio — Phase 10 Homepage JavaScript Decomposition

**Source:** Phase 9 frontend audit ZIP
**Scope:** Homepage's largest inline classic JavaScript block only

## Changes

- Extracted the embedded fallback catalogue (`FALLBACK_PRODUCTS` and initial `PRODUCTS`) into `assets/js/homepage-product-data.js`.
- Extracted the remaining homepage application logic into `assets/js/homepage-app.js`.
- Replaced the original inline block at the same DOM position with two ordinary, parser-blocking classic script tags in the same order.
- Preserved the original script body content byte-for-byte at the text level; no functions, feature logic, selectors, storage keys, tracking calls, CSS, or layout were rewritten.

## Why this split is conservative

The product data is a self-contained first section. It is loaded before the application code, and classic-script global lexical bindings remain available to later classic scripts. Neither script uses `async` or `defer`, so execution remains sequential at the original point in the document. The app script still executes after the homepage DOM has been parsed, as before.

## Validation

- 36 HTML pages inspected.
- 110 remaining inline executable JavaScript blocks passed `node --check`.
- 8 external JavaScript files passed `node --check`.
- Extracted source equivalence check passed: concatenated data + app source exactly matches the original large inline block.
- Sequential classic-script lexical binding smoke test passed; all 18 fallback products remain accessible to the following script.
- Script order and local asset existence checks passed.
- ZIP integrity passed.

## Limitations

This is a source-level decomposition and caching/maintainability improvement. It does **not** reduce the amount of JavaScript that must execute, and no LCP, INP, FPS, Lighthouse, or real-device speed improvement is claimed. A live browser regression test is still required for product rendering, filters, modal, cart, carousel, analytics, and checkout flows.
