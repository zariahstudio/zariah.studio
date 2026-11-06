-- ZARIAH Studio initial catalogue seed
-- Imports the 18 products from the existing static storefront into Singapore Supabase.
-- Existing product images remain in the current website assets for now; no image files are moved here.
-- Run only after 202611060001_initial_schema.sql has succeeded.

begin;

insert into public.collections (slug, name, description, display_order, is_active)
values
  ('essence', 'Essence', 'Everyday pieces with understated elegance.', 1, true),
  ('signature', 'Signature', 'Refined silhouettes for elevated everyday style.', 2, true),
  ('noir', 'Noir', 'Statement designs with a distinctive edge.', 3, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = true;

with source_products (
  sku, name, collection_slug, product_type, color, description, size_text,
  price_bdt, badge, badge_style, is_bestseller, is_featured, is_published, display_order
) as (
  values
  ('Essence01','Crescent Shoulder Bag','essence','Shoulder Bag','Camel / Black / Dusty Rose','Modern everyday luxury with a soft curved silhouette. Perfect for office mornings and weekend outings.','Small–Medium · L 26cm × H 15cm × D 6cm',3800,'Bestseller','badge-b',true,false,true,1),
  ('Essence02','Slim Flap Crossbody','essence','Crossbody','Camel / Black / Olive','Minimal and feminine crossbody for daily essentials. Adjustable strap, elegant closure.','Small · L 20cm × H 13cm × D 5cm',2900,'New','badge-n',false,false,true,2),
  ('Essence03','Structured Mini Tote','essence','Tote','Camel / Black','Elegant mini tote that keeps you organized in style. Interior zip pocket and card slots.','Medium · L 24cm × H 20cm × D 10cm',3400,'Editor''s Pick','badge-e',false,false,true,3),
  ('Essence04','East-West Bag','essence','East-West','Camel / Black / Tan','Minimal east-west design for a chic, modern look. Long strap converts to hand carry.','Small–Medium · L 28cm × H 13cm × D 6cm',3200,null,null,false,false,true,4),
  ('Essence05','Rounded Top Handle','essence','Top Handle','Dusty Rose / Camel / Black','Softly structured top handle for feminine sophistication. Bamboo-style handle detail.','Small–Medium · L 22cm × H 17cm × D 9cm',3600,'New','badge-n',false,false,true,5),
  ('Essence06','Soft Bucket Bag','essence','Bucket Bag','Camel / Olive / Black','Relaxed bucket bag that blends comfort with elegance. Drawstring closure, inner pocket.','Medium · L 22cm × H 24cm × D 12cm',3500,null,null,false,false,true,6),
  ('Signature01','Structured Top Handle','signature','Top Handle','Black / Cognac / Forest Green','Iconic structured silhouette that defines our signature identity. Heavy-gauge hardware, clean lines.','Medium · L 26cm × H 20cm × D 10cm',4500,'Bestseller','badge-b',true,false,true,7),
  ('Signature02','Elegant Satchel','signature','Satchel','Black / Cognac / Burgundy','Timeless satchel for work, meetings and everything in between. Top zip, front pocket.','Medium · L 28cm × H 21cm × D 11cm',4800,null,null,false,false,true,8),
  ('Signature03','Premium Flap Bag','signature','Flap Bag','Black / Cognac / Ivory','Classic flap bag that elevates every occasion. Magnetic clasp, chain and leather strap.','Small–Medium · L 22cm × H 15cm × D 7cm',3900,'Editor''s Pick','badge-e',false,false,true,9),
  ('Signature04','Boxy Shoulder Bag','signature','Shoulder Bag','Black / Forest Green / Cognac','Modern boxy shape for a refined and powerful presence. Wide strap, subtle logo detail.','Medium · L 25cm × H 17cm × D 8cm',4200,'Limited','badge-l',false,false,true,10),
  ('Signature05','Structured Crossbody','signature','Crossbody','Black / Cognac / Dusty Mauve','Smart, practical and elegant crossbody for everyday confidence. Adjustable chain strap.','Small–Medium · L 21cm × H 14cm × D 6cm',3600,null,null,false,false,true,11),
  ('Signature06','Top-Zip Bowling Bag','signature','Bowling Bag','Black / Cognac / Burgundy','Soft curves with a top zip for sophisticated everyday luxury. Dual handles + long strap.','Medium · L 28cm × H 18cm × D 12cm',4600,'New','badge-n',false,false,true,12),
  ('Noir01','Statement Shoulder Bag','noir','Shoulder Bag','Noir Black / Deep Plum','Bold shoulder bag that commands attention. Rich texture, oversized gold hardware.','Small–Medium · L 26cm × H 16cm × D 6cm',4000,'Bestseller','badge-b',true,false,true,13),
  ('Noir02','Sculptural Top Handle','noir','Top Handle','Noir Black / Midnight Blue','Artful silhouette that turns every moment iconic. Sculptural handle, architectural shape.','Small · L 20cm × H 16cm × D 8cm',3800,'Editor''s Pick','badge-e',false,false,true,14),
  ('Noir03','Chain Accent Flap Bag','noir','Flap Bag','Noir Black / Deep Plum','Luxury chain detail meets timeless feminine power. Interlocking chain strap, flap closure.','Small · L 21cm × H 13cm × D 6cm',3500,'Limited','badge-l',false,false,true,15),
  ('Noir04','Sharp East-West Bag','noir','East-West','Noir Black / Midnight Navy','Sharp lines for a modern, fashion-forward edge. Minimal seaming, sleek finish.','Small–Medium · L 28cm × H 12cm × D 6cm',3600,'New','badge-n',false,false,true,16),
  ('Noir05','Structured Underarm Bag','noir','Underarm Bag','Noir Black','Sleek underarm bag for an effortlessly cool attitude. Rigid frame, push-lock closure.','Small · L 22cm × H 13cm × D 5cm',3200,null,null,false,false,true,17),
  ('Noir06','Mini Statement Tote','noir','Tote','Noir Black / Deep Wine','Mini tote with major attitude. Pure noir elegance. Statement handles, minimal detailing.','Small · L 20cm × H 18cm × D 9cm',3400,null,null,false,false,true,18)
),
collection_map as (
  select id, slug from public.collections
)
insert into public.products (
  sku, name, slug, collection_id, product_type, color, description, specifications,
  price_bdt, badge, badge_style, is_bestseller, is_featured, is_published, display_order
)
select
  s.sku, s.name, lower(s.sku), c.id, s.product_type, s.color, s.description,
  jsonb_build_object('size', s.size_text),
  s.price_bdt, s.badge, s.badge_style, s.is_bestseller, s.is_featured, s.is_published, s.display_order
from source_products s
join collection_map c on c.slug = s.collection_slug
on conflict (sku) do update set
  name = excluded.name,
  slug = excluded.slug,
  collection_id = excluded.collection_id,
  product_type = excluded.product_type,
  color = excluded.color,
  description = excluded.description,
  specifications = excluded.specifications,
  price_bdt = excluded.price_bdt,
  badge = excluded.badge,
  badge_style = excluded.badge_style,
  is_bestseller = excluded.is_bestseller,
  is_featured = excluded.is_featured,
  is_published = excluded.is_published,
  display_order = excluded.display_order;

-- Do not invent stock quantities. New inventory rows start at zero and must be counted/entered by the owner.
insert into public.inventory (product_id, on_hand, reserved, low_stock_threshold)
select id, 0, 0, 2 from public.products
on conflict (product_id) do nothing;

commit;

-- Verify the imported catalogue:
-- select c.name as collection, count(*) as product_count
-- from public.products p join public.collections c on c.id = p.collection_id
-- group by c.name order by c.name;
