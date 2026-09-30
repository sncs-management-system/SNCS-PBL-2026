<script setup lang="ts">
import PageHero from "@/components/PageHero.vue";
import { getPublicAnnouncements } from "@/lib/content/content";

const announcements = getPublicAnnouncements();
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" }).format(
        new Date(value),
      )
    : "";
</script>

<template>
  <PageHero
    eyebrow="News and advisories"
    title="What’s happening at SNCS"
    description="Read public announcements, school updates, and stories from our learning community."
  />
  <section class="section">
    <div class="container content-list">
      <article v-for="item in announcements" :key="item.id" class="content-card">
        <p class="meta">{{ item.category }} · {{ formatDate(item.publishedAt) }}</p>
        <h2>{{ item.title }}</h2>
        <p>{{ item.summary }}</p>
      </article>
    </div>
  </section>
</template>
