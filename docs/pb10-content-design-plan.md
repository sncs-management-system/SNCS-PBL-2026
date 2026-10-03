# PB-10 content and design plan

Prepared 2 October 2026 from the live SNCS website and the revised sprint backlog.
Implemented locally on `feat/pb10-content-completion`; see the
[verification report](verification/pb10-verification.md) for the delivered scope
and checks. Production deployment and client acceptance remain pending. Source
observations and design decisions are distinguished below. Alumni is on hold:
preserve the existing section and assets without
adding, removing, or migrating alumni content.

## Scope and completion boundary

PB-10 / US-01 requires public access without login, public/published content only,
and access to announcements, events, and institutional information within three
clicks from the main navigation. It does not require a copy of every historical
page on the old website. The existing homepage, About, Campus, News, Events, and
Contact routes are a usable foundation. Complete their content and behavior
before implementing PB-11 downloads.

Admissions guidance is a recommended public institutional page supporting PB-12,
not an additional acceptance criterion invented for PB-10. Coordinate its links
with the teammate implementing enrollment. PB-11 / US-03 covers categorized PDF
resources, public/published filtering, title/category/file size, and a working
download. PDF preview and search are post-MVP. PB-01's staff CMS screens belong
to the later CMS sprint; CMS readiness now means structured content and an adapter
boundary, not completing the administrator interface.

