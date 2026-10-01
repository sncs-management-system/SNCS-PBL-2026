<script setup lang="ts">
import PageHero from "@/components/PageHero.vue";
</script>

<template>
  <PageHero
    eyebrow="Contact SNCS"
    title="We’re ready to help"
    description="Reach the school office or plan a visit to the Sto. Niño Catholic School campus."
  />
  <section class="section">
    <div class="container contact-grid">
      <div>
        <p class="eyebrow">School office</p>
        <h2>Connect with our community</h2>
        <p class="lead-copy">
          For admissions, records, campus concerns, or general questions, contact
          the school through the details listed here.
        </p>
        <p class="muted-copy">
          This MVP intentionally presents verified public contact channels only. A
          CMS-managed inquiry workflow can be integrated in a later backlog item.
        </p>
      </div>
      <address class="contact-card">
        <div><span>Visit</span><strong>Signal Village, Taguig City</strong></div>
        <div><span>Email</span><a href="mailto:sncstaguig2020@gmail.com">sncstaguig2020@gmail.com</a></div>
        <div><span>Call</span><a href="tel:+63288379702">(02) 8837-9702</a><a href="tel:+63282955861">(02) 8295-5861</a></div>
        <div><span>Office hours</span><strong>Monday–Friday · 8:00 AM–5:00 PM</strong></div>
      </address>
    </div>
  </section>
</template>
