# PB-10 implementation verification

Verified locally on 2 October 2026, branch `feat/pb10-content-completion`.
This is a frontend implementation using the source inventory collected for the
[content plan](../pb10-content-design-plan.md). The checks below were completed
locally before the branch was submitted for review. Production verification
and client acceptance remain pending.

## Delivered behavior

- Home places useful news and upcoming dates before the longer school introduction,
  with admissions/contact shortcuts and office hours.
- About includes sourced history, updated mission/vision, six core values, and
  a separate motto. Jump links account for the fixed header.
- Campus and Contact share student-service links. Contact provides the full
  school address, office hours, and Registrar, Principal, Finance, and Library channels.
- News lists two sourced public notices with readable detail routes. Missing or
  unpublished announcements show an unavailable state without their content.
- Events presents genuine date-only notices, preserves multi-day ranges, and
  separates upcoming/ongoing activities from past events using the Philippine date.
  On the verification date, all seven September notices correctly appear under
  Past events, with an empty upcoming section and an official-calendar link.
- Admissions offers six applicant groups with a single checklist selected at a
  time, conditional-document notes, original-source links, and a Registrar shortcut.
  It provides guidance; enrollment submission is the separate PB-12 feature.
- Unknown routes provide a recovery page. Both existing Alumni blocks and their
  image assets are preserved.

## Checks and evidence

| Check | Result |
| --- | --- |
| `pnpm lint` | Passed, no warnings on the final run. |
| `pnpm build` | Passed, including `vue-tsc --noEmit` and the Vite production bundle. |
| `pnpm test` | Passed: 4 tests across visibility filtering and calendar-date behavior. |
| `git diff --check` | Passed. |
| Public visitor flow | Local browser → main navigation → public seed selector → complete page content, without login. |
| Announcement details | Desktop News → office notice; direct reload succeeds. Mobile Menu → News → notice takes 3 taps. |
| Admissions | Mobile Menu → Admissions → Grade 7 takes 3 taps. All 6 group controls show the matching heading/checklist and exactly one selected control. |
| Institutional details | Mobile Menu → About → Core values takes 3 taps. Target lands below the header. |
| Keyboard | Skip-to-content focuses `main-content`; Enter activates applicant-group selection. Visible focus styles are present. |
| Responsive layout | No horizontal overflow observed at 320px on About, Campus, Contact, Events, the announcement detail, or Admissions; 375px Admissions and 861px/1920px Home also fit. |
| Runtime | No app warnings/errors in the inspected browser log; unrelated browser-extension messages were excluded. |
| Alumni preservation | Home and Campus Alumni blocks compared with starting HEAD and matched; no original image files changed. |

Screenshots: [desktop Home](pb10-home-desktop.jpg),
[desktop Admissions](pb10-admissions-desktop.jpg),
[mobile Admissions](pb10-admissions-mobile.jpg).

## Announcement-image and hero follow-up

Updated on 2 October 2026 after design feedback:

- Removed the floating seal/motto card from Home and its unused responsive styles.
  The school motto remains on About. Reduced the hero's extra space formerly
  reserved for that card.
- Added an optional `AnnouncementImage` record containing `src`, required `alt`,
  optional dimensions, and an optional image caption. The announcement body is
  still readable text, separate from the image.
- Public cards display a linked thumbnail after the summary. Detail pages show
  the body, complete image, and image caption. Images preserve their content
  without cropping; failed loads show a text fallback.
- The GENYO notice uses the graphic shared on the school's official homepage.
  The office-hours notice has no image and still renders without an empty image
  area. Provenance is recorded in the asset audit. The graphic contains an
  enrollment promotion; its caption directs visitors to confirm current
  enrollment availability with the Registrar.
- Confirmed the thumbnail opens its announcement, the 1280 × 632 image loads,
  and its full detail view preserves that aspect ratio. Home, News, and the
  detail page fit at 320px without horizontal overflow. Mobile navigation to
  the image announcement takes three taps. No new app console errors appeared
  in the checked navigation.
- Final lint, TypeScript/production build, and all four existing tests passed.
  Preview remains on `http://127.0.0.1:5173/`.

Latest screenshots: [Home without the floating card](home-without-motto-card.png),
[desktop image announcement](announcement-image-desktop.png),
[mobile image announcement](announcement-image-mobile.png).

This prepares the public image presentation. The admin caption editor, file
upload, preview/draft/publish controls, Storage integration, and authorization
remain work for the CMS sprint.

## Content and integration boundary

Structured records live in `src/lib/content`, exposed through typed public-content
getters. Announcement paragraphs, date ranges, school profile, contact offices,
student services, and admissions requirements have explicit fields suitable for
a future CMS adapter. Only `published`/`public` items render. This is UI filtering,
not database authorization; private CMS data must be excluded by the future API
and protected through its authorization/RLS policies.

PB-01 staff editing screens, PB-11 Supabase resources/visibility/RLS/downloads,
and PB-12 form submission remain separate work. No database, Storage, Vercel
configuration, or live website data was modified in this task. Supabase setup
and PB-11 preparation files from earlier work remain in the working tree.

The branch inherits the existing Vercel SPA fallback configuration. Local reload
verification covers Vite routing; deployed Vercel deep links must be rechecked
after the changes are pushed and deployed. Current admissions rules and links
should receive the school's content review before production release.
