-- Website image slots managed by the authenticated Admin Panel.
begin;
create table if not exists public.site_media (
 id uuid primary key default gen_random_uuid(), slot_key text not null unique,
 label text not null, storage_path text not null, public_url text not null,
 alt_text text, is_published boolean not null default false,
 updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
alter table public.site_media enable row level security;
drop policy if exists "site_media_public_published_read" on public.site_media;
create policy "site_media_public_published_read" on public.site_media for select to anon, authenticated using (is_published = true or (select public.is_staff_or_admin()));
drop policy if exists "site_media_staff_manage" on public.site_media;
create policy "site_media_staff_manage" on public.site_media for all to authenticated using ((select public.is_staff_or_admin())) with check ((select public.is_staff_or_admin()));
commit;
