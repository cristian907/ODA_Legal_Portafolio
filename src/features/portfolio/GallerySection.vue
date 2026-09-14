<script setup lang="ts">
import { computed, ref } from 'vue'
import SectionHeader from './SectionHeader.vue'
import LightboxModal from './LightboxModal.vue'
import { GALLERY_FILTERS, GALLERY_ITEMS } from './data/gallery'

const activeFilter = ref('all')

const visibleItems = computed(() =>
  activeFilter.value === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === activeFilter.value),
)

const lightbox = ref({ open: false, src: '' })

function openLightbox(src: string) {
  lightbox.value = { open: true, src }
}
function closeLightbox() {
  lightbox.value.open = false
}
</script>

<template>
  <section id="galeria" class="bg-surface py-24 transition-colors">
    <div class="app-container">
      <SectionHeader
        tag="Instalaciones &amp; Despacho"
        title="Galería Profesional"
        subtitle="Conoce mis instalaciones de primer nivel y la atención profesional a tu servicio."
      />

      <!-- Filters -->
      <div class="mb-12 flex flex-wrap justify-center gap-4">
        <button
          v-for="filter in GALLERY_FILTERS"
          :key="filter.value"
          class="filter-btn rounded-full border border-svc-5 px-6 py-[0.6rem] font-semibold"
          :class="
            activeFilter === filter.value
              ? 'border-svc-4 bg-svc-4 text-svc-2'
              : 'bg-svc-2 text-svc-3'
          "
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Grid -->
      <div class="gallery-grid grid gap-6">
        <button
          v-for="item in visibleItems"
          :key="item.title"
          type="button"
          class="gallery-item group relative h-[260px] cursor-pointer overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          @click="openLightbox(item.img)"
        >
          <img
            :src="item.img"
            :alt="item.alt"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
          />
          <div
            class="absolute inset-0 flex flex-col justify-end bg-black/65 p-6 text-left opacity-0 transition-opacity group-hover:opacity-100"
          >
            <h3 class="gallery-title mb-1 font-semibold text-svc-2">{{ item.title }}</h3>
            <span class="gallery-category font-medium text-svc-4">{{ item.categoryLabel }}</span>
          </div>
        </button>
      </div>
    </div>

    <LightboxModal :open="lightbox.open" :src="lightbox.src" @close="closeLightbox" />
  </section>
</template>

<style scoped>
.filter-btn {
  transition: all var(--transition-fast);
}
.filter-btn:hover {
  background: var(--svc-color-4);
  color: var(--svc-color-2);
  border-color: var(--svc-color-4);
}

.gallery-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* Overlay title/category follow the themeable tokens. */
.gallery-title {
  font-size: var(--size-titles);
  line-height: 1.2;
}
.gallery-category {
  font-size: var(--size-subtitles);
}
</style>
