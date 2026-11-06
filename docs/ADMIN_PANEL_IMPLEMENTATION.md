# ZARIAH Studio Admin Panel — Implementation Blueprint

Status: planning/foundation only. This branch is isolated from `main`.
Production safety: do not merge or deploy until the implementation is completed, tested, and explicitly approved.

## Confirmed repository baseline

- Repository: `zariahstudio/zariah.studio`
- Default branch: `main`
- Current website: static single-page `index.html` with image assets under `images/`
- Product catalogue is embedded in a JavaScript `PRODUCTS` array (18 initial products).
- Product card rendering, collection/type filters, sorting, product detail/gallery behavior and image paths are implemented in the existing page.
- Existing WhatsApp order actions and Google Forms silent submission are present.
- Existing analytics/marketing tags are present; preserve them.
- Existing static deployment workflow is present under `.github/workflows/`.

## Non-negotiable constraints

1. Never rewrite or redesign the existing landing page.
2. Preserve desktop and mobile layout, typography, colors, product cards, product modal/gallery, filters, sort, collection sections, WhatsApp links, Google Forms until a tested replacement is approved, SEO metadata, GA4, Meta Pixel and Clarity.
3. Do not make changes on `main` during development.
4. Work only on a development branch and use pull requests.
5. Do not place Supabase service-role keys or other secrets in browser code or Git.
6. Require Supabase Row Level Security (RLS) for all exposed tables and private admin actions.
7. No production deployment, domain rewiring, or live database migration without explicit owner approval.
8. Keep a documented rollback path to the existing static site.

## Target architecture

- Existing storefront: retain static HTML/CSS/JS design.
- Admin app: separate React + Vite application, mounted at `/admin/` or deployed as a separate Netlify site/subdomain after reviewing the current Netlify configuration.
- Backend: Supabase PostgreSQL, Auth, Storage and Edge Functions.
- Storefront integration: a small isolated JavaScript data adapter fetches published product data from Supabase and maps it to the existing `PRODUCTS` view model. If configuration/network/database is unavailable, keep a safe fallback to the current embedded 18-product catalogue until migration is validated.
- Admin writes: authenticated Supabase user with explicit admin role; never trust client-side role checks alone.

## Database model (initial)

- `profiles`: user id, display name, role (admin/staff); role changes restricted to privileged server-side process.
- `collections`: id, slug, name, description, cover image, display order, active.
- `products`: id, sku (unique), slug (unique), name, collection_id, type, color, description, size/specification, price_bdt (integer), compare_at_price_bdt (nullable integer), badge, badge_style, featured, published, sort_order, created_at, updated_at.
- `product_images`: id, product_id, storage_path, public_url, alt_text, image_role (front/side/detail/inside/back/lifestyle/gallery), sort_order.
- `inventory`: product_id, on_hand, reserved, low_stock_threshold, updated_at.
- `inventory_movements`: id, product_id, quantity_delta, reason, reference, actor_id, created_at.
- `customers`: id, full_name, phone, email (optional), address, district, created_at.
- `orders`: id, order_number, source (website/whatsapp/manual), customer_id, status, subtotal_bdt, discount_bdt, delivery_fee_bdt, total_bdt, payment_status, payment_method, payment_reference, notes, created_at, updated_at.
- `order_items`: id, order_id, product_id (nullable for historical preservation), sku_snapshot, name_snapshot, unit_price_bdt, quantity, line_total_bdt.
- `memberships`: id, customer_id, membership_number, registered_at, status; lifetime 10% eligibility on regular-price items only.
- `payments`: id, order_id, method (cash_on_delivery/bkash/nagad/bank_transfer/other), amount_bdt, status (pending/verified/rejected/refunded), reference, verified_by, verified_at.
- `activity_logs`: id, actor_id, action, entity_type, entity_id, metadata, created_at.

Use integer BDT minor units (whole taka) for amounts, validate non-negative values, preserve order item snapshots, and use database transactions/RPC or Edge Functions for atomic order + stock operations. Define FK delete behavior deliberately; archive products rather than deleting records referenced by orders.

## Product management requirements

- Add/edit/archive/duplicate products without source-code changes.
- Create, edit and reorder collections without source-code changes.
- Unique SKU with optional automated SKU suggestion (never silently overwrite an existing SKU).
- Upload multiple images to Supabase Storage; support front, side, detail, inside, back and lifestyle roles.
- Draft/publish, featured/bestseller, display order, stock status and low-stock alerts.
- Bulk CSV import/export with validation and preview.
- Storefront renders products from database in existing card/modal components.
- Product count is not hardcoded; pagination or incremental loading should support a growing catalogue.
- Validate supported file types, file size and image dimensions; generate optimized derivatives where suitable.
- Deletion should default to archive to preserve order history.

