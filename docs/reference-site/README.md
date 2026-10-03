# SNCS source reference package

Reviewed on 2 October 2026 for PB-10 design and PB-11 preparation. These files
are development references; the frontend does not import them and nothing here
has been uploaded to Supabase or published as resource data.

- content-inventory.json: normalized facts, draft copy, event dates, contact
  channels, admissions groups, sources, and unresolved content questions.
- resources-manifest.json: exact PDF provenance, byte sizes, page counts,
  SHA-256 checksums, availability, and publication defaults.
- *-sources.json / tlc-source.json: captured live page text and links. Source
  copy is retained for the implementation session; it is not client approval or
  evidence that every old policy/procedure is current. Payment account details
  were excluded because they are unnecessary for this scope.
- calendar-source.json: October 2026 public calendar snapshot and its review
  coverage. It does not claim every future month is empty.
- forms/: two unmodified blank PDFs from the registration TLC page. These are
  references outside the app's public directory. All three pages were reviewed.

Use the normalized inventory first. Publication-date fields are null when the
source does not provide a date. Date-only events must not acquire invented times
or venues. All migration candidates remain draft/private until reviewed.

The main TLC menu links are broken, while the registration TLC page has two
accessible files. Confirm the intended versions with the moderator before
publishing downloads. The third SHS withdrawal file is not available locally.

Alumni was excluded from new collection/migration; preserve its existing UI and
assets until the client's discussion is resolved.
