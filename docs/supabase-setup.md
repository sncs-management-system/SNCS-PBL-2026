# Supabase and Vercel setup for PB-11

Setup and PB-11 implementation checked on October 2, 2026 (Asia/Manila).

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

The Resources page now reads Supabase using the installed client and typed adapter.
Other public content pages continue to use local CMS-ready records. Vite reads local env files at startup;
restart the dev server after changes. Changes in Vercel need a new deployment.

## Database and Storage observations

The revised ERD and current `public.resources` table agree on these columns:

```text
id, title, category, storage_path, file_size_bytes, status, uploaded_by, updated_at, visibility
```

The table now has two public/published TLC records. RLS remains enabled, with a
SELECT policy requiring both published status and public visibility. Anonymous
and authenticated roles have SELECT access to the seven listing columns only;
uploaded_by, updated_at and wildcard reads are denied. No public write policy
was added. Other table permissions were not changed.

The existing Storage bucket is `resource-files`, marked PUBLIC, with no public
upload policies, application/pdf uploads and a 10,485,760-byte limit. Public buckets serve known
file URLs independently of resource-table visibility. Use this bucket only for
official files approved for public access; use private storage for drafts,
restricted references, and enrollment documents.

The original ERD has status without visibility; the current table adds constrained
public/private visibility defaulting to private. US-03's public/published boundary
is enforced by both the adapter query and the RLS policy. The visibility field,
policy, listing grants and bucket limits already existed when this implementation
resumed. They are preserved in the repeatable PB-11 migration.

## PB-11 applied setup

Implementation branch: `feat/pb11-resource-downloads`, based on PB-10 commit 39daca5.
See [PB-11 notes](pb11-preparation.md) for exact migration/seed paths and provenance,
and [verification](verification/pb11-verification.md) for real download checks.
Run `pnpm check:resources` to recheck the two records/files without writing data.

No app users existed yet. The migration allows NULL uploaded_by for these two
initial dashboard imports and keeps the users foreign key. The manifest records
source URLs, hashes, import method and NULL attribution. Future CMS uploads must
set the actual staff ID and need their own authorized write policies.

The database changes and uploads are applied. The local website code is on the
PB-11 branch; Vercel needs that code pushed/deployed before serving this new route.

PDF preview (US-04) is post-MVP. CMS upload/edit screens belong to PB-01, not
today's setup or PB-11's public resource browsing scope.

Official references:

- https://supabase.com/docs/guides/getting-started/quickstarts/vue
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/environment-variables
