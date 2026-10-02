<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHero from "@/components/PageHero.vue";
import AnnouncementImage from "@/components/AnnouncementImage.vue";
import { getPublicAnnouncements } from "@/lib/content/content";
import { formatPublicationDate } from "@/lib/content/dates";
const route = useRoute();
const item = computed(() => getPublicAnnouncements().find((entry) => entry.slug === route.params.slug));
</script>

<template>
  <template v-if="item">
    <PageHero :eyebrow="item.category" :title="item.title" :description="item.summary" />
    <section class="section">
      <div class="container article-body">
        <RouterLink class="text-link" to="/news">← All announcements</RouterLink>
        <p v-if="item.publishedAt" class="meta">{{ formatPublicationDate(item.publishedAt) }}</p>
        <p v-for="paragraph in item.body" :key="paragraph">{{ paragraph }}</p>
        <AnnouncementImage v-if="item.image" :image="item.image" />
        <div class="article-actions">
          <RouterLink class="button button-secondary" to="/contact">Contact the school</RouterLink>
          <a v-if="item.sourceUrl" class="text-link" :href="item.sourceUrl" target="_blank" rel="noopener noreferrer">View the school’s notice<span class="sr-only"> (opens a new tab)</span> →</a>
        </div>
      </div>
    </section>
  </template>
  <template v-else>
    <PageHero eyebrow="Announcements" title="Announcement unavailable" description="This announcement may no longer be available." />
    <section class="section"><div class="container"><RouterLink class="button button-secondary" to="/news">Browse announcements</RouterLink></div></section>
  </template>
</template>
