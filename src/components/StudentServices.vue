<script setup lang="ts">
import SectionHeading from "@/components/SectionHeading.vue";
import { getPublicStudentServices } from "@/lib/content/directory";
const services = getPublicStudentServices();
</script>

<template>
  <section v-if="services.length" id="student-services" class="section section-soft scroll-target">
    <div class="container">
      <SectionHeading eyebrow="Here to help" title="Student services" description="Reach the office or service that can help with your question." />
      <div class="service-grid">
        <article v-for="service in services" :key="service.id" class="service-card">
          <h3>{{ service.title }}</h3>
          <p>{{ service.description }}</p>
          <a class="text-link" :href="service.channel.href" :target="service.channel.external ? '_blank' : undefined" :rel="service.channel.external ? 'noopener noreferrer' : undefined">
            {{ service.channel.label }}<span v-if="service.channel.external" class="sr-only"> (opens a new tab)</span>
          </a>
        </article>
      </div>
    </div>
  </section>
</template>
