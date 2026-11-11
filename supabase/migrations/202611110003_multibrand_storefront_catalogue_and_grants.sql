-- Publish only safe brand metadata to the storefront and include brand identity in the catalogue RPC.
-- Supplier records, source costs and authenticity evidence remain staff-only.
begin;

grant select on public.brands to anon, authenticated;
grant select, insert, update, delete on public.brands to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, update, delete on public.product_sources to authenticated;
grant select, insert, update, delete on public.authenticity_evidence to authenticated;

drop function if exists public.get_storefront_catalogue();
create function public.get_storefront_catalogue()
returns table (
  sku text, slug text, name text, brand text, brand_id uuid,
  authenticity_status text, collection_name text, product_type text,
  color text, description text, size_text text, price_bdt integer,
  compare_at_price_bdt integer, badge text, badge_style text,
  is_featured boolean, is_bestseller boolean, display_order integer,
  stock_counted boolean, is_sold_out boolean, availability_mode text,
  images jsonb
)
language sql stable security definer set search_path = ''
as $$
  select
    p.sku, p.slug, p.name, coalesce(b.name, p.brand) as brand, p.brand_id,
    p.authenticity_status, c.name as collection_name, p.product_type,
    p.color, p.description, coalesce(p.specifications ->> 'size', '') as size_text,
    p.price_bdt, p.compare_at_price_bdt, p.badge, p.badge_style,
    p.is_featured, p.is_bestseller, p.display_order,
    coalesce(i.stock_counted, false) as stock_counted,
    coalesce(i.stock_counted and i.on_hand <= i.reserved, false) as is_sold_out,
    p.availability_mode,
    coalesce((
      select jsonb_agg(jsonb_build_object('url', pi.public_url, 'role', pi.image_role, 'display_order', pi.display_order)
        order by pi.display_order, pi.created_at)
      from public.product_images pi where pi.product_id = p.id
    ), '[]'::jsonb) as images
  from public.products p
  join public.collections c on c.id = p.collection_id
  left join public.brands b on b.id = p.brand_id and b.is_active = true
  left join public.inventory i on i.product_id = p.id
  where p.is_published = true and c.is_active = true
  order by p.display_order, p.created_at;
$$;
revoke all on function public.get_storefront_catalogue() from public;
grant execute on function public.get_storefront_catalogue() to anon, authenticated;
commit;
