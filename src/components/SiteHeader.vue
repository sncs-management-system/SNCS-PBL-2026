<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";

const menu = ref<HTMLDetailsElement | null>(null);

const navigation = [
  { to: "/enrollment", label: "Apply" },
  { to: "/about", label: "About" },
  { to: "/campus", label: "Campus" },
  { to: "/news", label: "News" },
  { to: "/events", label: "Events" },
  { to: "/admissions", label: "Admissions" },
  { to: "/resources", label: "Resources" },
  { to: "/contact", label: "Contact" },
];

function closeMenu() {
  if (menu.value) menu.value.open = false;
}
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink class="brand" to="/" aria-label="Sto. Niño Catholic School home">
        <img
          class="brand-mark"
          src="/images/source-site/sncs-seal.png"
          alt=""
          width="52"
          height="52"
        />
        <span>
          <strong>Sto. Niño Catholic School, Inc.</strong>
          <small>Signal Village, Taguig City</small>
        </span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>

      <details ref="menu" class="mobile-menu">
        <summary aria-label="Open navigation">Menu</summary>
        <nav aria-label="Mobile navigation">
          <RouterLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            @click="closeMenu"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </details>
    </div>
  </header>
</template>
