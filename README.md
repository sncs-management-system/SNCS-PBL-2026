# SNCS Management System

This repository contains the Sto. Niño Catholic School (SNCS) management-system
project. This branch adds **PB-12: Online Enrollment Application** to the existing
PB-10 public website, with Pre-school, Elementary, JHS, and SHS application forms, an Express API, Turnstile, and Supabase persistence.

Start with [PB-12 setup and field mapping](docs/pb12-enrollment.md) to configure
the team's existing Supabase project and Turnstile keys. The application route is
`/enrollment`; live submission requires the API and database migration.

## Technology alignment

The project follows the architecture proposed in the SSYSADD1 paper:

- **Frontend:** Vue 3, Vue Router, TypeScript, and Vite
- **Backend:** Node.js with Express (PB-12 enrollment API)
- **Data and files:** Supabase PostgreSQL and private Storage (PB-12)
- **Authentication (future backlog):** Express-managed authentication and sessions
- **Scheduling (future backlog):** a separate Python service using Google OR-Tools

Staff authentication, Registrar screens, CMS, and scheduling remain outside PB-12.

## PB-10 foundation

- Responsive Home, About, Campus, News, Events, and Contact routes
- School history, mission, vision, values, facilities, and alumni sections
- SNCS red-and-gold visual identity derived from the existing website
- Typed, CMS-ready content models with publication-status and visibility controls
- Public-content selector tests that prevent draft/private records from rendering
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

## Content integration boundary

Temporary content lives under `src/lib/content`. Components consume typed selector
functions rather than importing raw records directly. The future CMS adapter can
replace this data source while preserving the page components and enforcing the
same `published` and `public` visibility contract.

## Asset note

Images under `public/images/source-site` were obtained from the existing public
SNCS website for redesign prototyping. See
[`docs/brand-and-asset-audit.md`](docs/brand-and-asset-audit.md) for provenance and
replacement guidance. Client-approved original files should replace them before
production release.
