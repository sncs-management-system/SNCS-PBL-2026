import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPublicInstitutionalSections } from "@/lib/content/content";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const sections = getPublicInstitutionalSections();

  return (
    <>
      <PageHero
        eyebrow="About SNCS"
        title="Education anchored in faith and service"
        description="Learn about the identity, purpose, and values that guide the Sto. Niño Catholic School community."
      />
      <section className="section">
        <div className="container story-grid">
          <div>
            <p className="eyebrow">Our story</p>
            <h2>A learning community shaped by care</h2>
          </div>
          <div className="prose">
            <p>
              SNCS began through the initiative of the Sto. Niño Parish community under
              Rev. Fr. Wilfredo “Charlie” Jundis. From an initial group of 28 Kindergarten
              pupils, it grew into a complete Catholic learning community serving Taguig.
            </p>
            <p>
              Today, the school continues to bring home, parish, and school together to form
              learners who are simple, humble, competent, and ready to serve.
            </p>
          </div>
        </div>
      </section>
      <section className="section section-tint">
        <div className="container mission-grid">
          {sections.map((section) => (
            <article className="mission-card" key={section.id}>
              <p className="eyebrow">{section.eyebrow}</p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="container values-grid">
          {[
            ["Faith", "We place Christ at the center of learning and community life."],
            ["Excellence", "We pursue growth with discipline, curiosity, and integrity."],
            ["Service", "We use our gifts to respond with compassion to the needs of others."],
          ].map(([title, copy]) => (
            <article className="value-card" key={title}>
              <span aria-hidden="true">✦</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
