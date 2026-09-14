<script setup lang="ts">
defineProps({
  src: { type: String, default: '' },
  open: { type: Boolean, default: false },
})
defineEmits(['close'])
</script>

<template>
  <div
    class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-8 transition-opacity"
    :class="open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
    @click.self="$emit('close')"
  >
    <button
      class="absolute right-8 top-6 cursor-pointer border-none bg-transparent text-4xl leading-none text-white transition-colors hover:text-gold"
      aria-label="Cerrar"
      @click="$emit('close')"
    >
      &times;
    </button>
    <div class="max-h-[80vh] max-w-[900px] overflow-hidden rounded-lg">
      <img v-if="src" :src="src" alt="Vista ampliada" class="block max-h-[80vh] max-w-full" />
    </div>
  </div>
</template>
