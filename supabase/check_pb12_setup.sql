-- Read-only check of the existing team tables; no applicant records or keys.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('enrollment_periods', 'enrollment_applications', 'application_guardians', 'application_documents')
order by table_name, ordinal_position;
