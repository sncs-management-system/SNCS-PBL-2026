# PB-11 implementation preparation

Reviewed 2 October 2026. PB-10 comes first. This document does not apply database
changes, upload files, create a Resources route, or publish reference forms.
Alumni is unrelated to this work and remains untouched.

## Acceptance criteria and smallest useful scope

US-03 requires categorized resources; only public, published records; title,
category, and file size for every item; and a click that starts a PDF download.
Start with the verified TLC Forms category. Admission Forms and DepEd References
in the backlog are examples, not a requirement to invent additional documents.
US-04 PDF preview is post-MVP. Staff upload/edit/publish/archive belongs to PB-01.

## Official source inventory

The website contains two different TLC pages:

- Main navigation: <https://www.sncstaguig.com/tlc-forms> lists three PDFs, but
  all three linked Drive destinations returned “file not found” during review.
- Registration page: <https://www.sncstaguig.com/registration/tlc-forms> links
  two accessible PDFs. These exact originals are saved under reference-site/forms.
  This page explicitly labels the Grade 7 application for SY 2026–2027.

| Proposed display title | Saved original | Bytes / display size | Review |
| --- | --- | --- | --- |
| TLC Grade 7 Application Form | grade-7-tlc-application-2026.pdf | 3,922,034 / 3.92 MB | Two scanned pages; filename contains 2026. Source page gives the school year. |
| TLC Junior High School Transfer Form | tlc-scholar-transfer-form.pdf | 5,082,223 / 5.08 MB | One page; printed title is TLC Scholar Transfer Form, footer says Junior High School Transfer Form. |
| TLC Scholar SHS Withdrawal Form | No accessible original | Unknown | Listed only on main TLC page; do not invent a file or size. |

Both downloaded originals are blank print forms, without interactive AcroForm
fields. All three downloaded pages were visually reviewed. Preserve originals;
the public website downloads them rather than reimplementing their applicant
questions. The transfer document includes an SHS-related checkbox despite its
JHS footer; have the moderator confirm the intended label and audience. Do not
infer its school year from a Drive modification timestamp.

The machine-readable [manifest](reference-site/resources-manifest.json) records
original URLs, local paths, sizes, page counts, checksums, and private/draft
publication defaults. The source mismatch is a version-selection question for
the moderator. Obtaining an accessible PDF does not prove it replaces the broken
file on the other page. The two reference files are below the backlog's 10 MB
upload cap. They are not bundled in the production public directory.

## Data and Supabase plan

Observed resources columns:

```text
id, title, category, storage_path, file_size_bytes, status, uploaded_by, updated_at
```

1. Add a constrained public/private visibility field, default private, through a
   reviewed migration. Keep existing status semantics and check actual values
   before adding constraints to an existing table.
2. Keep RLS enabled. Anonymous SELECT must require both published status and
   public visibility. Give the browser access only to listing fields; do not
   grant anonymous insert/update/delete or expose uploaded_by/audit data.
3. Use the existing resource-files public bucket only for approved public PDFs.
   Drafts/restricted files and enrollment uploads need private storage. Public
   file URLs bypass table-row filtering; archiving a row hides the listing but
   does not revoke a previously known public URL. If revocation is required,
   use private storage and authorized downloads instead.
4. Agree with the CMS implementer on PDF validation and a 10 MB upload cap.
   Reject non-PDF uploads in the future trusted upload flow; bucket limits/MIME
   settings supplement validation. No service-role key belongs in Vue/Vercel
   VITE variables.
5. After version confirmation, upload each original under a stable path such as
   tlc/grade-7-application/2026-2027.pdf and tlc/jhs-transfer/current.pdf. Create
   a matching resource record with its measured bytes; confirm file availability
   before changing the record to public/published. Neither upload has occurred.
   The transfer path's "current" label must reflect the confirmed selected file.

Related setup: [Supabase setup notes](supabase-setup.md).

## Frontend design and adapter

Add a Resource model and a single adapter alongside src/lib/content. Map the
database's snake_case fields to the frontend model in that adapter. Views use
typed public resource results. Query only id,title,category,storage_path,
file_size_bytes,status,visibility and apply public/published filters; RLS must
enforce the same boundary independently.

Add /resources and one direct main-navigation link after the page is functional.
Group the default listing by category and show every approved item immediately:
title, TLC Forms, PDF, formatted byte size, and Download PDF. Use stacked cards
on phones and compact rows on desktop. No required category click, preview
modal, login, or Drive viewer intermediary. This preserves desktop two-click
and mobile three-tap download paths (Menu → Resources → Download PDF).

Use loading placeholders, a polite empty state, and a visible error/retry state.
Do not fall back to fake published resources when the API fails. For a failed
download, retain the user's context and display a retry action plus Registrar
contact. Keep the unavailable withdrawal preparation record out of public data.

## Download behavior

Supabase supports a download query on a public object URL; the URL must be built
from the known bucket/path and a safely encoded filename. Use the Supabase
client public-URL download option or the documented Storage download query,
then verify Content-Disposition and the actual browser result. A cross-origin
anchor's download attribute alone is insufficient, and opening Drive's PDF
viewer does not satisfy the requirement that clicking starts a download.

Verify in the real deployment: click Download PDF, a PDF is saved with a useful
filename, its size/content match the record, and it is readable. If the storage
response does not enforce download reliably in supported browsers, fetch an
approved public PDF as a Blob with a temporary same-origin object URL, handle
HTTP/CORS failures, and revoke it after starting the download. Avoid unbounded
memory use; the planned PDFs are individually below 10 MB.

Official documentation:
[public URL/download option](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl),
[Storage public downloads](https://supabase.com/docs/guides/storage/serving/downloads),
[row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## PB-11 completion checks for the implementation session

- Anonymous browser and direct REST reads expose public/published records only.
  Include public draft, private published, and archived fixtures when testing;
  verify excluded records are not returned, not merely hidden in the UI.
- Each public PDF has correct title, category, measured size, and storage path.
  Files are retrievable without CMS login.
- Category grouping works with TLC Forms alone; no empty invented categories.
- Desktop and phone click paths stay within the agreed budget; keyboard users
  can navigate and download with meaningful focus/labels.
- Each download saves the intended PDF instead of navigating to a viewer.
- Empty/API error/download failure states work, and refresh /resources works
  on Vercel with the approved SPA rewrite.
- Existing PB-10 content/selector behavior stays intact; Alumni stays untouched.

Pending client inputs are limited to selecting the intended two TLC versions,
confirming the transfer audience/title, and supplying the SHS withdrawal PDF if
it remains in scope. The rest of the preparation can proceed without that file.
