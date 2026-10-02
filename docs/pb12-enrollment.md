# PB-12: Enrollment application — team schema mapping

Branch: `enrollment-application`. Public route: `/enrollment`.

`supabase/reference/SNCS_Schema_Final.sql` is an unchanged copy of the schema
supplied by Jan. It is the source of truth for persistence and required fields.
The public feature remains JHS/SHS, as requested; the schema also permits preschool
and grade_school, but no registration forms for those levels were supplied.

## Database setup

1. Use the team's existing database with `SNCS_Schema_Final.sql` already installed.
   For an empty development database, install that reference schema first.
   Do not rerun its CREATE TABLE statements against an existing database.
2. Apply `supabase/migrations/202610010002_pb12_schema_alignment.sql`. It uses the
   existing `enrollment_periods`, `enrollment_applications`, `application_guardians`,
   and `application_documents` tables without adding or changing their columns.
   It adds a submission function, an IP/time index, access grants, a private bucket,
   and `enrollment_submission_receipts` for retry IDs and payload hashes only.
3. The old `202610010001_pb12_enrollment.sql` is retired and now a no-op. If its
   original standalone tables were already installed, preserve their records and
   reconcile that database separately before using this implementation. The new
   migration detects the incompatible legacy application table and stops without
   dropping or converting data. No hosted database has been modified by this change.
4. Copy `.env.example` to `.env`; configure the existing Supabase URL/server
   service-role key, Turnstile site/secret keys, exact hostname, and website origin.
   Keep secrets out of `VITE_*` variables. The API verifies Turnstile hostname and
   action `enrollment`. Generate a stable random `IP_HASH_SECRET` of 32+ characters
   and use the same value for all API instances.
5. Select or create the intended row in `enrollment_periods`, then open it using
   the team's database workflow. The schema allows at most one open period. The
   feature reads that row's ID and school year. No open row means enrollment is
   closed; the feature does not seed, open, or close enrollment automatically.

Use Node.js 22.12+ and pnpm. Run `pnpm install`, `pnpm dev:server`, and `pnpm dev`
(the latter two in separate terminals). Vite proxies `/api` to port 3001.
For production, run `pnpm build`, set `NODE_ENV=production`, then `pnpm start`.
The Express process serves the built website and API from one origin. Install
`tsx` with the development dependencies for this start command. If your platform
injects variables instead of providing `.env`, use `pnpm exec tsx server/index.ts`.
Set `HOST=0.0.0.0` if required by the host; use HTTPS at the reverse proxy.
`TRUSTED_PROXIES` must contain only actual proxy IPs/CIDRs so the rate limiter sees
the correct client address. Forwarded headers are otherwise ignored.

## Vercel branch preview

The branch includes `vercel.json` and two Node function entry points under
`api/enrollment/`. Vercel serves the built Vite website and these functions
together; it does not need to start the separate local Express listener.
The page rewrites support direct visits/reloads of `/enrollment` and the existing
website routes while leaving API and asset requests separate.

In the Vercel project, set these variables for **Preview**, scoped to
`enrollment-application` when using branch-specific credentials:

| Variable | Value/type |
| --- | --- |
| `SUPABASE_URL` | Existing project URL; Config |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing service-role key; Secret. A current `sb_secret_` key may instead be stored as `SUPABASE_SECRET_KEY` |
| `TURNSTILE_SITE_KEY` | Widget site key; Config |
| `TURNSTILE_SECRET_KEY` | Widget secret key; Secret |
| `TURNSTILE_HOSTNAME` | Exact branch hostname, no scheme, port, or path; Config |
| `APP_ORIGIN` | `https://` followed by that hostname, no trailing slash; Config |
| `IP_HASH_SECRET` | Stable random secret of at least 32 characters; Secret |

The frontend's `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` do not replace
these API credentials. Never put service-role, Supabase secret, Turnstile secret,
or IP hashing keys in `VITE_*` variables.

For Jan's branch preview, use:

```
TURNSTILE_HOSTNAME=sncs-pbl-2026-git-enrollment-application-jans-projects-244b4656.vercel.app
APP_ORIGIN=https://sncs-pbl-2026-git-enrollment-application-jans-projects-244b4656.vercel.app
```

Add that exact hostname to Cloudflare Turnstile's Hostname Management. Use the
stable branch URL for testing; a different commit URL requires its own hostname
authorization and matching origin settings. This does not require a custom domain.
Do not authorize the shared `vercel.app` parent domain.

Redeploy the latest `enrollment-application` commit after saving variables.
Open `/api/enrollment/config` on that preview to check routing: JSON with the
period and site key means the API is responding. A 404 means the function isn't
deployed. A 503 means configuration or Supabase is unavailable; inspect Vercel's
function logs for missing setting names. A successful closed response means no
enrollment period is open. Only open a period through the team's database workflow.
The additive migration above is still required for submission.

The Vercel adapter uses the platform-controlled `x-vercel-forwarded-for` address
for CAPTCHA and rate limiting. It never trusts a browser-provided Host header
to authorize a site, and it fails safely if the platform client IP is unavailable.
Function initialization is lazy, so a build does not require secrets to be present.
The API uses its own NodeNext TypeScript configuration and explicit `.js` relative
imports so compiled functions can load in Node's native ES module runtime. The
website build checks both frontend and server types. `pnpm test:runtime` compiles
the actual API entries, imports them in native Node, and checks safe startup and
configuration retrieval with synthetic credentials and a simulated Supabase response.

