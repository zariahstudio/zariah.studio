-- Authenticated storefront customers should read active brands, while staff retain private inactive-brand access and write permissions.
begin;
drop policy if exists brands_public_active_read on public.brands;
drop policy if exists brands_staff_manage on public.brands;
drop policy if exists brands_staff_insert on public.brands;
drop policy if exists brands_staff_update on public.brands;
drop policy if exists brands_staff_delete on public.brands;
create policy brands_public_active_read on public.brands for select to anon, authenticated using (is_active=true or (select public.is_staff_or_admin()));
create policy brands_staff_insert on public.brands for insert to authenticated with check ((select public.is_staff_or_admin()));
create policy brands_staff_update on public.brands for update to authenticated using ((select public.is_staff_or_admin())) with check ((select public.is_staff_or_admin()));
create policy brands_staff_delete on public.brands for delete to authenticated using ((select public.is_staff_or_admin()));
commit;
