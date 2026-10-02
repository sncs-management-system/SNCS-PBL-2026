<script setup lang="ts">
import { RouterView } from "vue-router";
import SiteFooter from "@/components/SiteFooter.vue";
import SiteHeader from "@/components/SiteHeader.vue";
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <SiteHeader />
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
  <SiteFooter />
</template>
