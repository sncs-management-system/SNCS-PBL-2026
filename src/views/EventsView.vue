<script setup lang="ts">
import PageHero from "@/components/PageHero.vue";
import EventCard from "@/components/EventCard.vue";
import { getPublicEvents, officialCalendarUrl } from "@/lib/content/content";
import { partitionEvents } from "@/lib/content/dates";
const { upcoming, past } = partitionEvents(getPublicEvents());
</script>
<template>
  <PageHero eyebrow="School calendar" title="School events and important dates" description="Follow the activities and dates shared by the SNCS community." />
  <section class="section">
    <div class="container content-list">
      <div class="section-row"><h2>Upcoming events</h2><a class="text-link" :href="officialCalendarUrl" target="_blank" rel="noopener noreferrer">Open school calendar<span class="sr-only"> (opens a new tab)</span> →</a></div>
      <EventCard v-for="event in upcoming" :key="event.id" :event="event" />
      <div v-if="!upcoming.length" class="empty-state"><h3>No upcoming events listed</h3><p>Check the school calendar for the latest dates, or contact the school for an update.</p></div>
    </div>
  </section>
  <section v-if="past.length" class="section section-soft">
    <div class="container content-list"><div class="section-heading"><p class="eyebrow">Previously announced</p><h2>Past events</h2></div><EventCard v-for="event in past" :key="event.id" :event="event" /></div>
  </section>
</template>
