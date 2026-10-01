-- Add PB-12 submission support to the supplied SNCS_Schema_Final.sql.
-- The team's four enrollment tables and their columns remain unchanged.
begin;
do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enrollment_applications' and column_name = 'reference_no') then
    raise exception 'PB12_SCHEMA_MISMATCH: Apply the team SNCS schema first. Preserve and reconcile any legacy standalone PB-12 records separately.';
  end if;
end $$;

-- Technical retry metadata only; applicant details stay in the team's tables.
create table if not exists public.enrollment_submission_receipts (
  submission_id uuid primary key,
  application_id bigint not null unique references public.enrollment_applications(id) on delete cascade,
  payload_hash text not null
);
create index if not exists enrollment_applications_ip_time
  on public.enrollment_applications (submitter_ip_hash, submitted_at desc);
alter table public.enrollment_periods enable row level security;
alter table public.enrollment_applications enable row level security;
alter table public.application_guardians enable row level security;
alter table public.application_documents enable row level security;
alter table public.enrollment_submission_receipts enable row level security;
revoke all on public.enrollment_periods, public.enrollment_applications, public.application_guardians,
  public.application_documents, public.enrollment_submission_receipts from anon, authenticated;
-- FOR SHARE row locking also requires UPDATE privilege in PostgreSQL.
grant select, update on public.enrollment_periods to service_role;
grant select, insert on public.enrollment_applications, public.application_guardians,
  public.application_documents, public.enrollment_submission_receipts to service_role;
grant usage, select on sequence public.enrollment_applications_id_seq,
  public.application_guardians_id_seq, public.application_documents_id_seq to service_role;

create or replace function public.submit_pb12_enrollment(
  p_submission_id uuid, p_ip_hash text, p_application jsonb, p_guardians jsonb,
  p_school_year text, p_privacy_consent boolean, p_attachment jsonb, p_attachment_path text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  active_period public.enrollment_periods%rowtype;
  existing record;
  saved_id bigint;
  saved_reference text;
  fingerprint text;
begin
  if p_privacy_consent is distinct from true then raise exception 'PRIVACY_CONSENT_REQUIRED'; end if;
  select * into active_period from public.enrollment_periods
    where id = (p_application->>'period_id')::bigint for share;
  if active_period.status is distinct from 'open' or active_period.school_year is distinct from p_school_year then
    raise exception 'ENROLLMENT_CLOSED';
  end if;
  fingerprint := encode(sha256(convert_to(jsonb_build_object(
    'application', p_application, 'guardians', p_guardians, 'attachment', p_attachment
  )::text, 'UTF8')), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 1));
  select a.reference_no, a.submitter_ip_hash, r.payload_hash into existing
    from public.enrollment_submission_receipts r
    join public.enrollment_applications a on a.id = r.application_id
    where r.submission_id = p_submission_id;
  if found then
    if existing.submitter_ip_hash <> p_ip_hash or existing.payload_hash <> fingerprint then
      raise exception 'SUBMISSION_CONFLICT';
    end if;
    return jsonb_build_object('reference', existing.reference_no, 'created', false);
  end if;
  if (select count(*) from public.enrollment_applications
      where submitter_ip_hash = p_ip_hash and submitted_at > now() - interval '1 hour') >= 5 then
    raise exception 'RATE_LIMIT';
  end if;
  saved_reference := 'SNCS-' || upper(replace(gen_random_uuid()::text, '-', ''));
  insert into public.enrollment_applications (
    reference_no, period_id, department, applicant_type, grade_level, strand, mode_of_payment,
    surname, first_name, middle_name, birth_date, gender, place_of_birth, religion,
    complete_address, contact_numbers, email, parent_email, guardian_messenger,
    last_school_name, last_school_address, status, privacy_consent_at, submitter_ip_hash
  ) values (
    saved_reference, active_period.id, p_application->>'department', p_application->>'applicant_type',
    p_application->>'grade_level', p_application->>'strand', p_application->>'mode_of_payment',
    p_application->>'surname', p_application->>'first_name', p_application->>'middle_name',
    (p_application->>'birth_date')::date, p_application->>'gender', p_application->>'place_of_birth',
    p_application->>'religion', p_application->>'complete_address', p_application->>'contact_numbers',
    p_application->>'email', p_application->>'parent_email', p_application->>'guardian_messenger',
    p_application->>'last_school_name', p_application->>'last_school_address',
    'pending', now(), p_ip_hash
  ) returning id into saved_id;
  insert into public.application_guardians (application_id, relationship, full_name, occupation, contact_number)
    select saved_id, g.relationship, g.full_name, g.occupation, g.contact_number
    from jsonb_to_recordset(p_guardians) as g(relationship text, full_name text, occupation text, contact_number text);
  if p_attachment_path is not null then
    insert into public.application_documents (application_id, document_type, storage_path)
      values (saved_id, 'supporting_document', p_attachment_path);
  end if;
  insert into public.enrollment_submission_receipts (submission_id, application_id, payload_hash)
    values (p_submission_id, saved_id, fingerprint);
  return jsonb_build_object('reference', saved_reference, 'created', true);
end;
$$;
revoke all on function public.submit_pb12_enrollment(uuid, text, jsonb, jsonb, text, boolean, jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_pb12_enrollment(uuid, text, jsonb, jsonb, text, boolean, jsonb, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('enrollment-documents', 'enrollment-documents', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
commit;
