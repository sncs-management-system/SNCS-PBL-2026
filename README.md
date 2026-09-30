# SNCS Management System

The official project repository for the Sto. Niño Catholic School management system.

## Sprint 1 — Public website MVP

The current implementation covers the PB-10 / US-01 public-content foundation:

- Public homepage and institutional subpages without authentication
- Direct access to announcements, events, campus facilities, alumni, and contact information
- CMS-ready content models with explicit publication status and visibility rules
- Existing SNCS identity preserved through the official seal, red-and-gold palette, and public campus imagery
- Responsive, accessible navigation and page layouts
- Automated coverage for public-content filtering

Resources, enrollment, search, authentication, and CMS administration are intentionally outside this first task and will be delivered through their assigned backlog items.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
