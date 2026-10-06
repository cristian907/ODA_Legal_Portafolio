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
  <div class="py-1 text-xs">
    <button
      class="flex w-full cursor-pointer items-center gap-2 border-b border-white/10 px-3 py-2 text-left font-semibold text-white/80 hover:bg-white/10"
      @click="$emit('back')"
    >
      <i class="fas fa-chevron-left text-[11px]"></i>
      <span>{{ title }}</span>
    </button>
    <div class="max-h-56 overflow-y-auto py-1">
      <button
        v-for="option in options"
        :key="option.value"
        class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left hover:bg-white/15"
        :class="selected === option.value ? 'font-semibold text-red-500' : 'text-white/85'"
        @click="$emit('select', option.value)"
      >
        <div>
          <div>{{ option.label }}</div>
          <div v-if="option.hint" class="text-[10px] text-white/50">{{ option.hint }}</div>
        </div>
        <i v-if="selected === option.value" class="fas fa-check text-[11px]"></i>
      </button>
    </div>
  </div>
</template>
