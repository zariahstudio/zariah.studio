# ZARIAH Studio — Phase 9 Frontend Performance Audit

**Audit type:** Static source audit of the Phase 8 ZIP  
**Audit date:** 8 November 2026  
**Scope:** HTML, inline JavaScript, external JavaScript, CSS, and image inventory  
**Not included:** Live deployment, browser interaction, Supabase requests, real-device profiling, Lighthouse, or Core Web Vitals measurement

## Executive summary

The project is structurally valid at the source level, but the largest remaining frontend execution hotspot is the homepage's large inline JavaScript block. The best next step is a controlled refactor of homepage JavaScript and repeated shared snippets—not broad rewrites or visual redesign.

No application source files were changed during this audit.

## Validation results

| Check | Result |
|---|---:|
| HTML pages inspected | 36 |
| Inline executable JavaScript blocks syntax-checked | 111 |
| External JavaScript files syntax-checked | 6 |
| JavaScript syntax errors | 0 |
| Structured-data JSON-LD blocks (excluded from JS syntax check) | 5 |
| ZIP integrity | Passed |
| Product detail pages | 18 |
| Raster image assets inventoried | 53 |

## Findings

### 1. Homepage JavaScript is the primary optimization target — High priority

- Homepage contains approximately **110.7 KB of executable inline JavaScript**.
- The largest single inline script is approximately **107.5 KB**.
- The homepage registers approximately **110 event listeners** across its inline scripts.
- There are two scroll listeners. Both use `requestAnimationFrame`-based throttling, which is preferable to doing full work on every raw scroll event. One listener should still be reviewed for passive-listener behavior and overlap with the sticky-header handler.
- The homepage has two interval-based carousel/autoplay routines. Their visibility, hover/focus, and reduced-motion handling should be preserved during any refactor.

**Assessment:** The event-listener count alone does not prove a performance defect. The large monolithic script is the more concrete maintainability and execution-audit concern. Splitting it into focused modules can improve caching and make later profiling safer, but should be done only after mapping initialization order and shared globals.

### 2. Repeated inline snippets across pages — Medium priority

- Several small inline scripts are duplicated across many HTML pages.
- A repeated 268-byte snippet appears across all 36 HTML pages.
- A repeated 232-byte snippet appears across 33 pages.
- Product pages share repeated snippets; one repeated 907-byte block appears on 16 product pages, and another 144-byte block appears on 18 product pages.

**Assessment:** These are candidates for shared external scripts. Any extraction must preserve relative-path behavior, execution order, DOM-ready assumptions, and product-specific configuration. Avoid a blind global replacement.

### 3. Collection and product interaction paths — Medium priority

The All Bags page has approximately 12.8 KB of inline executable JavaScript. Product detail pages are comparatively small and share common code. These pages should be tested for:
- Filter and sort behavior after catalogue hydration.
- Add-to-bag and cart-count updates.
- Recently viewed state.
- Modal open/close and browser back behavior.
- Keyboard and touch interactions.

Static inspection cannot establish whether these interactions are smooth or correct at runtime.

### 4. Image payload inventory — Follow-up opportunity

- 53 raster image assets were found, totaling approximately **7.83 MB** in the extracted project.
- Several assets are around 200–258 KB.
- The largest assets include product detail/lifestyle images and hero/editorial images.

**Assessment:** These sizes are not automatically excessive; dimensions, compression quality, delivery context, and actual above-the-fold use matter. Do not recompress or resize blindly. A later pass should check each image's rendered dimensions, intrinsic dimensions, and whether it is loaded eagerly or lazily.

### 5. CSS delivery

The project contains two CSS files totaling approximately 168 KB. The homepage stylesheet extraction from the previous phase is present. The audit did not detect a need for a visual CSS rewrite.

## Recommended action plan

1. **Phase 10 — Homepage JavaScript decomposition:** Map the 107.5 KB script into feature sections, extract only self-contained sections, preserve initialization order and all public globals, then run syntax and feature smoke tests.
2. **Phase 11 — Shared script deduplication:** Extract repeated snippets into shared assets with explicit defer/order strategy; verify every relative path and page type.
3. **Phase 12 — Interaction regression pass:** Test cart, filtering, product modal, recently viewed, checkout handoff, tracking events, and carousel behavior in a real browser.
4. **Phase 13 — Runtime measurement:** Run Lighthouse and real-device profiling; capture LCP, CLS, INP, long tasks, and interaction traces before claiming performance gains.

## Guardrails

- No redesign or desktop layout changes.
- Do not remove or rename existing features, tracking IDs, data attributes, global functions, or storage keys.
- Preserve Supabase lazy loading and secure checkout RPC behavior.
- Preserve the current warm taupe/greige, cream, and champagne-gold visual direction.
- Make small, reversible changes and validate after each extraction.

## Limitations

This is a static audit. Browser runtime was not measured in this phase. No claims are made about actual FPS, LCP, CLS, INP, or perceived speed improvement. A real browser and device test is required before attributing measured gains to these changes.
