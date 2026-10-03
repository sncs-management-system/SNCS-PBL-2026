-- Transaction-only fixtures; no test records remain after ROLLBACK.
begin;
insert into public.resources (title, category, storage_path, file_size_bytes, status, visibility, uploaded_by) values
  ('PB11 RLS test public', 'PB11 Verification', 'pb11-test-public.pdf', 5, 'published', 'public', null),
  ('PB11 RLS test draft', 'PB11 Verification', 'pb11-test-draft.pdf', 5, 'draft', 'public', null),
  ('PB11 RLS test private', 'PB11 Verification', 'pb11-test-private.pdf', 5, 'published', 'private', null),
  ('PB11 RLS test archived', 'PB11 Verification', 'pb11-test-archived.pdf', 5, 'archived', 'public', null);
set local role anon;
select current_user as role,
  count(*) filter (where title = 'PB11 RLS test public') = 1 as published_public_visible,
  count(*) filter (where title = 'PB11 RLS test draft') = 0 as draft_hidden,
  count(*) filter (where title = 'PB11 RLS test private') = 0 as private_hidden,
  count(*) filter (where title = 'PB11 RLS test archived') = 0 as archived_hidden
from public.resources where category = 'PB11 Verification';
reset role;
rollback;
