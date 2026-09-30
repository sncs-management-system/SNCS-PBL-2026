import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import {
  getPublicAnnouncements,
  getPublicEvents,
  getPublicFacilities,
  getPublicInstitutionalSections,
} from "@/lib/content/content";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function Home() {
  const announcements = getPublicAnnouncements().slice(0, 2);
  const events = getPublicEvents().slice(0, 2);
  const facilities = getPublicFacilities();
  const institutionalSections = getPublicInstitutionalSections();

  return (
    <>
      <section className="hero">
        <Image
          className="hero-image"
          src="/images/source-site/campus-front.jpg"
          alt="Front entrance of Sto. Niño Catholic School"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow light">Faith · Excellence · Service</p>
            <h1>Learning with purpose. Growing with faith.</h1>
            <p className="hero-lead">
              Sto. Niño Catholic School forms confident, compassionate learners through
              meaningful education and a strong community.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/about">Discover SNCS</Link>
              <Link className="button secondary" href="/contact">Plan a visit</Link>
            </div>
          </div>
          <div className="hero-panel" aria-label="School identity">
            <Image src="/images/source-site/sncs-seal.png" alt="" width={160} height={160} />
            <p>Established 1988</p>
            <strong>Simple · Humble · Competent</strong>
          </div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="container split-intro">
          <SectionHeading
            eyebrow="Welcome to SNCS"
            title="A school community where every learner belongs"
          />
          <div className="intro-copy">
            <p>
              We nurture the whole person—mind, heart, and character—through Catholic
              formation, academic rigor, and opportunities to serve.
            </p>
            <Link className="text-link" href="/about">Read our story <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <SectionHeading
            eyebrow="Who we are"
            title="Guided by a clear mission and vision"
            description="Our institutional foundations shape each learning experience and community decision."
          />
          <div className="mission-grid">
            {institutionalSections.map((section) => (
              <article className="mission-card" key={section.id}>
                <p className="eyebrow">{section.eyebrow}</p>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title-row">
            <SectionHeading eyebrow="Our campus" title="Spaces that support learning" />
            <Link className="text-link" href="/campus">Explore the campus <span>→</span></Link>
          </div>
          <div className="facility-grid">
            {facilities.map((facility, index) => (
              <article className={`facility-card accent-${facility.accent}`} key={facility.id}>
                <div className="facility-card-image">
                  <Image
                    src={facility.imageSrc}
                    alt={facility.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                  />
                  <span className="facility-number">0{index + 1}</span>
                </div>
                <div>
                  <h3>{facility.name}</h3>
                  <p>{facility.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container updates-grid">
          <div>
            <SectionHeading eyebrow="School updates" title="Latest from SNCS" />
            <div className="stack-list">
              {announcements.map((announcement) => (
                <article className="update-row" key={announcement.id}>
                  <div>
                    <p className="meta">{announcement.category}</p>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.summary}</p>
                  </div>
                </article>
              ))}
            </div>
            <Link className="text-link light-link" href="/news">View all news <span>→</span></Link>
          </div>
          <aside className="events-panel">
            <p className="eyebrow">Upcoming events</p>
            {events.map((event) => (
              <article className="event-row" key={event.id}>
                <time dateTime={event.startsAt}>{dateFormatter.format(new Date(event.startsAt))}</time>
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.location}</p>
                </div>
              </article>
            ))}
            <Link className="text-link" href="/events">See the calendar <span>→</span></Link>
          </aside>
        </div>
      </section>

      <section className="section alumni-section">
        <div className="container alumni-card">
          <div className="alumni-image">
            <Image
              src="/images/source-site/alumni-achievers.jpg"
              alt="SNCS alumni achievers recognized by the school"
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
            />
          </div>
          <div>
            <p className="eyebrow">Alumni community</p>
            <h2>Rooted at SNCS. Ready for the world.</h2>
            <p>
              Our alumni carry the school&apos;s values into their families, professions,
              and communities. Their stories remain part of the SNCS journey.
            </p>
          </div>
          <Link className="button dark" href="/campus#alumni">Meet our alumni</Link>
        </div>
      </section>
    </>
  );
}
