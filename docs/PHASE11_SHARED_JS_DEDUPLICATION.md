# Phase 11 — Shared JavaScript Deduplication

## Scope

This phase externalizes only byte-identical JavaScript snippets repeated across product detail pages. It does not rewrite cart logic, product data, page layout, CSS, checkout, analytics, or Supabase behavior.

## Changes

- Added `assets/js/zariah-product-gallery.js` and replaced the identical 144-byte inline thumbnail-gallery handler on 18 product pages.
- Added `assets/js/zariah-product-add-to-bag.js` and replaced the identical 905-byte inline add-to-bag handler on 16 product pages.
- Both shared files are loaded with `defer` at the original script locations near the end of the document. They execute after HTML parsing and before `DOMContentLoaded`; no dependency on `window.ZariahCart` is introduced.
- Product pages without an Add to Bag button receive only the gallery asset.
- Existing inline cart-count initialization blocks were intentionally retained. Although similar, they occur in different page contexts and currently provide immediate count rendering; removing them would alter initialization timing and needs separate runtime validation.

## Source-level impact

- 18 duplicated gallery handlers (2,592 bytes of repeated inline source) moved to one shared asset.
- 16 duplicated Add to Bag handlers (14,480 bytes of repeated inline source) moved to one shared asset.
- Total repeated inline JavaScript moved: 17,072 bytes before replacement-tag overhead.
- Shared assets: 2 small JS files, cacheable across product-page navigation.

This is an HTML/source-size reduction, not a measured improvement in LCP, INP, or device FPS. The first visit may incur two additional shared-asset requests; browser caching benefits subsequent product-page visits.

## Validation

- 18 product pages contain the gallery asset reference.
- 16 product pages contain the Add to Bag asset reference.
- Original inline copies are absent from those pages.
- JavaScript syntax and ZIP integrity checks are performed during packaging.
- No live browser, Supabase, analytics dashboard, or physical-device test was performed.
