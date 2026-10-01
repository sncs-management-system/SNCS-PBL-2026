# PB-12: Submit an enrollment application online

Branch: `enrollment-application`. Public route: `/enrollment`.

This implements the public submission story. Applications are stored as **Pending**
with a unique reference; the applicant is directed to the Registrar’s Office.
Submitting is not final registration, an admission decision, or a payment.
Registrar screens and account management remain separate backlog items.

## Configure the team's existing Supabase project

1. Review and apply `supabase/migrations/202610010001_pb12_enrollment.sql` using
   your team's migration process or Supabase SQL editor. It creates only PB-12
   tables, the submission function, and a private `enrollment-documents` bucket.
   Coordinate these names with the EN-01 owner before applying to a shared project.
2. Copy `.env.example` to `.env` and fill in the existing Supabase URL and server
   service-role key. Keep `.env` untracked. No secret belongs in a `VITE_*` variable.
3. Create a Cloudflare Turnstile widget for your site (include `localhost` for local
   development). Set its public site key, secret key, and exact expected hostname
   in `.env`. The API checks hostname and action `enrollment`, not just success.
4. Set `APP_ORIGIN` to the exact website origin. Generate a stable random
   `IP_HASH_SECRET` with at least 32 characters, shared by every API instance.
   For example: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
5. The migration defaults to **closed**. Confirm the intended school year, then
   explicitly open it for the Sprint 1 demo:

   ```sql
   update public.enrollment_settings
   set status = 'open', school_year = '2026-2027'
   where id = 1;
   ```

   Close it by setting `status = 'closed'`. There is no public settings endpoint.

Use Node.js 22.12+ (Node 24 LTS recommended) and pnpm. Run `pnpm install`, then
`pnpm dev:server` and `pnpm dev` in separate terminals. Open `/enrollment` on the
Vite URL. Vite proxies `/api` to port 3001. If changing that port, update the proxy.

For deployment, run `pnpm build`, set `NODE_ENV=production`, and run `pnpm start`.
The Express process serves both `dist` and `/api` from one origin. Install the
development dependencies as well because the current start command uses `tsx`.
Alternatively use `pnpm exec tsx server/index.ts` with platform-injected variables
when there is no `.env` file. Set `HOST=0.0.0.0` if required by your host. Use HTTPS
at the host/reverse proxy. Only configure `TRUSTED_PROXIES` with the actual trusted
proxy IPs/CIDRs; forwarded client IPs are otherwise ignored. Confirm real client
IP attribution on that host before using the rate limit in production.

Missing configuration, database failures, and CAPTCHA failures do not return a
success receipt. There is no in-memory or browser-storage submission fallback.

## Field mapping and implementation assumptions

Source references supplied for this feature: `Student_Registration_Form_JHS.xlsx`
and `Student_Registration_Form_SHS.xlsx`. The five worksheets in each are mapped
as follows. No applicant records or source files are committed to the repository.

| Source worksheet | Online form fields |
| --- | --- |
| Student Information | Student email; parent email; parent/guardian Messenger account; surname, first and middle names; school year; New/Old/Returnee status; grade; SHS strand; payment preference; birthday; calculated age; gender; complete address; birthplace; religion; contact numbers |
| Father's Information | Surname, first and middle names; occupation; contact numbers; office address |
| Mother's Information | Maiden surname, first and middle names; occupation; contact numbers; office address |
| Guardian's Information | Surname, first and middle names; relationship; occupation; contact numbers; office address; number of siblings |
| Last School Attended | Grade; section; class adviser; principal; former school name and complete address |

The source has 43 JHS columns and 44 SHS columns. The online form adds a school-level
selector. Layout and whitespace are normalized; content options are preserved:

- JHS: Grades 7–10; no strand input or stored SHS strand.
- SHS Grade 11: `11-ACADEMIC`, `11-TECHPRO`.
- SHS Grade 12: `12-STEM`, `12-HUMSS`, `12-GAS`, `12-ABM`, `12-ICT`.
- Payment: Full Payment/Cash, Monthly, Quarterly, Semi-Annual. This is a preference;
  no payment provider or online payment is introduced.
- Gender: Male/Female, matching the supplied forms.

The spreadsheets do not identify required fields. Current implementation requires
enrollment selections; student first/surname, email, birthday, gender, address,
birthplace and phone; guardian first/surname, relationship and phone; and previous
school name/address. Father/mother details, middle names, parent email, Messenger,
religion, siblings, and other previous-school details are optional. A parent can
be entered as the guardian. Confirm these rules with the school before release;
edit `src/lib/enrollment/form.ts` to update both browser and API validation.

School year comes from the database. Age is calculated again on the server using
the date in Manila. Optional emails and telephone numbers are validated when
provided; multiple phone numbers are comma-separated. Unknown payload properties
are discarded, and clients cannot choose processing status or reference number.

The supplied PB-12 story also calls for file type/size validation without naming a
required document. This implementation provides one **optional** supporting file
(PDF/JPG/PNG, maximum 5 MB), with extension, MIME, and signature checks. Uploads
are private and there is no public download endpoint. Signature checks are not
malware scanning; a future staff document-viewing workflow must address that before
opening untrusted files. No document checklist or signed policy is invented.

## Submission and reliability

- The browser validates, presents a review, requires confirmation and Turnstile,
  then sends multipart data to `POST /api/enrollment/applications`.
- The API validates again, verifies Turnstile server-side, uploads an optional
  document privately, and calls the database submission function.
- The transaction rechecks enrollment state/year, enforces at most five saved
  submissions for the HMAC-hashed IP within a rolling hour, and inserts Pending.
  Database locks make the limit shared across API instances. Raw IPs are not saved.
- The browser keeps one random submission ID in memory. Retrying an identical
  submission returns its existing reference without using another quota slot.
  Conflicting data under that ID is rejected. Do not reload after an uncertain
  network result: complete a fresh CAPTCHA and retry on the same page.
- Files from known rejected transactions and redundant retries are removed.
  Ambiguous database/network failures preserve an uploaded file because the insert
  may have committed. Operations should periodically reconcile old unreferenced
  bucket objects against `attachment_path`; never delete referenced objects.
- Application data is not written to localStorage, sessionStorage, URLs, or logs.
  Refreshing loses the in-memory form. Database rows/files are private; no anonymous
  listing, reference lookup, or staff functionality is exposed by this feature.

## Verification and handoff

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
Tests exercise both form variants, validation, review/confirmation, errors/retries,
HTTP handling, CAPTCHA verification, and the SQL migration with local PostgreSQL
through PGlite. Storage schema/roles are stubbed in that database test; it is not a
connection to the team's hosted Supabase. HTTP tests inject a store and verifier.

Before the shared demo, apply the migration to a test project, configure real
Turnstile keys, and submit synthetic JHS/SHS applications from the browser. Confirm
the matching Pending records and private attachments in Supabase. Check a closed
period and the sixth submission from the same IP. Hosted integration is a separate
check and must not be inferred from the local tests.

Provider references: [Turnstile server-side verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
and [Supabase database functions](https://supabase.com/docs/guides/database/functions).
