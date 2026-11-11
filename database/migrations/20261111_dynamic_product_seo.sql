-- Dynamic product SEO: generated metadata, server-rendered product data, live sitemap RPCs.
-- Applied to the production Supabase project keuqvqnhxlpsglsjfopd on 2026-11-11.

create or replace function public.zariah_product_seo_autofill()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_auto_title text;
  old_auto_description text;
begin
  if tg_op = 'UPDATE' then
    old_auto_title := left(coalesce(old.name, '') || ' | ZARIAH Studio Bangladesh', 60);
    old_auto_description := left(
      'Shop ' || coalesce(old.name, 'this handbag') ||
      ' from ZARIAH Studio Bangladesh. ' ||
      coalesce(old.description, '') ||
      ' Cash on delivery available.',
      160
    );
  end if;

  if nullif(btrim(new.seo_title), '') is null
     or (tg_op = 'UPDATE' and new.seo_title is not distinct from old.seo_title and old.seo_title = old_auto_title) then
    new.seo_title := left(coalesce(nullif(btrim(new.name), ''), 'Luxury Handbag') || ' | ZARIAH Studio Bangladesh', 60);
  end if;

  if nullif(btrim(new.seo_description), '') is null
     or (tg_op = 'UPDATE' and new.seo_description is not distinct from old.seo_description and old.seo_description = old_auto_description) then
    new.seo_description := left(
      'Shop ' || coalesce(nullif(btrim(new.name), ''), 'refined handbags') ||
      ' from ZARIAH Studio Bangladesh. ' ||
      coalesce(nullif(btrim(new.description), ''), 'Discover refined handbags for everyday elegance.') ||
      ' Cash on delivery available.',
      160
    );
  end if;

  return new;
end;
$$;

drop trigger if exists zariah_products_seo_autofill on public.products;
create trigger zariah_products_seo_autofill
before insert or update of name, description, seo_title, seo_description
on public.products
for each row execute function public.zariah_product_seo_autofill();

create or replace function public.get_product_seo_page(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'sku', p.sku,
    'slug', p.slug,
    'name', p.name,
    'brand', coalesce(p.brand, 'ZARIAH Studio'),
    'collection_name', c.name,
    'product_type', p.product_type,
    'color', p.color,
    'description', p.description,
    'size_text', coalesce(p.specifications ->> 'size', ''),
    'price_bdt', p.price_bdt,
    'compare_at_price_bdt', p.compare_at_price_bdt,
    'seo_title', coalesce(nullif(p.seo_title, ''), p.name || ' | ZARIAH Studio Bangladesh'),
    'seo_description', coalesce(nullif(p.seo_description, ''), left('Shop ' || p.name || ' from ZARIAH Studio Bangladesh. ' || coalesce(p.description, '') || ' Cash on delivery available.', 160)),
    'is_featured', p.is_featured,
    'is_bestseller', p.is_bestseller,
    'availability_mode', p.availability_mode,
    'is_sold_out', coalesce(i.stock_counted and i.on_hand <= i.reserved, false),
    'images', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'url', pi.public_url,
          'alt', coalesce(nullif(pi.alt_text, ''), p.name),
          'role', pi.image_role,
          'is_primary', pi.is_primary
        )
        order by pi.is_primary desc, pi.display_order, pi.created_at
      )
      from public.product_images pi
      where pi.product_id = p.id and nullif(pi.public_url, '') is not null
    ), '[]'::jsonb)
  )
  from public.products p
  join public.collections c on c.id = p.collection_id and c.is_active = true
  left join public.inventory i on i.product_id = p.id
  where p.slug = p_slug
    and p.is_published = true
  limit 1;
$$;

create or replace function public.get_product_seo_sitemap()
returns table(slug text, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.slug, greatest(p.updated_at, p.created_at) as updated_at
  from public.products p
  join public.collections c on c.id = p.collection_id and c.is_active = true
  where p.is_published = true
    and nullif(btrim(p.slug), '') is not null
  order by p.display_order, p.created_at;
$$;

revoke all on function public.get_product_seo_page(text) from public;
revoke all on function public.get_product_seo_sitemap() from public;
grant execute on function public.get_product_seo_page(text) to anon, authenticated;
grant execute on function public.get_product_seo_sitemap() to anon, authenticated;
