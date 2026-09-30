<script setup lang="ts">
import { RouterLink } from "vue-router";
import SectionHeading from "@/components/SectionHeading.vue";
import {
  getPublicAnnouncements,
  getPublicEvents,
  getPublicFacilities,
  getPublicInstitutionalSections,
} from "@/lib/content/content";

const announcements = getPublicAnnouncements().slice(0, 2);
const events = getPublicEvents().slice(0, 2);
const facilities = getPublicFacilities();
const institutionalSections = getPublicInstitutionalSections();

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
</script>

<template>
  <section class="home-hero">
    <img
      class="hero-image"
      src="/images/source-site/campus-front.jpg"
      alt="Front view of the Sto. Niño Catholic School campus"
    />
    <div class="hero-overlay" aria-hidden="true"></div>
    <div class="container hero-content">
      <p class="eyebrow light">Faith · Excellence · Service</p>
      <h1>Forming learners for lives of purpose.</h1>
      <p class="hero-lead">
        Sto. Niño Catholic School is a joyful learning community where faith,
        character, and academic growth come together.
      </p>
      <div class="hero-actions">
        <RouterLink class="button button-primary" to="/about">Discover SNCS</RouterLink>
        <RouterLink class="button button-ghost" to="/contact">Contact the school</RouterLink>
      </div>
    </div>
    <div class="hero-seal-panel">
      <img src="/images/source-site/sncs-seal.png" alt="Sto. Niño Catholic School seal" />
      <p>Simple. Humble. Competent.</p>
    </div>
  </section>

  <section class="section intro-section">
    <div class="container intro-grid">
      <SectionHeading
        eyebrow="Welcome to SNCS"
        title="A Catholic learning community in the heart of Taguig"
        description="Since 1988, SNCS has partnered with families and the parish to nurture capable, compassionate, and faith-filled learners."
      />
      <div class="intro-note">
        <span class="stat">1988</span>
        <p>Founded with 28 kindergarten pupils and a mission that continues to grow.</p>
        <RouterLink class="text-link" to="/about">Read our story →</RouterLink>
      </div>
    </div>
  </section>

  <section class="section section-soft">
    <div class="container">
      <SectionHeading
        eyebrow="Who we are"
        title="Grounded in faith, moving with purpose"
        description="Our mission and vision guide the way we teach, serve, and grow together."
      />
      <div class="mission-grid">
        <article
          v-for="section in institutionalSections"
          :key="section.id"
          class="mission-card"
        >
          <p class="eyebrow">{{ section.eyebrow }}</p>
          <h3>{{ section.title }}</h3>
          <p>{{ section.body }}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-row">
        <SectionHeading
          eyebrow="Our campus"
          title="Spaces made for learning and belonging"
          description="Explore the buildings and learning spaces that support the daily life of our school community."
        />
        <RouterLink class="text-link" to="/campus">View campus →</RouterLink>
      </div>
      <div class="facility-grid">
        <article
          v-for="facility in facilities"
          :key="facility.id"
          class="facility-card"
          :data-accent="facility.accent"
        >
          <div class="facility-card-image">
            <img :src="facility.imageSrc" :alt="facility.imageAlt" loading="lazy" />
          </div>
          <div class="facility-card-copy">
            <h3>{{ facility.name }}</h3>
            <p>{{ facility.description }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="section section-red">
    <div class="container updates-grid">
      <div>
        <div class="section-row compact">
          <SectionHeading eyebrow="Stay informed" title="Latest news" />
          <RouterLink class="text-link light" to="/news">All news →</RouterLink>
        </div>
        <div class="update-list">
          <article v-for="item in announcements" :key="item.id" class="update-card">
            <p class="meta">{{ item.category }} · {{ formatDate(item.publishedAt!) }}</p>
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary }}</p>
          </article>
        </div>
      </div>
      <div>
        <div class="section-row compact">
          <SectionHeading eyebrow="Mark your calendar" title="Upcoming events" />
          <RouterLink class="text-link light" to="/events">All events →</RouterLink>
        </div>
        <div class="update-list">
          <article v-for="event in events" :key="event.id" class="update-card event-card">
            <div class="date-block">
              <span>{{ new Date(event.startsAt).toLocaleString("en-PH", { month: "short" }) }}</span>
              <strong>{{ new Date(event.startsAt).getDate() }}</strong>
            </div>
            <div>
              <h3>{{ event.title }}</h3>
              <p>{{ event.location }}</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>

  <section class="section alumni-feature">
    <div class="container feature-grid">
      <div class="feature-art">
        <img
          src="/images/source-site/alumni-achievers.jpg"
          alt="SNCS alumni achievers"
          loading="lazy"
        />
      </div>
      <div class="feature-copy">
        <p class="eyebrow">Our alumni</p>
        <h2>Carrying the SNCS spirit forward</h2>
        <p>
          Our graduates bring the values of simplicity, humility, and competence
          into their studies, professions, families, and communities.
        </p>
        <RouterLink class="button button-secondary" to="/campus#alumni">
          Celebrate our alumni
        </RouterLink>
      </div>
    </div>
  </section>
</template>
