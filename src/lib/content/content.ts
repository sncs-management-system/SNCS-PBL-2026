import type {
  Announcement,
  Facility,
  InstitutionalSection,
  SchoolEvent,
} from "./model";
import { getPublishedPublicItems } from "./selectors";

const announcements: Announcement[] = [
  {
    id: "announcement-001",
    slug: "welcome-to-the-sncs-public-portal",
    title: "Welcome to the SNCS public portal",
    summary:
      "A clearer, more accessible home for school announcements, activities, and institutional information.",
    category: "Campus News",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-29T08:00:00+08:00",
  },
  {
    id: "announcement-002",
    slug: "community-partnership-program",
    title: "Community partnership program",
    summary:
      "SNCS strengthens its commitment to service through student-led community initiatives.",
    category: "Campus News",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-25T08:00:00+08:00",
  },
  {
    id: "announcement-003",
    slug: "internal-editorial-draft",
    title: "Internal editorial draft",
    summary: "This record verifies that unpublished content never appears publicly.",
    category: "School Advisory",
    status: "draft",
    visibility: "private",
    publishedAt: null,
  },
];

const events: SchoolEvent[] = [
  {
    id: "event-001",
    slug: "family-day-2026",
    title: "SNCS Family Day",
    summary: "A day of fellowship, student performances, and community-building activities.",
    startsAt: "2026-10-17T08:00:00+08:00",
    location: "SNCS Main Campus",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-28T08:00:00+08:00",
  },
  {
    id: "event-002",
    slug: "academic-showcase-2026",
    title: "Academic Showcase",
    summary: "Learners present inquiry-based projects developed across grade levels.",
    startsAt: "2026-11-06T09:00:00+08:00",
    location: "School Activity Hall",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-27T08:00:00+08:00",
  },
];

const facilities: Facility[] = [
  {
    id: "facility-001",
    slug: "san-lorenzo-ruiz-building",
    name: "San Lorenzo Ruiz Building",
    description: "Learning spaces designed for focused instruction, collaboration, and growth.",
    imageSrc: "/images/source-site/san-lorenzo-ruiz-building.jpg",
    imageAlt: "San Lorenzo Ruiz Building on the SNCS campus",
    accent: "red",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-29T08:00:00+08:00",
  },
  {
    id: "facility-002",
    slug: "pedro-calungsod-building",
    name: "Pedro Calungsod Building",
    description: "A student-centered environment that supports holistic formation and discovery.",
    imageSrc: "/images/source-site/pedro-calungsod-building.jpg",
    imageAlt: "Pedro Calungsod Building on the SNCS campus",
    accent: "gold",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-29T08:00:00+08:00",
  },
  {
    id: "facility-003",
    slug: "school-library",
    name: "School Library",
    description: "A welcoming resource center for research, reading, and independent learning.",
    imageSrc: "/images/source-site/library.jpg",
    imageAlt: "Reading tables and bookshelves inside the SNCS library",
    accent: "green",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-29T08:00:00+08:00",
  },
];

const institutionalSections: InstitutionalSection[] = [
  {
    id: "institution-001",
    slug: "mission",
    eyebrow: "Our mission",
    title: "A culture of excellence, service, and stewardship",
    body:
      "We form learners, families, personnel, and partners in faith and mission through responsive education, care for creation, service to people experiencing poverty, parish participation, and responsible stewardship.",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-29T08:00:00+08:00",
  },
  {
    id: "institution-002",
    slug: "vision",
    eyebrow: "Our vision",
    title: "A relevant, transformative Catholic school community",
    body: "We envision a Catholic school community in joyful mission with home and parish.",
    status: "published",
    visibility: "public",
    publishedAt: "2026-09-29T08:00:00+08:00",
  },
];

export const getPublicAnnouncements = () => getPublishedPublicItems(announcements);
export const getPublicEvents = () => getPublishedPublicItems(events);
export const getPublicFacilities = () => getPublishedPublicItems(facilities);
export const getPublicInstitutionalSections = () =>
  getPublishedPublicItems(institutionalSections);
