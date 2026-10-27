<script setup lang="ts">
import type { PlayerMenuOption } from './types'

defineProps<{
  title: string
  options: PlayerMenuOption[]
  selected: number
}>()

defineEmits<{
  (e: 'back'): void
  (e: 'select', value: number): void
}>()
</script>

<template>
  <div class="player-submenu py-1" style="color: var(--text-on-dark);">
    <button
      class="flex w-full cursor-pointer items-center gap-2 border-b border-white/10 px-3 py-2 text-left font-semibold opacity-85 hover:bg-white/10 hover:text-[var(--svc-color-4)]"
      @click="$emit('back')"
    >
      <i class="fas fa-chevron-left text-[11px]"></i>
      <span class="submenu-title">{{ title }}</span>
    </button>
    <div class="max-h-56 overflow-y-auto py-1">
      <button
        v-for="option in options"
        :key="option.value"
        class="submenu-item flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left transition-colors hover:bg-white/15 hover:text-[var(--svc-color-4)]"
        :class="selected === option.value ? 'font-semibold text-[var(--svc-color-4)]' : 'opacity-85'"
        @click="$emit('select', option.value)"
      >
        <div>
          <div>{{ option.label }}</div>
          <div v-if="option.hint" class="submenu-hint opacity-50">{{ option.hint }}</div>
        </div>
        <i v-if="selected === option.value" class="fas fa-check text-[var(--svc-color-4)] text-[11px]"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.submenu-title,
.submenu-item {
  font-size: 13px;
}

.submenu-hint {
  font-size: 11px;
}
</style>
