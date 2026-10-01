<script setup lang="ts">
import { RouterLink } from "vue-router";

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <p class="footer-brand">Sto. Niño Catholic School, Inc.</p>
        <p>A faith-centered learning community in Taguig City.</p>
      </div>
      <div>
        <p class="footer-heading">Explore</p>
        <RouterLink to="/about">About SNCS</RouterLink>
        <RouterLink to="/campus">Campus life</RouterLink>
        <RouterLink to="/news">Latest news</RouterLink>
        <RouterLink to="/enrollment">Apply for enrollment</RouterLink>
      </div>
      <div>
        <p class="footer-heading">Visit</p>
        <p>Signal Village</p>
        <p>Taguig City</p>
        <RouterLink to="/contact">Contact the school</RouterLink>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© {{ currentYear }} Sto. Niño Catholic School, Inc.</span>
      <span>Public website MVP · PB-10</span>
    </div>
  </footer>
</template>
