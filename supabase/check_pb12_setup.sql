-- Read-only PB-12 setup check. Does not retrieve student records or credentials.
select
  to_regprocedure('public.submit_pb12_enrollment(uuid,text,jsonb,jsonb,text,boolean,jsonb,text)') is not null as submission_function_exists,
  to_regclass('public.enrollment_submission_receipts') is not null as receipts_table_exists,
  exists(select 1 from storage.buckets where id = 'enrollment-documents' and public = false) as private_document_bucket_exists;

select p.proname as function_name,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as server_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anonymous_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as signed_in_browser_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'submit_pb12_enrollment';
