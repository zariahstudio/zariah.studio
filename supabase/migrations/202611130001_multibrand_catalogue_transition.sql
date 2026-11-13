-- Convert the legacy 18-item catalogue to a multi-brand retail model.
-- Preserve product IDs, SKUs, URLs, images, orders and the legacy collections table.
begin;

alter table public.brands drop constraint if exists brands_brand_type_check;
alter table public.brands add constraint brands_brand_type_check
  check (brand_type in ('established','zariah_edit','private_label','placeholder'));

insert into public.brands (name, slug, brand_type, description, authenticity_policy, is_active, display_order)
values
 ('Liora Atelier','liora-atelier','placeholder','Temporary display label assigned during the multi-brand catalogue transition. Not a verified real-world brand. Replace after supplier confirmation.','mixed',true,10),
 ('Veyra Studio','veyra-studio','placeholder','Temporary display label assigned during the multi-brand catalogue transition. Not a verified real-world brand. Replace after supplier confirmation.','mixed',true,20),
 ('Avenelle','avenelle','placeholder','Temporary display label assigned during the multi-brand catalogue transition. Not a verified real-world brand. Replace after supplier confirmation.','mixed',true,30),
 ('Mariselle','mariselle','placeholder','Temporary display label assigned during the multi-brand catalogue transition. Not a verified real-world brand. Replace after supplier confirmation.','mixed',true,40),
 ('Orlune','orlune','placeholder','Temporary display label assigned during the multi-brand catalogue transition. Not a verified real-world brand. Replace after supplier confirmation.','mixed',true,50),
 ('Sorelle House','sorelle-house','placeholder','Temporary display label assigned during the multi-brand catalogue transition. Not a verified real-world brand. Replace after supplier confirmation.','mixed',true,60)
on conflict (slug) do update set
  name=excluded.name,
  brand_type='placeholder',
  description=excluded.description,
  authenticity_policy='mixed',
  is_active=true,
  display_order=excluded.display_order;

insert into public.collections (slug,name,description,display_order,is_active)
values ('all-bags','All Bags','Internal compatibility grouping for the multi-brand storefront. Not displayed as a collection.',0,true)
on conflict (slug) do update set name='All Bags',description=excluded.description,is_active=true,display_order=0;

update public.products p
set
  brand = case p.sku
    when 'Essence01' then 'Liora Atelier'
    when 'Essence02' then 'Veyra Studio'
    when 'Essence03' then 'Avenelle'
    when 'Essence04' then 'Mariselle'
    when 'Essence05' then 'Orlune'
    when 'Essence06' then 'Sorelle House'
    when 'Signature01' then 'Avenelle'
    when 'Signature02' then 'Mariselle'
    when 'Signature03' then 'Orlune'
    when 'Signature04' then 'Sorelle House'
    when 'Signature05' then 'Liora Atelier'
    when 'Signature06' then 'Veyra Studio'
    when 'Noir01' then 'Orlune'
    when 'Noir02' then 'Sorelle House'
    when 'Noir03' then 'Liora Atelier'
    when 'Noir04' then 'Veyra Studio'
    when 'Noir05' then 'Avenelle'
    when 'Noir06' then 'Mariselle'
    else p.brand
  end,
  brand_id = (
    select b.id from public.brands b
    where b.slug = case p.sku
      when 'Essence01' then 'liora-atelier'
      when 'Essence02' then 'veyra-studio'
      when 'Essence03' then 'avenelle'
      when 'Essence04' then 'mariselle'
      when 'Essence05' then 'orlune'
      when 'Essence06' then 'sorelle-house'
      when 'Signature01' then 'avenelle'
      when 'Signature02' then 'mariselle'
      when 'Signature03' then 'orlune'
      when 'Signature04' then 'sorelle-house'
      when 'Signature05' then 'liora-atelier'
      when 'Signature06' then 'veyra-studio'
      when 'Noir01' then 'orlune'
      when 'Noir02' then 'sorelle-house'
      when 'Noir03' then 'liora-atelier'
      when 'Noir04' then 'veyra-studio'
      when 'Noir05' then 'avenelle'
      when 'Noir06' then 'mariselle'
      else null
    end
  ),
  authenticity_status='not_yet_verified',
  collection_id=(select id from public.collections where slug='all-bags')
where p.sku in (
 'Essence01','Essence02','Essence03','Essence04','Essence05','Essence06',
 'Signature01','Signature02','Signature03','Signature04','Signature05','Signature06',
 'Noir01','Noir02','Noir03','Noir04','Noir05','Noir06'
);

commit;
