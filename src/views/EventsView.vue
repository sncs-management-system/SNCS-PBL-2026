<script setup lang="ts">
import PageHero from "@/components/PageHero.vue";
import { getPublicEvents } from "@/lib/content/content";

const events = getPublicEvents();
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
</script>

<template>
  <PageHero
    eyebrow="School calendar"
    title="Upcoming events"
    description="Keep up with the public activities that bring our learners, families, and community together."
  />
  <section class="section">
    <div class="container content-list">
      <article v-for="event in events" :key="event.id" class="content-card event-list-card">
        <div class="date-block large">
          <span>{{ new Date(event.startsAt).toLocaleString("en-PH", { month: "short" }) }}</span>
          <strong>{{ new Date(event.startsAt).getDate() }}</strong>
        </div>
        <div>
          <p class="meta">{{ formatDate(event.startsAt) }} · {{ event.location }}</p>
          <h2>{{ event.title }}</h2>
          <p>{{ event.summary }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
