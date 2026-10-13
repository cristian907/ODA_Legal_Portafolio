<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  visible: boolean
}>()
</script>

<template>
  <div
    class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300"
    :class="visible ? 'opacity-100' : 'opacity-0'"
  >
    <div>
      <h3 class="text-sm font-semibold text-white drop-shadow-md sm:text-base">
        {{ title }}
      </h3>
      <span class="text-xs text-white/70">{{ subtitle || 'Reproductor Personalizado ODA' }}</span>
    </div>
  </div>
</template>
