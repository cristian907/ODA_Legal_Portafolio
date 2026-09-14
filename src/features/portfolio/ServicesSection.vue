<script setup lang="ts">
import SectionHeader from './SectionHeader.vue'
import ServiceCard from './ServiceCard.vue'
import { SERVICES } from './data/services'
</script>

<template>
  <section id="servicios" class="relative bg-svc-1 py-24 transition-colors">
    <div class="app-container">
      <SectionHeader
        tag="Áreas de Especialidad"
        title="Servicios Legales Integrales"
        subtitle="Soluciones jurídicas personalizadas con excelencia, ética y compromiso profesional en cada caso procesal."
      />

      <div class="services-grid grid gap-8">
        <ServiceCard
          v-for="service in SERVICES"
          :key="service.title"
          :icon="service.icon"
          :title="service.title"
          :description="service.description"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.services-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}
</style>
