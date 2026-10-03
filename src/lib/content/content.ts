import type { Announcement, Facility, InstitutionalSection, SchoolEvent, SchoolProfile } from "./model";
import { getPublishedPublicItems } from "./selectors";

const site = "https://www.sncstaguig.com";
const publicContent = { status: "published", visibility: "public", publishedAt: null } as const;
// The source does not supply publication dates. Do not substitute event or import dates.
const announcements: Announcement[] = [
  {
    ...publicContent, id: "office-transactions", slug: "office-transactions",
    title: "School office transactions", category: "School Advisory",
    summary: "School office transactions are available Monday to Friday, from 8:00 AM to 5:00 PM.",
    body: ["The school welcomes office transactions from Monday to Friday, 8:00 AM to 5:00 PM.", "For admissions and school records, contact the Registrar. For payment questions, contact the Finance Office."],
    sourceUrl: `${site}/home`,
  },
  {
    ...publicContent, id: "genyo-2026-2027", slug: "genyo-learning-platform-2026-2027",
    title: "GENYO learning platform for SY 2026–2027", category: "Campus News",
    summary: "SNCS announces a GENYO 5G Systems learning-platform upgrade for the school community.",
    body: ["For school year 2026–2027, SNCS has announced an upgrade to the GENYO 5G Systems Learning Platform to support online distance learning.", "Contact the school for information about learning-platform access and enrollment."],
    image: {
      src: "/images/source-site/genyo-2026-2027.png",
      alt: "SNCS partners with GENYO e-Learning and DIWA 5G Systems to support creativity, progress monitoring, secure learning, independence, and community values.",
      width: 1280,
      height: 632,
      caption: "Contact the Registrar to confirm current enrollment availability.",
    },
    sourceUrl: `${site}/home`,
  },
  {
    id: "internal-editorial-draft", slug: "internal-editorial-draft",
    title: "Internal editorial draft", summary: "Unpublished editorial content.", body: [],
    category: "School Advisory", status: "draft", visibility: "private", publishedAt: null,
  },
];

const eventNotices = [
  ["wellness-break", "Wellness break: intermediate to high school", "2026-09-10", "2026-09-15"],
  ["employees-wellness-break", "Employees wellness break", "2026-09-14", "2026-09-15"],
  ["cl-science-math-launch", "Launching of CL, Science, and Math Week", "2026-09-21", "2026-09-24"],
  ["bsp-gsp-investiture", "BSP and GSP investiture", "2026-09-25", "2026-09-25"],
  ["first-term-card-day", "First Term Card Day and Parents’ Faith Formation", "2026-09-26", "2026-09-26"],
  ["kainang-pamilya", "Kainang Pamilya Mahalaga Day", "2026-09-28", "2026-09-28"],
  ["cl-science-math-culminating", "Culminating of CL, Science, and Math Week", "2026-09-28", "2026-09-30"],
] as const;
const events: SchoolEvent[] = eventNotices.map(([slug, title, startDate, endDate]) => ({
  ...publicContent, id: slug, slug, title, startDate, endDate, location: null,
  summary: "Published in the school’s September 2026 activity notices.", sourceUrl: `${site}/home`,
}));

const facilities: Facility[] = [
  {
    ...publicContent, id: "facility-001", slug: "san-lorenzo-ruiz-building",
    name: "San Lorenzo Ruiz Building",
    description: "Classrooms from nursery through senior high school, administrative offices, computer laboratories, and science laboratories.",
    imageSrc: "/images/source-site/san-lorenzo-ruiz-building.jpg",
    imageAlt: "San Lorenzo Ruiz Building on the SNCS campus", accent: "red",
    sourceUrl: `${site}/about/school-facilities-and-amenities/school-buildings/san-lorenzo-ruiz-bldg`,
  },
  {
    ...publicContent, id: "facility-002", slug: "pedro-calungsod-building",
    name: "Pedro Calungsod Building",
    description: "Home to the Registrar and accounting offices, student services, TLE and ICT rooms, the library, clinic, and gymnasium.",
    imageSrc: "/images/source-site/pedro-calungsod-building.jpg",
    imageAlt: "Pedro Calungsod Building on the SNCS campus", accent: "gold",
    sourceUrl: `${site}/about/school-facilities-and-amenities/school-buildings/pedro-calungsod`,
  },
  {
    ...publicContent, id: "facility-003", slug: "school-library",
    name: "School Library", description: "A space for reading, research, and assignments, supported by the school’s reading programs and online library resources.",
    imageSrc: "/images/source-site/library.jpg",
    imageAlt: "Reading tables and bookshelves inside the SNCS library", accent: "green",
    sourceUrl: `${site}/about/school-facilities-and-amenities/library`,
  },
];

const institutionalSections: InstitutionalSection[] = [
  {
    ...publicContent, id: "institution-002", slug: "vision", eyebrow: "Our vision",
    title: "In joyful mission with home and parish",
    body: "A relevant, transformative, future-driven Diocesan Catholic School System in joyful mission with home and parish.",
    sourceUrl: `${site}/about/sto-ni%C3%B1o-catholic-school/vision-and-mission`,
  },
  {
    ...publicContent, id: "institution-001", slug: "mission", eyebrow: "Our mission",
    title: "A culture of excellence",
    body: "We are wholeheartedly committed to a culture of excellence through education, faith, service, and partnership.",
    commitments: [
      "Curriculum, programs, and services attuned to 21st-century education.",
      "Collaboration that sustains the school’s resources.",
      "Catholic school standards and Filipino values put into practice.",
      "Care for creation and service to people experiencing poverty.",
      "Digitally fluent, ethical, and responsible Catholic citizenship.",
      "Formation of families and active parish involvement.",
    ],
    sourceUrl: `${site}/about/sto-ni%C3%B1o-catholic-school/vision-and-mission`,
  },
];

const profiles: SchoolProfile[] = [{
  ...publicContent, id: "school-profile", slug: "school-profile",
  history: [
    "Sto. Niño Catholic School began through the Sto. Niño Parish community, led by Rev. Fr. Wilfredo “Charlie” Jundis. Initially known as Sto. Niño Learning Center, it welcomed 28 kindergarten pupils.",
    "The school registered as Sto. Niño Catholic School, Inc. in 1989 and moved to its present Sampaloc Street location in 1994. Its Catholic identity continues to connect learning, Christian formation, family, and parish life.",
  ],
  milestones: [{ year: "1988", title: "A beginning with 28 kindergarten pupils" }, { year: "1989", title: "Registered as Sto. Niño Catholic School, Inc." }, { year: "1994", title: "Moved to Sampaloc Street" }],
  coreValues: ["Excellence", "Preferential Option for the Poor", "Faith in God", "Christian Discipleship", "Responsible Stewardship", "Respect for Human Dignity"],
  motto: "Simplicity. Humility. Competence.", sourceUrl: `${site}/about/sto-ni%C3%B1o-catholic-school/school-history`,
}];

export const getPublicAnnouncements = () => getPublishedPublicItems(announcements);
export const getPublicEvents = () => getPublishedPublicItems(events);
export const getPublicFacilities = () => getPublishedPublicItems(facilities);
export const getPublicInstitutionalSections = () => getPublishedPublicItems(institutionalSections);
export const getPublicSchoolProfile = () => getPublishedPublicItems(profiles)[0];
export const officialCalendarUrl = "https://www.google.com/calendar/embed?color=%239fe1e7&src=sncstaguig2020@gmail.com";
