# ZARIAH Studio — Mobile Performance Pass

## Scope
Performance-focused changes only. Existing page structure, desktop layout, colors, typography, product ordering, cart behavior, checkout behavior, WhatsApp actions, and mobile navigation have not been redesigned.

## Changes
1. Re-encoded 37 large first-party WebP assets at quality 84 while preserving their pixel dimensions and alpha channel where present.
3. Added `decoding="async"` to non-hero images across HTML pages. The preloaded mobile and desktop hero images were intentionally excluded from this hint.
4. Removed expensive backdrop blur from the mobile fixed header and full-screen modal backdrops. The same opaque/translucent colors remain in place, so the layout and general visual treatment are retained.
5. Removed persistent `will-change` layer promotion from product-card image layers. The browser can still composite them during actual transitions, but it no longer has to reserve layers for every card continuously.
6. The sticky desktop filter scroll listener is now registered only when the page initially loads at desktop width; mobile scrolling no longer invokes a listener for a desktop-only feature.

## Measured asset impact
- Optimized image files: 38 WebP assets.
- Total measured reduction from changed assets: approximately 7.10 MB (57.2%) across the optimized source assets.
- Original dimensions were retained for all re-encoded WebP files.

## Verification
- HTML script syntax checks and asset integrity checks are required before deployment.
- A local headless-browser performance run was attempted but the environment blocked navigation to the local test server (`ERR_BLOCKED_BY_ADMINISTRATOR`). Therefore no Lighthouse score, real-device FPS, Core Web Vitals, or runtime visual-regression claim is made.
- The changes are packaged for preview and should be tested on the actual Android device and live hosting environment before production deployment.
