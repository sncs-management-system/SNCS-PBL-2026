# PB-12: Enrollment application using the existing team schema

Branch: enrollment-application. Public route: /enrollment.

The supplied supabase/reference/SNCS_Schema_Final.sql remains unchanged. PB-12
uses its existing enrollment_periods, enrollment_applications and
application_guardians tables. It creates no tables, columns, indexes, functions,
storage buckets, policies or permission grants. No migration is required. Both
old PB-12 migration files are retired no-ops; do not apply earlier versions.
This code does not remove anything previously added by someone else.

## Configuration

Keep the current server Supabase URL and secret/service-role key for reading the
open enrollment period. Keep the current Turnstile site/secret keys, exact
hostname, APP_ORIGIN and IP_HASH_SECRET (32+ characters). Secret values must never
use the VITE_ prefix or be committed to the repository.

Add DATABASE_URL as a Secret in Vercel Preview, scoped to enrollment-application.
Get the connection string from Supabase Connect → Transaction pooler; include the
existing database password, with reserved characters URL-encoded. This server
connection must already have read/insert rights to the existing enrollment
tables and permission to lock the period row. The supplied team schema expects
the Express server to connect as the database owner. Do not change database
permissions as part of this feature.

The server verifies TLS certificates. If the existing project's connection needs
a custom CA, set DATABASE_SSL_CA to its official PEM certificate. Certificate
verification is never disabled. The pool allows two connections per instance,
uses unnamed parameterized queries and releases idle connections. DATABASE_URL
is read only on the server; it is never sent to the browser or logged.

APP_ORIGIN must be only scheme + hostname (+ optional local port), without a
trailing slash, and match TURNSTILE_HOSTNAME. For Jan's preview:

TURNSTILE_HOSTNAME=sncs-pbl-2026-git-enrollment-application-jans-projects-244b4656.vercel.app
APP_ORIGIN=https://sncs-pbl-2026-git-enrollment-application-jans-projects-244b4656.vercel.app

The existing active enrollment_periods row supplies its ID and school year.
No open row means enrollment is closed. PB-12 does not open or create a period.

Optional document upload is disabled because the project has no existing bucket.
The form has no file input, and the API rejects file parts before CAPTCHA or
persistence. Requirements are provided to the Registrar. No storage objects or
application_documents records are created.

## Validation and mapping

Pre-school uses Nursery and Kindergarten; Elementary uses Grades 1–6; JHS uses
Grades 7–10; SHS uses Grades 11–12 and the grade's supplied strand choices.
Department values are preschool, grade_school, jhs and shs. Non-SHS strand is NULL.
Student and parent/guardian contact numbers must be exactly 11 digits starting
with 09. Optional contacts may be blank. Names, addresses, emails, dates, lengths,
required fields and selection relationships are checked by the shared validator
in both browser and API. Birthday must be real and nonfuture; age is recomputed.
Processing status, IP hash and consent time are generated on the server. Staff
fields from requests are excluded.

## Transaction and retries

After validation, explicit privacy consent and Turnstile verification, the server
uses one PostgreSQL connection and transaction. It locks the active period,
checks the school year again and takes transaction-scoped advisory locks for the
hashed client IP and submission identifier. These locks do not create database
objects. It enforces five saved applications per IP in the rolling past hour.

The existing reference_no column stores SNCS- followed by the browser's random
submission UUID without hyphens. An identical retry compares the saved student
and guardian fields plus IP hash and returns the same reference. Different data
with that identifier returns a conflict. No retry helper table is used.

Student and guardian inserts commit together; any error rolls back the entire
transaction. Status starts as pending, and privacy_consent_at is saved only once.
If a network failure makes the result uncertain, keep the page open and retry
with a fresh CAPTCHA. The original reference is returned if it already committed.

No public reading endpoint is added. Applicant data, SQL/provider messages,
credentials and raw IPs are excluded from logs and public errors. Runtime logs
contain only the failed stage and a validated error code. Stage save with code
DBURL means DATABASE_URL has not been set. Other PostgreSQL codes identify a
connection or transaction failure without exposing applicant details.

## Verification

Run pnpm test, pnpm lint, pnpm test:runtime and pnpm build. PostgreSQL integration
tests execute the exact users/enrollment portions of the supplied schema locally
using PGlite, without applying migrations. They verify all four departments,
rollback, closed/changed periods, rate limits, identical/conflicting retries,
parameterized values and unchanged columns. Pool adapter tests verify TLS,
connection release and safe errors. Browser tests use simulated services and
fictional applicants. Hosted saving still requires DATABASE_URL and a user-run
dummy submission; no real application is submitted automatically.

supabase/check_pb12_setup.sql only reads the existing enrollment column metadata.
Do not rerun the original CREATE TABLE schema against the existing database.

## Connection diagnostics

Enrollment availability reads the active period through the existing Supabase
API without opening the PostgreSQL write connection. A write connection failure
does not block viewing or completing the form. Submission failures keep the
entered details on the review page so the applicant can retry. Failed write
connections are logged with component database_connection and only an approved
error code, including standard DNS,
connection and TLS failures. Transaction errors use database_transaction.
Error messages, connection strings and passwords are not logged. Saving still
requires a working, verified TLS connection; certificate verification is never
disabled to restore access to the form.
