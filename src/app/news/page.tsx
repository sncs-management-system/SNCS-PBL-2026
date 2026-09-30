import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPublicAnnouncements } from "@/lib/content/content";

export const metadata: Metadata = { title: "News" };

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function NewsPage() {
  const announcements = getPublicAnnouncements();

  return (
    <>
      <PageHero
        eyebrow="News and announcements"
        title="What is happening at SNCS"
        description="Official public updates from the Sto. Niño Catholic School community."
      />
      <section className="section">
        <div className="container content-list">
          {announcements.map((announcement) => (
            <article className="content-card" key={announcement.id}>
              <p className="meta">
                {announcement.category} · {announcement.publishedAt
                  ? dateFormatter.format(new Date(announcement.publishedAt))
                  : ""}
              </p>
              <h2>{announcement.title}</h2>
              <p>{announcement.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