Backlog: [revised product backlog](https://docs.google.com/document/d/1-gUKxR0GziOLngENmimQdxlxfHfraMyc/edit).

## What to keep and what to defer

| Section | Priority | Reason and content boundary |
| --- | --- | --- |
| Home | PB-10 | School identity, useful shortcuts, a short public announcement feed, and genuine upcoming dates. |
| About | PB-10 | Short history, updated vision/mission, six official core values, separate school motto. |
| Campus and student services | PB-10 | Reuse the three existing facility photos; provide useful office/service links without reproducing every room/gallery. |
| News and advisories | PB-10 | Real official updates, summaries, and readable complete text when a summary is insufficient. |
| Events and calendar | PB-10 | Date-led list with upcoming and past sections. Keep the official calendar as a secondary link. |
| Contact | PB-10 | Full address, hours, and department-specific contacts; prioritize Registrar, Principal, and Finance. |
| Admissions | Recommended alongside PB-10 | Requirements organized by applicant group; clearly marked school-year information and a path to PB-12. |
| Resources / TLC forms | Prepare now; implement PB-11 next | Two original PDF reference files saved; a third listed file is inaccessible. No dummy categories/documents. |
| Detailed policies, clubs, directories, memberships, prayers/hymn | Later content batches | Consolidate into About/student-life pages when needed and reviewed, rather than duplicating the old navigation tree. |
| Photo/video archives and daily reflections | Defer expansion | Optional curated links/entries later; do not import every historical album or store external videos. |
| Alumni | On hold | Client decision pending. Existing section stays untouched. |
| Employees Log | Separate internal scope | Do not expose or migrate into the public-site MVP. |
| Payments/fees | Informational link only after review | Source fee page is labeled 2025–2026; old enrollment procedures use a different registrar email. Do not publish these as current-year instructions. |

## Navigation and click budget

Keep the current flat PB-10 menu: **About, Campus, News, Events, Contact**, with the
school brand linking Home. Add **Admissions** when its reviewed guidance is ready
and **Resources** when PB-11 works. Seven text destinations are manageable with
the short labels: use the mobile menu before the desktop header becomes crowded.
Do not introduce a nested About → School → Mission hierarchy. A future combined
Updates hub is optional; it is unnecessary to meet this sprint's click objective.

The table counts deliberate taps conservatively, including opening the mobile
menu. Reading/scrolling is not a click. Filters are optional, and required
information must not depend on a filter, modal, or login.

| Task | Desktop path | Mobile path | Maximum |
| --- | --- | --- | --- |
| Read an announcement | News → article (if needed) | Menu → News → article | 3 |
| See an event's complete details | Events → event (if needed) | Menu → Events → event | 3 |
| Read mission/vision or core values | About → optional jump link | Menu → About → optional jump link | 3 |
| See a facility or service | Campus, with details already on page | Menu → Campus | 2 |
| Contact Registrar | Contact → email/message | Menu → Contact → email/message | 3 |
| Read admission requirements | Admissions → applicant group | Menu → Admissions → applicant group | 3 |
| Download a TLC PDF (PB-11) | Resources → Download PDF | Menu → Resources → Download PDF | 3 |

For PB-11, display all approved PDFs immediately in category groups. Do not make
the user select TLC Forms before seeing the files. A filter can be added later
without changing the default listing. Home shortcuts should go straight to the
task destination, rather than an intermediate landing page.

## Shared visual design

Retain the existing seal, red/gold identity, cream backgrounds, and current type
system. Use deep red for readable headings/actions and gold as an accent, not
small text on white. Keep one page title, a short introduction, and clear section
headings. Reuse PageHero, SectionHeading, cards, and the existing spacing system.

Use a single-column layout on phones and two/three columns only when text remains
readable. Links/buttons need clear labels, visible keyboard focus, and comfortable
touch targets. Prefer ordinary links and page anchors over carousels/popups.
Every route needs a useful empty state; remote collections additionally need
loading, error, and retry states. Technical sprint/CMS descriptions should stay
in project documentation, not visitor-facing copy.

### Home layout

```text
Seal + school name                         Main navigation / Menu
Short school introduction + existing campus image
[Admissions guidance] [Forms, once PB-11 is ready] [Contact]
Office-hours notice (small, useful, CMS-controlled)
Latest announcements (up to 3)             Upcoming events (up to 3)
School identity: mission / vision / motto (short previews)
Campus preview: existing three facilities → Campus
Existing Alumni content: leave untouched
Address + useful contact links + footer
```

Keep the hero compact enough that useful actions appear early on phones. Do not
add a dead Download or Apply button. Before PB-11, omit the Forms shortcut;
before PB-12 opens, use Admissions guidance rather than claiming enrollment is
open. Existing Alumni placement/content is outside this implementation batch.

### About layout

```text
Page title + short introduction
Jump links: History | Mission and vision | Core values
Short founding story + small timeline (1989 registration / 1994 relocation)
Vision card + Mission commitments list
Six core values in a compact grid
School motto in its own strip: Simplicity, Humility, Competence
[Explore campus] [Student services]
```

The live vision is more recent than the cached search result and current seed
copy. Use the live source in the reference inventory. The six core values are
Excellence, Preferential Option for the Poor, Faith in God, Christian Discipleship,
Responsible Stewardship, and Respect for Human Dignity. The three-word motto
must not replace this list. Avoid adding unverified milestone dates or staff
names/roles from stale directories.

### Campus and student services layout

```text
Page title + introduction
San Lorenzo Ruiz: one existing image + useful classroom/laboratory summary
Pedro Calungsod: one existing image + office/library/gym summary
Library: one existing image + reading/research summary + library website
Student service tiles: Registrar | Guidance | Clinic | Library
Existing Alumni block: leave untouched
```

Keep facility descriptions factual: the official building pages identify the
rooms/offices, while the current seeds use generic marketing descriptions.
Service tiles link directly to verified office channels. Do not create health,
counseling, or student-record submission forms in PB-10. Curated existing photos
are enough for this batch; avoid an automatically growing gallery.

### News layout

```text
Page title + brief introduction
Newest approved announcements first
Each entry: category | actual publication date when known | title | summary
Complete short advisory inline; longer entry → /news/:slug
Empty state when no approved announcements are available
```

Replace the two unverified seed stories with reviewed real source updates (for
example office transactions or the learning-platform announcement). An event
date is not a publication date. The source does not provide publication dates
for its homepage notices: retain null until the moderator confirms a date or
publish using an accurately labeled migration publication date. Avoid fake
timestamps presented as the original announcement date.

### Events layout

```text
Page title + [Open official school calendar]
Upcoming: date/date range | title | details/location if supplied
If none: “No upcoming events have been announced.”
Past events: the verified September 2026 school activities
```

The observed September dates are past as of this review. Do not present them as
upcoming or replace them with invented Family Day/Academic Showcase dates.
Store start/end dates and time precision separately; source notices contain
dates, not event start times or venues. Show a range for multi-day activities.
Keep an accessible date list as the primary view; an embedded calendar must not
be required for finding an event. Maintain Asia/Manila date formatting.

The linked public calendar's October 2026 month view was also checked: it shows
no October event dates, with the September 28–30 culminating activity appearing
in preceding-month cells. This is a dated observation, not proof that every
future month is empty. Refresh official upcoming content during implementation.

### Contact layout

```text
Full school address + hours
Registrar / admissions: email + Messenger
Principal / general inquiries: phones + email
Finance: phone + email
Secondary services: Guidance | Clinic | Library
Optional directions link using the verified school location
```

Use department labels, mailto links, and normalized phone links. Do not treat the
general homepage email as the Registrar email. The source currently conflicts
with the older procedures page; use the department Contacts listing for the
draft and record the conflict for moderator review. Do not add an inquiry form
that appears functional without a submission flow.

### Admissions guidance layout

```text
Introduction + school-year/status notice
Applicant group selector (one click)
Checklist: Returning | Preschool | Grade 1 | Grade 7 | SHS | Transfer/returnee
TLC information + direct Resources link when downloads are live
Next step: PB-12 application, when open; otherwise contact Registrar
```

Show one complete checklist after selecting a group; avoid separate grade-level
navigation layers. Preserve optional/conditional distinctions in the source
(for example married parents' certificate is optional; ESC/NCAE apply only to
some applicants). Keep physical document requirements separate from PB-12's
digital upload rules. Enrollment eligibility, fee amounts, school-year openings,
and the outdated procedures email need moderator confirmation before release.
Existing public Google Forms are references; redirecting to them does not
complete PB-12's own enrollment workflow.

### Resources layout, reserved for PB-11

```text
Resources
“Official forms to download, print, and complete.”
TLC Forms
Title                         Category | PDF | size       [Download PDF]
Grade 7 application            TLC Forms | PDF | 3.92 MB  [Download PDF]
Junior High transfer form      TLC Forms | PDF | 5.08 MB  [Download PDF]
Unavailable/unapproved files are excluded from the public listing
```

The size values above are the actual reference-file bytes formatted with decimal
MB. Public listing depends on moderator-selected file versions and successful
PB-11 implementation. The SHS withdrawal entry remains a private preparation
record with no size/file until its original is supplied. No preview modal is
needed for US-03. See [PB-11 preparation](pb11-preparation.md).

## CMS readiness

The frontend already has typed models and public/published selectors. Retain
that boundary and replace the seed provider with an API adapter later; views
should not parse arbitrary Supabase rows or hardcode editorial content.

| Editable subject | Existing destination / proposed representation | Fields needed |
| --- | --- | --- |
| Announcements | cms_content, content_type=announcement | title, slug, summary/body, category, status, visibility, published_at |
| Events | cms_content, content_type=event | title, slug, body, start/end date, optional time/venue, status, visibility |
| About/institutional text | cms_content, content_type=page | stable slug, section heading/body, status, visibility |
| Facilities/student services | cms_content page sections initially | stable section IDs, title/body, curated image path/alt, service URLs |
| Contacts and admissions | cms_content page sections initially | structured office channels; applicant-group checklists and school-year label |
| Downloadable PDFs | resources + Storage | title, category, storage_path, file_size_bytes, status, visibility |
| Navigation, page grids, formatting, branding | Vue components/design tokens | code-owned presentation; do not build a general layout editor |

**Schema gaps:** the observed cms_content table has title/slug/body/content_type,
event_date, status, staff audit IDs, published_at, and updated_at. It does not yet
have all the frontend fields above, such as visibility, announcement category,
event range, or image metadata. The resources table likewise has no visibility
field. Treat this table as a mapping plan, not a statement that the database is
already ready. Decide with the CMS implementer whether body is structured JSON
or plain text with explicit additional columns. Do not independently create
competing schemas or assume the existing body supports JSON.

At minimum, maintain status=draft/published/archived and visibility=public/private,
stable IDs/slugs, and timestamps. Frontend filtering is a second check; when
database reads are enabled, RLS/API authorization must also prevent private/draft
content from being returned to anonymous visitors. Existing custom staff-user
tables do not automatically imply Supabase Auth is the application's CMS login.

## Implementation order and verification

1. Complete the PB-10 content pass: updated identity, separate motto/core values,
   real notices, verified event dates, full office contacts, factual facilities.
2. Extend the model only where the real content requires it: announcement body,
   event date ranges/unknown time, service/office records and admission groups.
   Reuse shared cards and keep seeds separate from views.
3. Add compact About jump links, complete News/Event reading behavior, and empty
   states. Keep existing routes and Alumni unchanged. Add admissions guidance
   without changing the teammate's PB-12 work.
4. Integrate the existing Vercel SPA rewrite fix through the normal review flow
   and deploy the approved PB-10 change. Production /news reload previously
   returned 404; a local vercel.json is not evidence production is fixed.
5. Verify anonymous access, private/draft exclusion, real content, route reloads,
   phone layout, keyboard navigation, readable contrast, and click paths above.
   Existing selector tests should still pass; add checks for any new date/range
   or authorization behavior, rather than tests that mirror static copy.
6. Then implement PB-11 from its separate preparation checklist. Confirm the
   client-selected PDF versions before publishing reference copies.

Evidence of completion should include a deployed URL, screenshots at desktop
and mobile sizes, a small task/click table, and proof hidden content stays hidden.
Do not describe preparation files or CMS-ready seeds as completed CMS functionality.

## Source package

- [Reviewed content inventory](reference-site/content-inventory.json)
- [PB-11 PDF manifest](reference-site/resources-manifest.json)
- Reference-site JSON files preserve observed source text/links for the next
  implementation session; they are documentation and are not loaded by the app.
- Primary sources: [Home](https://www.sncstaguig.com/home),
  [About](https://www.sncstaguig.com/about),
  [Contacts](https://www.sncstaguig.com/contacts),
  [Registration](https://www.sncstaguig.com/registration), and the exact page URLs
  recorded per inventory item. Prefer live pages over stale cached extracts.
