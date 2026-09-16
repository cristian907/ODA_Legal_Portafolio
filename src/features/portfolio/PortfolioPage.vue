<script setup lang="ts">
import { ref } from 'vue'
import TangramLoader from './TangramLoader.vue'
import TheHeader from './TheHeader.vue'
import HeroSection from './HeroSection.vue'
import ServicesSection from './ServicesSection.vue'
import GallerySection from './GallerySection.vue'
import TheFooter from './TheFooter.vue'

const showLoader = ref(true)
</script>

<template>
  <TangramLoader v-if="showLoader" @finished="showLoader = false" />
  <TheHeader />
  <main>
    <HeroSection />
    <ServicesSection />
    <GallerySection />
  </main>
  <TheFooter />
</template>
