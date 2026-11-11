-- Keep public brand discovery anonymous-only; authenticated staff retain access via brands_staff_manage.
begin;
drop policy if exists brands_public_active_read on public.brands;
create policy brands_public_active_read on public.brands
for select to anon using (is_active = true);
commit;
