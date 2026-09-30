import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Connect with Sto. Niño Catholic School, Inc."
        description="We welcome questions from families, alumni, and community partners."
      />
      <section className="section">
        <div className="container contact-grid">
          <article className="contact-card">
            <p className="eyebrow">Visit us</p>
            <h2>SNCS Main Campus</h2>
            <p>Signal Village<br />Taguig City</p>
          </article>
          <article className="contact-card">
            <p className="eyebrow">Office hours</p>
            <h2>Monday to Friday</h2>
            <p>8:00 AM – 5:00 PM<br />Except school and public holidays</p>
          </article>
          <article className="contact-card">
            <p className="eyebrow">Send an inquiry</p>
            <h2>School office</h2>
            <p>
              <a className="text-link" href="mailto:sncstaguig2020@gmail.com">
                sncstaguig2020@gmail.com
              </a>
              <br />8837-9702 · 8295-5861
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
