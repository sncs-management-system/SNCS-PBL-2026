-- PB-12 owns these tables. No public SELECT/INSERT or applicant lookup endpoint.
create table public.enrollment_settings (
  id smallint primary key default 1 check (id = 1),
  status text not null default 'closed' check (status in ('open', 'closed')),
  school_year text not null check (school_year ~ '^[0-9]{4}-[0-9]{4}$')
);
insert into public.enrollment_settings (id, status, school_year) values (1, 'closed', '2026-2027');

create table public.enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  reference text not null unique default ('SNCS-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  status text not null default 'Pending' check (status in ('Pending', 'For Review', 'Complete', 'Incomplete')),
  school_year text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  attachment jsonb,
  attachment_path text,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index enrollment_applications_ip_time on public.enrollment_applications (ip_hash, created_at desc);
alter table public.enrollment_settings enable row level security;
alter table public.enrollment_applications enable row level security;
revoke all on public.enrollment_settings, public.enrollment_applications from anon, authenticated;
grant all on public.enrollment_settings, public.enrollment_applications to service_role;

create function public.submit_enrollment_application(
  p_submission_id uuid, p_ip_hash text, p_data jsonb, p_attachment jsonb, p_attachment_path text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  settings public.enrollment_settings%rowtype;
  existing public.enrollment_applications%rowtype;
  saved_reference text;
begin
  -- Shared row lock serializes a close/year change against in-flight inserts.
  select * into settings from public.enrollment_settings where id = 1 for share;
  if settings.status is distinct from 'open' or settings.school_year is distinct from (p_data->>'schoolYear') then
    raise exception 'ENROLLMENT_CLOSED';
  end if;
  -- Database locks/counts enforce the rolling limit across all API instances.
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 1));
  select * into existing from public.enrollment_applications where submission_id = p_submission_id;
  if found then
    if existing.ip_hash <> p_ip_hash or existing.data <> p_data or existing.attachment is distinct from p_attachment then
      raise exception 'SUBMISSION_CONFLICT';
    end if;
    return jsonb_build_object('reference', existing.reference, 'created', false);
  end if;
  if (select count(*) from public.enrollment_applications where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'RATE_LIMIT';
  end if;
  insert into public.enrollment_applications (submission_id, ip_hash, school_year, data, attachment, attachment_path)
    values (p_submission_id, p_ip_hash, settings.school_year, p_data, p_attachment, p_attachment_path)
    returning reference into saved_reference;
  return jsonb_build_object('reference', saved_reference, 'created', true);
end;
$$;
revoke all on function public.submit_enrollment_application(uuid, text, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_enrollment_application(uuid, text, jsonb, jsonb, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('enrollment-documents', 'enrollment-documents', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png']);
-- No storage policies: documents are accessible only through the backend/service role.
