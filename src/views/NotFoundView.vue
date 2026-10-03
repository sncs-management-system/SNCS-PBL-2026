<script setup lang="ts">
import { RouterLink } from "vue-router";
import PageHero from "@/components/PageHero.vue";
</script>
<template>
  <PageHero eyebrow="Page not found" title="Let’s get you back on track" description="The page you’re looking for may have moved or is no longer available." />
  <section class="section"><div class="container hero-actions"><RouterLink class="button button-secondary" to="/">Go to the homepage</RouterLink><RouterLink class="text-link" to="/contact">Contact the school →</RouterLink></div></section>
</template>
