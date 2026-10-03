-- Run only AFTER uploading and verifying both original blank PDFs in resource-files.
-- No fabricated staff account: uploaded_by is NULL for these bootstrap imports.
begin;
insert into public.resources (title, category, storage_path, file_size_bytes, status, visibility, uploaded_by)
select 'TLC Grade 7 Application Form (SY 2026–2027)', 'TLC Forms', 'grade-7-tlc-application-2026.pdf', 3922034, 'published', 'public', null
where not exists (select 1 from public.resources where storage_path = 'grade-7-tlc-application-2026.pdf');
insert into public.resources (title, category, storage_path, file_size_bytes, status, visibility, uploaded_by)
select 'TLC Scholar Transfer Form', 'TLC Forms', 'tlc-scholar-transfer-form.pdf', 5082223, 'published', 'public', null
where not exists (select 1 from public.resources where storage_path = 'tlc-scholar-transfer-form.pdf');
commit;
select id, title, category, storage_path, file_size_bytes, status, visibility from public.resources order by id;
