<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <section class="page-hero">
    <div class="container page-hero-inner">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
  </section>
</template>
