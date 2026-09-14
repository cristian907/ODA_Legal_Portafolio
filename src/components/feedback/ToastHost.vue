<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'

const { state } = useToast()

const icon = computed(() => {
  if (state.type === 'error') return 'fa-triangle-exclamation'
  if (state.type === 'warn') return 'fa-circle-exclamation'
  return 'fa-check-circle'
})

const accent = computed(() => {
  if (state.type === 'error') return 'border-red-500/60 text-red-300'
  if (state.type === 'warn') return 'border-amber-500/60 text-amber-200'
  return 'border-[#c5a059]/60 text-[#e5be48]'
})
</script>

<template>
  <Transition name="toast">
    <div
      v-if="state.visible"
      class="fixed bottom-6 left-1/2 z-[3000] flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-[#0b0f17] px-4 py-3 text-sm font-semibold shadow-xl"
      :class="accent"
      role="status"
    >
      <i class="fas" :class="icon"></i>
      <span>{{ state.message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
