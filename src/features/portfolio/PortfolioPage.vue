<script setup lang="ts">
import { inject, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useGalleryStore } from '@/stores/gallery'
import TangramLoader from './TangramLoader.vue'
import TheHeader from './TheHeader.vue'
import HeroSection from './HeroSection.vue'
import VideoSection from './VideoSection.vue'
import PhotoCarouselSection from './carousel/PhotoCarouselSection.vue'
import ServicesSection from './ServicesSection.vue'
import GallerySection from './GallerySection.vue'
import TheFooter from './TheFooter.vue'

const previewMode = inject('previewMode', false)
const route = useRoute()
const theme = useThemeStore()
const gallery = useGalleryStore()

// Solo se muestra al cargar la landing pública ('/'), nunca dentro de admin ni en LivePreview
const showLoader = ref(!previewMode && route.path === '/' && theme.loaderEnabled)
</script>

<template>
  <TangramLoader v-if="showLoader" @finished="showLoader = false" />
  <TheHeader />
  <main>
    <HeroSection />
    <VideoSection />
    <PhotoCarouselSection />
    <ServicesSection />
    <GallerySection v-if="gallery.isGalleryEnabled" />
  </main>
  <TheFooter />
</template>
