# Phase 6 — Image Delivery & Core Web Vitals (source-level)

## Changes
- Added `fetchpriority="high"` to both viewport-specific hero image preloads (desktop and mobile).
- Added intrinsic `width="1672"` and `height="941"` to the first hero `<img>`. The hero image is absolutely positioned and sized by the existing CSS container, so these attributes provide intrinsic dimensions without changing the established hero layout.
- Added `loading="lazy"` and retained `decoding="async"` for the three non-initial collection slides. The first hero slide remains eager/high priority.
- Preserved the existing `<picture>` mobile source, hero image URLs, CSS, typography, desktop layout, and visual design.

## Asset findings
- Desktop hero: `1672 × 941`, JPEG.
- Mobile hero: `1003 × 1568`, WebP.
- Existing mobile/desktop `<picture>` source selection and media-specific preload were already present.
- No verified alternate responsive image-size variants were found for hero/product images in this package. No synthetic `srcset` candidates were added.
- Google Fonts already use `display=swap` and both Google Fonts origins already have preconnect hints; no speculative font preload was added.

## Validation
- HTML parsing and targeted markup checks passed.
- All 117 inline JavaScript blocks passed `node --check`.
- CSS file retained unchanged from Phase 5.
- ZIP integrity check passed.

## Limitations
This is source-level optimization only. No live browser session, Lighthouse run, field Core Web Vitals, LCP/CLS/INP measurement, or real-device test was available. Therefore no measured performance score or guaranteed improvement is claimed. The existing image files and design were not visually altered.
