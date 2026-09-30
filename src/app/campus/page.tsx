import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { getPublicFacilities } from "@/lib/content/content";

export const metadata: Metadata = { title: "Campus" };

export default function CampusPage() {
  const facilities = getPublicFacilities();

  return (
    <>
      <PageHero
        eyebrow="Campus life"
        title="A welcoming place to learn, connect, and grow"
        description="Explore the facilities and communities that make the SNCS experience complete."
      />
      <section className="section">
        <div className="container facility-list">
          {facilities.map((facility, index) => (
            <article className="facility-feature" key={facility.id}>
              <div className={`feature-art accent-${facility.accent}`}>
                <Image
                  src={facility.imageSrc}
                  alt={facility.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 40vw"
                />
                <span aria-hidden="true">0{index + 1}</span>
              </div>
              <div>
                <p className="eyebrow">School facility</p>
                <h2>{facility.name}</h2>
                <p>{facility.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-tint" id="alumni">
        <div className="container story-grid">
          <div>
            <p className="eyebrow">Alumni</p>
            <h2>A lifelong connection to the SNCS community</h2>
          </div>
          <div className="prose">
            <p>
              SNCS alumni remain valued members of the school community. Their achievements,
              service, and continued involvement inspire today&apos;s learners.
            </p>
            <p>
              This public foundation is ready for future alumni profiles and stories to be
              managed through the CMS without changing the page layout.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
