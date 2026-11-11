-- Multi-brand retail foundation. Additive and safe for the existing ZARIAH catalogue.
begin;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand_type text not null default 'established'
    check (brand_type in ('established','zariah_edit','private_label')),
  description text,
  logo_url text,
  cover_image_url text,
  website_url text,
  authenticity_policy text not null default 'mixed'
    check (authenticity_policy in ('verified_only','mixed','not_applicable')),
  is_active boolean not null default true,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists brand_id uuid references public.brands(id) on delete set null,
  add column if not exists authenticity_status text not null default 'not_yet_verified'
    check (authenticity_status in ('verified','sourcing_documented','not_yet_verified','not_applicable'));

create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists brands_active_order_idx on public.brands(is_active, display_order, name);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  supplier_type text not null default 'local'
    check (supplier_type in ('local','international','brand_authorized','other')),
  contact_person text,
  phone text,
  email text,
  country text,
  address text,
  internal_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  supplier_sku text,
  purchase_cost_bdt integer check (purchase_cost_bdt is null or purchase_cost_bdt >= 0),
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  minimum_order_quantity integer not null default 1 check (minimum_order_quantity > 0),
  is_preferred boolean not null default false,
  availability_confirmed_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, supplier_id)
);
create index if not exists product_sources_supplier_idx on public.product_sources(supplier_id);

create table if not exists public.authenticity_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  evidence_type text not null
    check (evidence_type in ('purchase_invoice','authorization','certificate','supplier_declaration','other')),
  storage_path text,
  reference_number text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists authenticity_evidence_product_idx on public.authenticity_evidence(product_id);

alter table public.brands enable row level security;
alter table public.suppliers enable row level security;
alter table public.product_sources enable row level security;
alter table public.authenticity_evidence enable row level security;

drop policy if exists brands_public_active_read on public.brands;
create policy brands_public_active_read on public.brands
for select to anon, authenticated using (is_active = true or (select public.is_staff_or_admin()));
drop policy if exists brands_staff_manage on public.brands;
create policy brands_staff_manage on public.brands
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

drop policy if exists suppliers_staff_manage on public.suppliers;
create policy suppliers_staff_manage on public.suppliers
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists product_sources_staff_manage on public.product_sources;
create policy product_sources_staff_manage on public.product_sources
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists authenticity_evidence_staff_manage on public.authenticity_evidence;
create policy authenticity_evidence_staff_manage on public.authenticity_evidence
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

commit;
