-- PB-11 public PDF browsing. Existing project already has visibility, this
-- policy, column grants and bucket limits; retain them in a repeatable migration.
begin;
alter table public.resources add column if not exists visibility text not null default 'private';
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.resources'::regclass and conname = 'resources_visibility_check') then
    alter table public.resources add constraint resources_visibility_check check (visibility in ('public', 'private'));
  end if;
end $$;
alter table public.resources enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resources' and policyname = 'Read public published resources') then
    create policy "Read public published resources" on public.resources for select to anon, authenticated
      using (status = 'published' and visibility = 'public');
  end if;
end $$;
revoke all on public.resources from anon, authenticated;
grant select (id, title, category, storage_path, file_size_bytes, status, visibility) on public.resources to anon, authenticated;
-- No staff accounts exist yet. NULL denotes a dashboard bootstrap import;
-- provenance and hashes are recorded in docs/reference-site/resources-manifest.json.
-- Future CMS uploads must supply the authenticated staff ID. Retain the FK.
alter table public.resources alter column uploaded_by drop not null;
comment on column public.resources.uploaded_by is 'Staff uploader ID; NULL for initial dashboard-imported public reference forms. Future CMS uploads must set the staff ID.';
update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array['application/pdf']
where id = 'resource-files';
commit;
