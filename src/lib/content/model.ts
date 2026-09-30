export type PublicationStatus = "draft" | "published" | "archived";
export type ContentVisibility = "public" | "private";

export interface PublishableContent {
  id: string;
  slug: string;
  status: PublicationStatus;
  visibility: ContentVisibility;
  publishedAt: string | null;
}

export interface Announcement extends PublishableContent {
  title: string;
  summary: string;
  category: "School Advisory" | "Campus News" | "Achievement";
}

export interface SchoolEvent extends PublishableContent {
  title: string;
  summary: string;
  startsAt: string;
  location: string;
}

export interface Facility extends PublishableContent {
  name: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  accent: "red" | "gold" | "green";
}

export interface InstitutionalSection extends PublishableContent {
  eyebrow: string;
  title: string;
  body: string;
}
