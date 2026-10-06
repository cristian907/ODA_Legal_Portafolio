<script setup lang="ts">
defineEmits<{
  (e: 'replay'): void
}>()
</script>

<template>
  <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
    <button
      class="group/btn flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95"
      title="Volver a reproducir"
      @click="$emit('replay')"
    >
      <i class="fas fa-rotate-right text-3xl"></i>
    </button>
    <span class="mt-4 text-sm font-semibold tracking-wide text-white/90">Reproducir nuevamente</span>
  </div>
</template>
