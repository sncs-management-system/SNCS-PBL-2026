import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPublicEvents } from "@/lib/content/content";

export const metadata: Metadata = { title: "Events" };

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function EventsPage() {
  const events = getPublicEvents();

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Come together as one school community"
        description="See upcoming public activities and important school dates."
      />
      <section className="section">
        <div className="container content-list">
          {events.map((event) => (
            <article className="content-card event-card" key={event.id}>
              <time dateTime={event.startsAt}>{dateFormatter.format(new Date(event.startsAt))}</time>
              <div>
                <p className="meta">{event.location}</p>
                <h2>{event.title}</h2>
                <p>{event.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
