-- Private evidence document storage for product authenticity review.
begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('authenticity-evidence','authenticity-evidence',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf','image/jpeg','image/png','image/webp'];
drop policy if exists authenticity_evidence_staff_read on storage.objects;
drop policy if exists authenticity_evidence_staff_insert on storage.objects;
drop policy if exists authenticity_evidence_staff_update on storage.objects;
drop policy if exists authenticity_evidence_staff_delete on storage.objects;
create policy authenticity_evidence_staff_read on storage.objects for select to authenticated using (bucket_id='authenticity-evidence' and (select public.is_staff_or_admin()));
create policy authenticity_evidence_staff_insert on storage.objects for insert to authenticated with check (bucket_id='authenticity-evidence' and (select public.is_staff_or_admin()));
create policy authenticity_evidence_staff_update on storage.objects for update to authenticated using (bucket_id='authenticity-evidence' and (select public.is_staff_or_admin())) with check (bucket_id='authenticity-evidence' and (select public.is_staff_or_admin()));
create policy authenticity_evidence_staff_delete on storage.objects for delete to authenticated using (bucket_id='authenticity-evidence' and (select public.is_staff_or_admin()));
commit;
