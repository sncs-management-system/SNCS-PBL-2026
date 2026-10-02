<script setup lang="ts">
import { RouterLink } from "vue-router";
import SectionHeading from "@/components/SectionHeading.vue";
import AnnouncementCard from "@/components/AnnouncementCard.vue";
import EventCard from "@/components/EventCard.vue";
import { partitionEvents } from "@/lib/content/dates";
import { getPublicSchoolContactInformation } from "@/lib/content/directory";
import {
  getPublicAnnouncements,
  getPublicEvents,
  getPublicFacilities,
  getPublicInstitutionalSections,
} from "@/lib/content/content";

const announcements = getPublicAnnouncements().slice(0, 2);
const events = partitionEvents(getPublicEvents()).upcoming.slice(0, 2);
const facilities = getPublicFacilities();
const institutionalSections = getPublicInstitutionalSections();
const schoolInformation = getPublicSchoolContactInformation();

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
        <RouterLink class="button button-primary" to="/admissions">Admissions guidance</RouterLink>
        <RouterLink class="button button-ghost" to="/contact">Contact the school</RouterLink>
      </div>
    </div>
  </section>

  <aside v-if="schoolInformation" class="office-notice" aria-label="School office hours"><div class="container"><strong>School office transactions</strong><span>{{ schoolInformation.officeHours }}</span></div></aside>

  <section class="section section-red">
    <div class="container updates-grid">
      <div>
        <div class="section-row compact">
          <SectionHeading eyebrow="Stay informed" title="Latest news" />
          <RouterLink class="text-link light" to="/news">All news →</RouterLink>
        </div>
        <div class="update-list">
          <AnnouncementCard v-for="item in announcements" :key="item.id" :item="item" compact />
          <p v-if="!announcements.length" class="update-card">School announcements will appear here when available.</p>
        </div>
      </div>
      <div>
        <div class="section-row compact">
          <SectionHeading eyebrow="Mark your calendar" title="Upcoming events" />
          <RouterLink class="text-link light" to="/events">All events →</RouterLink>
        </div>
        <div class="update-list">
          <EventCard v-for="event in events" :key="event.id" :event="event" compact />
          <div v-if="!events.length" class="update-card"><h3>No upcoming events listed</h3><p>Visit the school calendar for the latest dates and browse past school activities.</p><RouterLink class="text-link light" to="/events">View school dates →</RouterLink></div>
        </div>
      </div>
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
          <RouterLink class="text-link" to="/about#mission-vision">Read our mission and vision →</RouterLink>
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
