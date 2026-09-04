<script setup lang="ts">
import { watch } from 'vue'
import { useConfirm } from '@/composables/useConfirm'

const { state, resolve } = useConfirm()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') resolve(false)
}

watch(
  () => state.open,
  (open) => {
    if (open) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
)
</script>

<template>
  <Transition name="modal">
    <div
      v-if="state.open"
      class="fixed inset-0 z-[3100] flex items-center justify-center bg-black/70 p-6"
      role="dialog"
      aria-modal="true"
      @click.self="resolve(false)"
    >
      <div class="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f172a] p-6 text-center shadow-2xl">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          :class="state.variant === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-[#c5a059]/15 text-[#e5be48]'"
        >
          <i class="fas fa-triangle-exclamation"></i>
        </div>
        <h2 class="mb-2 text-lg font-bold text-white">{{ state.title }}</h2>
        <p class="mb-6 text-sm leading-relaxed text-slate-300">{{ state.message }}</p>
        <div class="flex justify-center gap-3">
          <button
            class="rounded-lg border border-[#1e293b] px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
            @click="resolve(false)"
          >
            {{ state.cancelLabel }}
          </button>
          <button
            class="rounded-lg px-5 py-2 text-sm font-semibold transition"
            :class="
              state.variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-[#c5a059] text-[#0f172a] hover:bg-[#b38e44]'
            "
            @click="resolve(true)"
          >
            {{ state.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
