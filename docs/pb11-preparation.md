# PB-11: TLC PDF downloads

Implemented on 2 October 2026 on `feat/pb11-resource-downloads`, based on PB-10
commit `39daca5`. PB-12 enrollment, staff CMS screens and Alumni are outside this change.
Rechecked on 3 October against main `4b6c2c4`: existing PB-12 enrollment is
preserved alongside the Resources navigation and downloads.

## Public experience

`/resources` reads live Supabase records and groups them by category. Every item
shows its title, category, PDF format and measured file size, followed by Download
PDF. Navigation and the footer link directly to Resources; Admissions links to
Download TLC forms. Desktop: Resources → Download (two clicks). Phone: Menu →
Resources → Download (three taps, with scrolling where needed).

The page includes loading, empty, listing failure/retry, and individual download
failure/retry states with a Registrar contact link. No category selection, sign-in,
Drive viewer or preview modal is required. US-04 preview remains post-MVP.

## Published originals

| Title | Storage path in resource-files | Bytes | Display |
| --- | --- | --- | --- |
| TLC Grade 7 Application Form (SY 2026–2027) | grade-7-tlc-application-2026.pdf | 3,922,034 | 3.92 MB |
| TLC Scholar Transfer Form | tlc-scholar-transfer-form.pdf | 5,082,223 | 5.08 MB |

Both originals came from the school's accessible registration TLC page:
<https://www.sncstaguig.com/registration/tlc-forms>. All three pages were visually
reviewed as blank print forms. The transfer title follows the printed title,
without assuming a school year or restricting its audience from the JHS footer.
The unavailable SHS withdrawal form remains excluded. The two versions currently
accessible from the registration page were selected for this implementation;
the broken links on the other TLC page remain documented in the manifest.

Originals and provenance are in `docs/reference-site/forms` and
`docs/reference-site/resources-manifest.json`. The PDFs are served from Supabase,
not bundled in the Vite public directory. Uploaded and browser-downloaded bytes
match the original SHA-256 checksums.

## Applied database setup

Project: `ddjfwiaifkpmlnyrsxnx`. The visibility field, SELECT policy, column grants
and bucket configuration already existed when implementation resumed. Their
observed state is preserved in the repeatable migration:
`supabase/migrations/202610020001_pb11_public_resources.sql`.

- RLS stays enabled. SELECT requires both published status and public visibility.
- Anonymous/authenticated listing grants expose only id, title, category,
  storage_path, file_size_bytes, status and visibility. Audit columns and wildcard
  reads are denied. No public write or Storage upload policy was added.
- The existing public resource-files bucket permits application/pdf up to
  10,485,760 bytes (10 MiB, displayed as 10 MB in Supabase).
- No app users existed. uploaded_by now permits NULL for initial authenticated
  dashboard imports, retaining its users foreign key. These two records have
  NULL attribution; future CMS uploads must set the actual staff ID. No fake
  staff account or password was created. CMS permissions require a later migration.

After verifying public file hashes, `supabase/seed-pb11.sql` created resource IDs
1 and 2, both public/published. The seed skips existing matching paths rather than
rewriting records. The migration and seed were applied in the authenticated SQL
Editor. The SQL fixtures in `supabase/tests/pb11-resource-rls.sql` verified public
published visibility and draft/private/archived exclusion; ROLLBACK removed all
fixture rows. Sequence gaps after rollback are normal.

Public bucket URLs remain accessible when a listing is archived or made private.
Keep restricted/draft/application documents in private storage. Changing a
resource row's visibility does not revoke a previously known public file URL.

## Adapter and download handling

The lazy Resources route loads the Supabase client only when needed, using the
existing public VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY configuration.
This client does not persist or reuse a staff authentication session. The adapter
selects only listing columns, filters public/published rows, validates metadata,
and rejects unsafe/non-PDF storage paths. It does not invent fallback records.

Downloads fetch the public file into a bounded Blob, check expected byte size and
PDF signature, then use a temporary same-origin object URL with a useful filename.
This avoids relying on a cross-origin anchor's download attribute. Requests have
timeouts and abort on navigation; URLs are revoked after the browser consumes them.
Only one PDF download is prepared at a time.

## Verification

See `docs/verification/pb11-verification.md`. Run:

```sh
pnpm lint
pnpm build
pnpm test
pnpm check:resources
```

`check:resources` is read-only, reads public configuration from ignored .env.local,
checks the two real anonymous records/files and audit-column restrictions, and never
prints keys. It currently expects this demo's two published TLC originals.

Official references:
[Storage public URLs](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl),
[column grants](https://supabase.com/docs/guides/database/postgres/column-level-security),
[row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
