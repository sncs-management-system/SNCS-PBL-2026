<script setup lang="ts">
import PageHero from "@/components/PageHero.vue";
import SectionHeading from "@/components/SectionHeading.vue";
import { getPublicInstitutionalSections } from "@/lib/content/content";

const institutionalSections = getPublicInstitutionalSections();
</script>

<template>
  <PageHero
    eyebrow="About SNCS"
    title="A school built on faith and shared mission"
    description="Meet the story, direction, and values that shape the Sto. Niño Catholic School community."
  />

  <section class="section">
    <div class="container story-grid">
      <div>
        <SectionHeading eyebrow="Our story" title="Growing with the community since 1988" />
        <p class="lead-copy">
          Sto. Niño Catholic School began through the pastoral vision of Rev. Fr.
          Wilfredo “Charlie” Jundis, welcoming an initial class of 28 kindergarten
          pupils in Signal Village.
        </p>
        <p>
          From that modest beginning, the school grew into a Catholic educational
          community committed to meaningful learning, character formation, and
          service. That founding purpose continues to guide every learner, family,
          teacher, and partner who becomes part of SNCS.
        </p>
      </div>
      <aside class="story-callout">
        <span>1988</span>
        <strong>Our founding year</strong>
        <p>A small beginning, sustained by faith and strengthened by community.</p>
      </aside>
    </div>
  </section>

  <section class="section section-soft">
    <div class="container">
      <SectionHeading
        eyebrow="Our direction"
        title="Mission and vision"
        description="These commitments keep our programs and relationships centered on the learner and the Gospel."
      />
      <div class="mission-grid">
        <article v-for="section in institutionalSections" :key="section.id" class="mission-card">
          <p class="eyebrow">{{ section.eyebrow }}</p>
          <h3>{{ section.title }}</h3>
          <p>{{ section.body }}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <SectionHeading
        eyebrow="Our character"
        title="The values we carry"
        description="Three words express the kind of people we strive to become."
      />
      <div class="values-grid">
        <article><span>01</span><h3>Simple</h3><p>We choose what is essential and act with sincerity.</p></article>
        <article><span>02</span><h3>Humble</h3><p>We remain open to learning, gratitude, and service.</p></article>
        <article><span>03</span><h3>Competent</h3><p>We pursue excellence and use our abilities responsibly.</p></article>
      </div>
    </div>
  </section>
</template>
