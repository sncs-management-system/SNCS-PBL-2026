# PB-11 verification

Verified 2 October 2026 (Asia/Manila) on feat/pb11-resource-downloads.
Local server: http://127.0.0.1:5173/resources . Production Vercel code has not
been updated by this task.

## Story checked

Home navigation → Resources → live Supabase listing → public Storage PDF →
actual file saved by the browser. Reads use the public publishable key; resource
RLS and listing-column grants enforce the public/published boundary independently
of the Vue page. Only the two available TLC originals are included.

## Results

- pnpm lint: passed.
- pnpm build: passed, including Vue/TypeScript checking. Resources and the
  Supabase client are in a lazy route chunk; Home's main bundle remains separate.
- pnpm test: 9 tests passed, including public/private/draft/archived parsing,
  unsafe path/size rejection, measured sizes, safe filenames, HTTP errors,
  non-PDF, truncated, changed and oversized download rejection.
- pnpm check:resources: passed. An unfiltered anonymous REST query returned
  exactly the two published/public records. Audit-column and wildcard reads
  were denied. Both public Storage objects matched original byte sizes/hashes.
- Live SQL RLS fixtures: published/public visible, public draft hidden,
  published private hidden, public archived hidden. All four checks were true
  as anon; the transaction rolled back. No fixture records remain.
- Repeatable migration applied successfully and rerun without error. The seed
  created IDs 1 and 2 after the files were verified.
- Browser desktop: both titles/category/sizes and Download PDF buttons visible;
  direct /resources reload loads the route and data. No captured console errors.
- Browser phone: Home → Menu → Resources → Transfer download required exactly
  three taps, with scrolling allowed. Menu closed on navigation. 390-pixel and
  320-pixel layouts had no horizontal overflow; both buttons were 48 pixels high.
- 1024-pixel desktop breakpoint had no brand/navigation overlap. Final desktop
  proof used 1280 × 900. Temporary viewport overrides reset after verification.
- Admissions and footer link to the same Resources route. The implementation
  contains listing loading/empty/error/retry and per-file error/retry states.
  Failure responses are unit-tested; empty/API outage page states were inspected
  in code rather than forced against the shared live database.
- HomeView.vue and CampusView.vue have no diff: Alumni remains untouched.
- .env.local is ignored; no credential values were added to repository files.

## Actual browser downloads

The in-app browser's download event listener timed out for a Blob download, but
both files were saved to the user's Downloads directory. Their actual disk bytes
were inspected; there was no need to change working download behavior to suit
the event listener. Original and saved hashes matched:

| Saved filename | Bytes | SHA-256 |
| --- | --- | --- |
| TLC-Grade-7-Application-Form-SY-2026-2027.pdf | 3922034 | 6087ea8a43ed9036e981f67a8ad0efdc8ca1dc3fddc6bac330646660ee786936 |
| TLC-Scholar-Transfer-Form.pdf | 5082223 | c9f1ff9df97f955971518b1b886094c365a4e5c0f85f8115da3238c1ec28092c |

Proof: pb11-resources-desktop.png, pb11-resources-mobile.png and
pb11-rls-result.png in this directory.

## Remaining scope

Staff CMS upload/edit/publish screens are PB-01; PDF preview is US-04 post-MVP;
enrollment is PB-12. The unavailable SHS withdrawal PDF is excluded. These are
not part of the implemented two-form download flow. Public Storage URLs cannot
be revoked by merely hiding a resource listing; private documents need private
storage and authorized access.
