# Supabase and Vercel setup for PB-11

Setup checked on October 2, 2026 (Asia/Manila). PB-11 feature work is still pending.

## Existing projects

- GitHub: https://github.com/sncs-management-system/SNCS-PBL-2026
- Vercel: https://vercel.com/miles-projects-1a6aa47f/sncs-pbl-2026
- Demo: https://sncs-pbl-2026.vercel.app
- Supabase: https://supabase.com/dashboard/project/ddjfwiaifkpmlnyrsxnx
- Revised ERD: https://drive.google.com/file/d/1y0tJKND-1uHw7CxvignqbmbZcnBGwiXJ/view
- Acceptance criteria: https://docs.google.com/document/d/1-gUKxR0GziOLngENmimQdxlxfHfraMyc/edit

Vercel is already connected to this GitHub repository. The frontend is Vue 3 +
Vite. Use `VITE_` names, not `NEXT_PUBLIC_` or `VUE_APP_` names.

## Environment configuration

| Variable | Value source | Exposure |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | Public browser configuration |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Settings > API Keys > Publishable key | Public browser key; access is controlled by RLS |

Both variables are saved in Vercel for Production, Preview, and Development.
The existing production source was redeployed with the latest environment
settings; Vercel reported Ready. Deployment:
https://vercel.com/miles-projects-1a6aa47f/sncs-pbl-2026/4ACUzUsiRt2ASqFyTjzjkKJNV4wc

This demo currently shares one Supabase project across these environments.
Separate production and test data before using real applicant records.

The local `.env.local` contains the matching public configuration and is ignored
by Git. `.env.example` is the shareable blank template. A teammate can copy it
to `.env.local` and obtain the values from the dashboard.

Never put a Supabase secret key, legacy `service_role` key, database password,
or direct database connection string in a `VITE_` variable. Vite embeds those
variables into browser code. Future backend secrets belong in server-only
environment variables when the backend is implemented.

Run this read-only check from the repository directory:

```bash
pnpm check:supabase
```

It validates the key with the Supabase API and requests zero resource rows.
It does not modify the database, prove resource visibility, or test downloads.
Setup validation passed: API/key check, resources endpoint check, `pnpm lint`,
and `pnpm build`. The build includes TypeScript checking. These setup files are
included with the `feat/pb10-content-completion` branch for team review.

The current public pages still use local content; no Supabase adapter is installed
or called by the frontend yet. Environment variables prepare configuration but
do not create that adapter automatically. Vite reads local env files at startup;
restart the dev server after changes. Changes in Vercel need a new deployment.

## Database and Storage observations

The revised ERD and current `public.resources` table agree on these columns:

```text
id, title, category, storage_path, file_size_bytes, status, uploaded_by, updated_at
```

The table currently has no records. All public-schema tables have RLS enabled
with no policies listed. The publishable key therefore cannot read resource rows
yet. Keep RLS enabled and implement a narrowly scoped resource SELECT policy as
part of PB-11.

The existing Storage bucket is `resource-files`, marked PUBLIC, with no policies
listed and no MIME restrictions or custom size limit. Public buckets serve known
file URLs independently of resource-table visibility. Use this bucket only for
official files approved for public access; use private storage for drafts,
restricted references, and enrollment documents. Configure PDF uploads and the
10 MB limit before resource administration work.

The ERD has `status` but no separate `visibility`/`is_public` column. US-03 requires
both public and published resources. Resolve this in the PB-11 migration and
enforce the same rule in the query and RLS policy before listing records. Do not
assume that `status = 'published'` proves public visibility.

## PB-11 work for the next session

1. Work on a PB-11 feature branch with accurate authorship for the person doing
   the implementation. Keep the backlog owner and actual contributor distinct.
2. Add the public-visibility field and resource read policy, matching the revised
   schema and US-03. Restrict browser reads to the listing fields.
3. Install the Supabase client and add a resources adapter using
   `import.meta.env.VITE_SUPABASE_URL` and
   `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Build a Resources route reachable from navigation, grouping PDFs by category
   and showing each title, category, and formatted file size.
5. Use approved PDFs in `resource-files` and make Download start a PDF download.
   Verify the actual browser download behavior, including cross-origin handling.
6. Verify draft/private records stay hidden, category grouping, file sizes,
   downloads, empty/error states, and mobile layout.

PDF preview (US-04) is post-MVP. CMS upload/edit screens belong to PB-01, not
today's setup or PB-11's public resource browsing scope.

Official references:

- https://supabase.com/docs/guides/getting-started/quickstarts/vue
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/environment-variables
