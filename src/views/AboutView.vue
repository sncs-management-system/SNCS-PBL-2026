<script setup lang="ts">
import { RouterLink } from "vue-router";
import PageHero from "@/components/PageHero.vue";
import SectionHeading from "@/components/SectionHeading.vue";
import { getPublicInstitutionalSections, getPublicSchoolProfile } from "@/lib/content/content";
const sections = getPublicInstitutionalSections();
const profile = getPublicSchoolProfile();
</script>

<template>
  <PageHero eyebrow="About SNCS" title="A school built on faith and shared mission" description="Meet the story, direction, and values that shape the Sto. Niño Catholic School community." />
  <nav class="container page-jumps" aria-label="On this page">
    <RouterLink v-if="profile" to="/about#history">History</RouterLink>
    <RouterLink v-if="sections.length" to="/about#mission-vision">Mission and vision</RouterLink>
    <RouterLink v-if="profile" to="/about#core-values">Core values</RouterLink>
    <RouterLink to="/campus#student-services">Student services</RouterLink>
  </nav>
  <section v-if="profile" id="history" class="section scroll-target">
    <div class="container story-grid">
      <div>
        <SectionHeading eyebrow="Our story" title="Growing with the community since 1988" />
        <p v-for="(paragraph, index) in profile.history" :key="paragraph" :class="{ 'lead-copy': index === 0 }">{{ paragraph }}</p>
      </div>
      <ol class="school-timeline" aria-label="School milestones">
        <li v-for="milestone in profile.milestones" :key="milestone.year"><strong>{{ milestone.year }}</strong><span>{{ milestone.title }}</span></li>
      </ol>
    </div>
  </section>
  <section v-if="sections.length" id="mission-vision" class="section section-soft scroll-target">
    <div class="container">
      <SectionHeading eyebrow="Our direction" title="Mission and vision" description="Education, faith, and service connect our school with home and parish." />
      <div class="mission-grid">
        <article v-for="section in sections" :key="section.id" class="mission-card">
          <p class="eyebrow">{{ section.eyebrow }}</p><h3>{{ section.title }}</h3><p>{{ section.body }}</p>
          <ul v-if="section.commitments" class="commitment-list"><li v-for="commitment in section.commitments" :key="commitment">{{ commitment }}</li></ul>
        </article>
      </div>
    </div>
  </section>
  <section v-if="profile" id="core-values" class="section scroll-target">
    <div class="container">
      <SectionHeading eyebrow="Our character" title="Our six core values" description="The principles that guide the school’s philosophy of life and education." />
      <div class="values-grid"><article v-for="(value, index) in profile.coreValues" :key="value"><span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ value }}</h3></article></div>
      <div class="motto-strip"><p class="eyebrow">Our school motto</p><p>{{ profile.motto }}</p></div>
      <RouterLink class="text-link" to="/campus">Explore our campus →</RouterLink>
    </div>
  </section>
</template>
