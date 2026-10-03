# SNCS Management System

This repository contains the Sto. Niño Catholic School (SNCS) management-system
project. This branch adds **PB-12: Online Enrollment Application** to the existing
PB-10 public website, with Pre-school, Elementary, JHS, and SHS application forms, an Express API, Turnstile, and Supabase persistence.

Start with [the enrollment setup guide](docs/enrollment-setup.md) for environment
variables, Supabase and Turnstile credentials, local development, and Vercel
branch previews. See [PB-12 implementation and field mapping](docs/pb12-enrollment.md)
for the feature details. The application route is `/enrollment`; live submission
requires the API and a working connection to the existing team database.
No database migration is required.

## Technology alignment

The project follows the architecture proposed in the SSYSADD1 paper:

- **Frontend:** Vue 3, Vue Router, TypeScript, and Vite
- **Backend:** Node.js with Express (PB-12 enrollment API)
- **Data:** Existing Supabase PostgreSQL tables (PB-12); document uploads are disabled
- **Authentication (future backlog):** Express-managed authentication and sessions
- **Scheduling (future backlog):** a separate Python service using Google OR-Tools

Staff authentication, Registrar screens, CMS, and scheduling remain outside PB-12.

## PB-10 public website

- Responsive Home, About, Campus, News, Events, Contact, and Admissions routes
- Sourced school history, updated mission/vision, six core values, and separate motto
- Announcement details, date-range events with upcoming/past separation, and office contacts
- Optional announcement images with descriptive alternative text and full-size detail views
- Six applicant checklists and reusable student-service links
- Existing alumni sections preserved pending the client's decision
- SNCS red-and-gold visual identity derived from the existing website
- Typed, CMS-ready content models with publication-status and visibility controls
- Public-content selector tests that exclude draft, private, and archived records
- Philippine calendar-date tests for ongoing events and date ranges
- Publicly available campus images retained as temporary source-site assets

## Local development

Use Node.js 22.12+ and pnpm.

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The Vite development server prints the local URL after it starts. For production,
configure the host to serve `index.html` as the fallback for Vue Router paths.

## Supabase setup for PB-11

Vercel and local environment configuration use `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`. Copy `.env.example` to `.env.local` for a new
checkout and use the Supabase project's public configuration values.

Run `pnpm check:supabase` to check API/key connectivity without reading records
or modifying data. The frontend resource adapter and RLS read policy are still
pending. See [the setup notes](docs/supabase-setup.md) for current project links,
schema observations, and the PB-11 checklist.

## Content integration boundary

The implemented content batch follows the
[PB-10 content and design plan](docs/pb10-content-design-plan.md), with sources,
page layouts, CMS mapping, and a three-click task checklist. Local checks and
screenshots are recorded in [PB-10 verification](docs/verification/pb10-verification.md). See
[PB-11 preparation](docs/pb11-preparation.md) for the verified TLC reference PDFs
and pending download implementation. Alumni remains on hold pending the client
decision; its existing markup and assets are unchanged.

Temporary content lives under `src/lib/content`. Components consume typed selector
functions rather than importing raw records directly. The future CMS adapter can
replace this data source while preserving the page components and enforcing the
same `published` and `public` visibility contract. This frontend filter is not a
database access policy: a future backend must return only public records and
enforce authorization before sending data to the browser. CMS editing screens,
Supabase content reads, and downloads are still pending. PB-12 adds
enrollment submission; live use requires the server configuration described above.

## Asset note

Images under `public/images/source-site` were obtained from the existing public
SNCS website for redesign prototyping. See
[`docs/brand-and-asset-audit.md`](docs/brand-and-asset-audit.md) for provenance and
replacement guidance. Client-approved original files should replace them before
production release.