## Orders and manual payment requirements

- Both website and WhatsApp orders.
- Website creates order through a validated server-side Edge Function; only report success after database confirms creation.
- WhatsApp orders can be added manually by staff/admin; WhatsApp conversation is not automatically ingested in the first release.
- Store immutable product/price snapshots at time of order.
- Statuses: new, confirmed, processing, shipped, delivered, cancelled, returned.
- Payment statuses: unpaid, partially_paid, paid, refunded.
- Methods: cash on delivery, bKash, Nagad, bank transfer and other manual methods.
- Record payment attempts and verification actor/time; do not collect card details.
- Prevent overselling with transactional stock reservation and explicit reservation expiry/release policy.
- Use idempotency keys for website order submission to reduce duplicate orders.

## Membership rules

- Registration can happen at any time.
- Lifetime 10% membership discount.
- Discount applies only to regular-priced products.
- Do not stack the membership discount with an already discounted/promotional price.
- Store eligibility and discount calculation on the server; frontend must not be authoritative.
- Keep membership registration fields and consent/privacy text explicit.

## Admin app modules

1. Dashboard: orders, sales, revenue, low stock, top products.
2. Products: catalogue, editor, image manager, collection management, bulk import/export.
3. Inventory: stock adjustments, movement ledger, alerts.
4. Orders: website/WhatsApp/manual sources, status history, payment verification.
5. Customers and membership: profiles, membership registration/status/history.
6. Reports: date range, sales, collection, SKU, payment method, export.
7. Settings: delivery fee defaults, contact details, admin/staff access.

## Netlify and GitHub deployment plan

- First inspect current Netlify build/publish settings and existing workflow before changing deployment files.
- Do not assume the correct route is `/admin/`; verify Netlify publish directory and redirects first.
- Keep static storefront deploy behavior unchanged.
- Prefer separate admin build output and explicit route handling; avoid catch-all SPA redirects that could hijack existing storefront URLs.
- Use Netlify environment variables for public Supabase URL and anon key. Anon key is designed for client use only when RLS is correctly configured. Never set service-role key in client-side environment.
- Preview deploys on the feature branch only after Netlify configuration is reviewed.
- Production deployment requires owner approval and passing checks.

## Migration plan

1. Export current `PRODUCTS` array into a migration dataset; preserve existing SKU IDs and labels.
2. Map each product's image assets. Do not assume all products have the same image set; some folders may only have a front image.
3. Import and compare all 18 products against the source array.
4. Verify every image path resolves; upload original assets to Storage without deleting existing `images/products/` folders.
5. Test the storefront data adapter against staging data while keeping fallback catalogue available.
6. Compare card content/order, filters, sorting, sold-out/badges, modals, image gallery and WhatsApp order payloads.
7. Run desktop/mobile regression checks, accessibility checks and performance checks.
8. Test admin security with anonymous, authenticated non-admin and admin accounts.
9. Test order idempotency, inventory concurrency, payment verification and membership discount edge cases.
10. Obtain explicit approval before merge or production rollout.

## Acceptance criteria

- All 18 current products render equivalently to the existing page.
- Admin can create a product and publish it; it appears on the storefront without a code change or redeploy.
- Admin can update price/images/stock and changes appear without a redeploy.
- New collections can be created from Admin and reflected on storefront without code changes.
- Product cards, layout, mobile and desktop design remain visually unchanged.
- Existing Google Forms and WhatsApp flows remain available until their replacements are verified.
- Unauthorized users cannot read private admin data or write protected records.
- Payment and membership calculations are server-authoritative.
- No secrets are committed.
- Production rollback is documented and tested.

## Current execution status

- [x] Repository access confirmed with push/admin permission.
- [x] Isolated branch created: `feat/admin-panel-foundation`.
- [ ] Netlify configuration and workflow audit.
- [ ] Supabase project created by owner.
- [ ] Database migrations and RLS.
- [ ] Admin app.
- [ ] Product migration and dynamic storefront adapter.
- [ ] Orders, stock, payments and membership.
- [ ] Automated and manual regression tests.
- [ ] Pull request review and explicit production approval.