## Field-to-column mapping

UI labels remain readable; the server converts them to the schema's exact names
and enum values in `server/enrollment-mapping.ts`.

| Form value | Database destination |
| --- | --- |
| School year | Read from `enrollment_periods.school_year`; saved through `enrollment_applications.period_id` |
| JHS / SHS | `department`: `jhs` / `shs` |
| New / Old / Returnee | `applicant_type`: `new` / `old` / `returnee` |
| Grade level, SHS strand | `grade_level`, `strand`; JHS strand is SQL NULL |
| Full Payment/Cash, Monthly, Quarterly, Semi-Annual | `mode_of_payment`: `full_cash`, `monthly`, `quarterly`, `semi_annual` |
| Student surname, first name, middle name | `surname`, `first_name`, `middle_name` |
| Birthday, displayed age | `birth_date`; age is calculated for display, never stored |
| Male / Female | `gender`: `male` / `female` |
| Place of birth, religion | `place_of_birth`, `religion` |
| Complete address, contact numbers | `complete_address`, `contact_numbers` |
| Student email, parent email | `email`, `parent_email` |
| Parent/guardian Messenger account | `guardian_messenger` |
| Former school name/address | `last_school_name`, `last_school_address` |
| Father, mother, guardian full names | Separate `application_guardians` rows: `relationship`, `full_name` |
| Each parent's/guardian's occupation and contact | `application_guardians.occupation`, `contact_number` |
| Optional supporting document | `application_documents`: `application_id`, `document_type = supporting_document`, private `storage_path` |
| Explicit privacy consent checkbox | Required by API; `privacy_consent_at` generated by the database at first successful submission |
| Reference, initial status, submission time, hashed IP | Server/database-generated `reference_no`, `status = pending`, `submitted_at`, `submitter_ip_hash` |

The UI shows **Pending** as a readable label; the database stores **pending**.
Applicants cannot set status, reference number, registrar remarks, or consent time.
Every related row uses the generated BIGINT application ID. Blank nullable inputs
are saved as SQL NULL. BIGINT period IDs travel through the API as strings.

Religion and Messenger are now required because the schema marks them NOT NULL.
Middle name, parent email, and last-school details are optional. Father/mother/
guardian sections may be omitted; any section containing occupation or contact
requires a full name to satisfy `application_guardians.full_name`.

The earlier Excel forms include fields absent from this schema. The updated UI
therefore no longer collects parent/guardian office addresses, sibling count,
the guardian's specific relation to the student, previous grade/section, class
adviser, or principal. Parent names use one full-name field rather than three
separate name columns; the mother field asks for the full maiden name. The fixed
father/mother/guardian section supplies the `relationship` enum. These omissions
are explicit rather than silently discarding submitted information.

The Excel grade/strand options remain: JHS Grades 7–10; Grade 11 ACADEMIC/TECHPRO;
Grade 12 STEM/HUMSS/GAS/ABM/ICT (stored with the form's grade-prefixed strand labels).
The form has 29 JHS or 30 SHS fields, including the derived school year and age,
plus the optional attachment and review/consent controls.

## Submission behavior

The browser validates, shows a review, and requires both accuracy confirmation and
explicit privacy consent plus Turnstile. The API validates again and checks that
the selected period is still active, even if another period has the same school
year. It uploads an optional PDF/JPG/PNG (maximum 4 MB; MIME, extension, and signature
checks) to private Storage, then calls `submit_pb12_enrollment`.
The 4 MB file limit leaves room for form fields beneath Vercel's 4.5 MB request
limit. The private Storage bucket's existing 5 MB cap remains unchanged.

One database transaction inserts the application, guardian rows, document record,
and retry receipt. A failure in any related insert rolls back the whole database
transaction. The active period is locked during submission. A shared database lock
and rolling count on `submitter_ip_hash`/`submitted_at` enforce at most five saved
applications from an IP in one hour across API instances.

The browser retains a random submission ID in memory. An identical retry returns
the first reference without inserting or consuming another quota slot. The retry
helper stores only the ID, application foreign key, and a SHA-256 payload hash;
it does not duplicate applicant details. Consent time is preserved on retries.
After an uncertain network result, keep the page open and retry with a fresh CAPTCHA.

Known rejected uploads and redundant retry uploads are removed. Ambiguous network
failures preserve files in case the database committed; reconcile old unreferenced
objects against `application_documents.storage_path` operationally. No public
application/document reading endpoint or Storage policy is added. The feature does
not write applicant data to browser storage, URLs, or logs. Refreshing loses the form.
Submitting remains an application only; the receipt directs applicants to the
Registrar's Office for the remaining enrollment steps.

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:runtime`, and `pnpm build`.
Database tests execute the exact users/enrollment DDL from the supplied reference
schema and the PB-12 addition in local PostgreSQL via PGlite. They verify column
mapping, JHS NULL strand, SHS strand, lowercase status, guardian/document links,
consent timestamps, transaction rollback, retry behavior, limits, and access grants.
Unrelated scheduling tables/extensions and hosted Supabase Storage are not exercised.
Adapter tests verify the open-period query and normalized RPC request. Browser tests
use synthetic data and simulated services; no real applications are submitted.

Hosted verification still requires the team's configuration and applying the
additive migration. Submit synthetic JHS and SHS records, inspect all three tables
and the private document, then check closed enrollment and the sixth same-IP request.
