# ZARIAH Studio — Runtime Performance Pass

## Scope
A narrowly scoped runtime pass on top of the previous mobile asset/CSS optimization. No storefront redesign, layout changes, product ordering changes, pricing changes, cart/checkout behavior changes, or desktop layout changes are intended.

## Changes
1. Homepage hero carousel autoplay now runs only while the carousel is in or near the viewport, the tab is visible, the pointer is not hovering, and the device has not requested reduced motion.
2. Testimonial carousel autoplay now pauses while off-screen, while the document is hidden, during hover/focus interaction, and when reduced motion is enabled.
3. Both carousels resume only when their run conditions are satisfied, preventing background timers from continuously updating DOM/classes while the user is elsewhere on the page.
4. Added a `prefers-reduced-motion` stylesheet override on the homepage for visitors who request reduced motion at OS/browser level.

## Verification
- Inline JavaScript syntax validation across all HTML pages.
- HTML parse and local asset-reference checks.
- ZIP integrity validation.
- No browser/device runtime, Lighthouse, FPS, or Core Web Vitals measurements are claimed; connected browser runtime was unavailable in this environment.

## Deployment note
Preview this package on the actual Android device before replacing the live deployment. Compare homepage scrolling, hero carousel, testimonial carousel, product modal, collection filtering, cart and checkout.
