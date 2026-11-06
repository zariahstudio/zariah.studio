-- ZARIAH Studio initial schema
-- Apply in Supabase SQL Editor for the zariah-studio-sg project.
-- This migration creates the core catalogue, inventory, customer, order,
-- payment and membership tables. It does NOT create an admin login.
-- Bootstrap the first admin manually after creating that user in Supabase Auth.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cover_image_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name text not null,
  collection_id uuid references public.collections(id) on delete restrict,
  product_type text,
  color text,
  description text,
  specifications jsonb not null default '{}'::jsonb,
  price_bdt integer not null check (price_bdt >= 0),
  compare_at_price_bdt integer check (compare_at_price_bdt is null or compare_at_price_bdt >= 0),
  badge text,
  badge_style text,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_published boolean not null default false,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  image_role text not null default 'gallery'
    check (image_role in ('front','side','detail','inside','back','lifestyle','gallery')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create table if not exists public.inventory (
  product_id uuid primary key references public.products(id) on delete restrict,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= on_hand),
  low_stock_threshold integer not null default 2 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text not null,
  reference text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  address text,
  district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_phone_idx on public.customers(phone);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  source text not null check (source in ('website','whatsapp','manual')),
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'new'
    check (status in ('new','confirmed','processing','shipped','delivered','cancelled','returned')),
  subtotal_bdt integer not null default 0 check (subtotal_bdt >= 0),
  discount_bdt integer not null default 0 check (discount_bdt >= 0),
  delivery_fee_bdt integer not null default 0 check (delivery_fee_bdt >= 0),
  total_bdt integer not null default 0 check (total_bdt >= 0),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','partially_paid','paid','refunded')),
  payment_method text
    check (payment_method is null or payment_method in ('cash_on_delivery','bkash','nagad','bank_transfer','other')),
  payment_reference text,
  notes text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku_snapshot text not null,
  name_snapshot text not null,
  unit_price_bdt integer not null check (unit_price_bdt >= 0),
  quantity integer not null check (quantity > 0),
  line_total_bdt integer not null check (line_total_bdt >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers(id) on delete restrict,
  membership_number text not null unique,
  registered_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','suspended')),
  discount_percent numeric(5,2) not null default 10 check (discount_percent = 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  method text not null check (method in ('cash_on_delivery','bkash','nagad','bank_transfer','other')),
  amount_bdt integer not null check (amount_bdt > 0),
  status text not null default 'pending'
    check (status in ('pending','verified','rejected','refunded')),
  reference text,
  notes text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_order_idx on public.product_images(product_id, display_order);
create index if not exists inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists payments_order_created_idx on public.payments(order_id, created_at desc);

-- Role-check helper. SECURITY DEFINER avoids recursive RLS evaluation on profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin','staff')
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_staff_or_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff_or_admin() to authenticated;

-- Updated-at triggers
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at before update on public.collections
for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
drop trigger if exists inventory_set_updated_at on public.inventory;
create trigger inventory_set_updated_at before update on public.inventory
for each row execute function public.set_updated_at();
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
drop trigger if exists memberships_set_updated_at on public.memberships;
create trigger memberships_set_updated_at before update on public.memberships
for each row execute function public.set_updated_at();

-- Enable RLS on every application table.
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.activity_logs enable row level security;

-- Profiles: users can read their own profile; admins can manage all profiles.
drop policy if exists "profile_select_own_or_admin" on public.profiles;
create policy "profile_select_own_or_admin" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "profile_admin_manage" on public.profiles;
create policy "profile_admin_manage" on public.profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Public storefront reads only active collections and published products/images.
drop policy if exists "collections_public_active_read" on public.collections;
create policy "collections_public_active_read" on public.collections
for select to anon, authenticated using (is_active = true or (select public.is_staff_or_admin()));
drop policy if exists "collections_staff_manage" on public.collections;
create policy "collections_staff_manage" on public.collections
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

drop policy if exists "products_public_published_read" on public.products;
create policy "products_public_published_read" on public.products
for select to anon, authenticated using (is_published = true or (select public.is_staff_or_admin()));
drop policy if exists "products_staff_manage" on public.products;
create policy "products_staff_manage" on public.products
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

drop policy if exists "product_images_public_read_published" on public.product_images;
create policy "product_images_public_read_published" on public.product_images
for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_published = true
  )
  or (select public.is_staff_or_admin())
);
drop policy if exists "product_images_staff_manage" on public.product_images;
create policy "product_images_staff_manage" on public.product_images
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- Inventory and business records are private to staff/admin.
drop policy if exists "inventory_staff_access" on public.inventory;
create policy "inventory_staff_access" on public.inventory
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists "inventory_movements_staff_access" on public.inventory_movements;
create policy "inventory_movements_staff_access" on public.inventory_movements
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists "customers_staff_access" on public.customers;
create policy "customers_staff_access" on public.customers
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists "orders_staff_access" on public.orders;
create policy "orders_staff_access" on public.orders
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists "order_items_staff_access" on public.order_items;
create policy "order_items_staff_access" on public.order_items
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists "memberships_staff_access" on public.memberships;
create policy "memberships_staff_access" on public.memberships
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists "payments_staff_access" on public.payments;
create policy "payments_staff_access" on public.payments
for all to authenticated using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));
drop policy if exists "activity_logs_admin_read" on public.activity_logs;
create policy "activity_logs_admin_read" on public.activity_logs
for select to authenticated using ((select public.is_admin()));
drop policy if exists "activity_logs_staff_insert" on public.activity_logs;
create policy "activity_logs_staff_insert" on public.activity_logs
for insert to authenticated with check (
  actor_id = (select auth.uid()) and (select public.is_staff_or_admin())
);

-- Private admin image bucket. Public storefront can read images; only staff/admin can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_bucket_public_read" on storage.objects;
create policy "product_images_bucket_public_read" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "product_images_bucket_staff_insert" on storage.objects;
create policy "product_images_bucket_staff_insert" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_staff_or_admin()));
drop policy if exists "product_images_bucket_staff_update" on storage.objects;
create policy "product_images_bucket_staff_update" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and (select public.is_staff_or_admin()))
with check (bucket_id = 'product-images' and (select public.is_staff_or_admin()));
drop policy if exists "product_images_bucket_staff_delete" on storage.objects;
create policy "product_images_bucket_staff_delete" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and (select public.is_staff_or_admin()));

commit;
