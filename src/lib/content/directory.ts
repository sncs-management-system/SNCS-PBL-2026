import type { ContactOffice, SchoolContactInformation, StudentService } from "./model";
import { getPublishedPublicItems } from "./selectors";

const publicContent = { status: "published", visibility: "public", publishedAt: null } as const;
const sourceUrl = "https://www.sncstaguig.com/contacts";
const schoolInformation: SchoolContactInformation[] = [{
  ...publicContent, id: "school-contact-information", slug: "school-contact-information", sourceUrl,
  address: "Sampaloc St., Zone 1, North Signal Village, Taguig City",
  officeHours: "Monday to Friday, 8:00 AM–5:00 PM",
}];
const offices: ContactOffice[] = [
  {
    ...publicContent, id: "registrar", slug: "registrar", name: "Registrar / Admissions", sourceUrl,
    description: "Enrollment guidance, admission requirements, school records, and document requests.",
    channels: [{ label: "officeoftheregistrar@sncstaguig.edu.ph", href: "mailto:officeoftheregistrar@sncstaguig.edu.ph" }, { label: "Message the Registrar", href: "https://www.facebook.com/messages/t/1626374049", external: true }],
  },
  {
    ...publicContent, id: "principal", slug: "principal", name: "Office of the Principal", sourceUrl,
    description: "General school inquiries and academic concerns.",
    channels: [{ label: "(02) 8837-9702", href: "tel:+63288379702" }, { label: "(02) 8295-5861", href: "tel:+63282955861" }, { label: "sncsofficeoftheprincipal@gmail.com", href: "mailto:sncsofficeoftheprincipal@gmail.com" }, { label: "sncs_tagig@yahoo.com", href: "mailto:sncs_tagig@yahoo.com" }],
  },
  {
    ...publicContent, id: "finance", slug: "finance", name: "Finance Office", sourceUrl,
    description: "Current school fees, accounting, and payment inquiries.",
    channels: [{ label: "(02) 8866-0281", href: "tel:+63288660281" }, { label: "sncsfinance@gmail.com", href: "mailto:sncsfinance@gmail.com" }],
  },
  {
    ...publicContent, id: "library", slug: "library", name: "School Library", sourceUrl,
    description: "Library services, research, and reading resources.",
    channels: [{ label: "(02) 7919-5211", href: "tel:+63279195211" }, { label: "Visit the library website", href: "https://library.sncstaguig.edu.ph/", external: true }],
  },
];
const services: StudentService[] = [
  { ...publicContent, id: "registrar-service", slug: "registrar", title: "Registrar", description: "Ask about admission requirements and school records.", channel: { label: "Email the Registrar", href: "mailto:officeoftheregistrar@sncstaguig.edu.ph" }, sourceUrl },
  { ...publicContent, id: "guidance-service", slug: "guidance", title: "Guidance and counseling", description: "Connect with the Guidance Office for student support.", channel: { label: "Message Guidance", href: "https://www.messenger.com/t/100063541501667", external: true }, sourceUrl: "https://www.sncstaguig.com/about/student-services" },
  { ...publicContent, id: "clinic-service", slug: "clinic", title: "School Clinic", description: "Find the school’s health-service information and contact channel.", channel: { label: "Visit the Clinic page", href: "https://www.facebook.com/SNCSClinic2019/", external: true }, sourceUrl: "https://www.sncstaguig.com/about/student-services" },
  { ...publicContent, id: "library-service", slug: "library", title: "Library", description: "Explore the school’s online library and reading resources.", channel: { label: "Visit the library website", href: "https://library.sncstaguig.edu.ph/", external: true }, sourceUrl: "https://www.sncstaguig.com/about/student-services" },
];
export const getPublicOffices = () => getPublishedPublicItems(offices);
export const getPublicStudentServices = () => getPublishedPublicItems(services);
export const getPublicSchoolContactInformation = () => getPublishedPublicItems(schoolInformation)[0];
