<script setup lang="ts">
import ColorSwatches from './ColorSwatches.vue'
import type { SavedStyle } from '@/types/theme'

withDefaults(
  defineProps<{
    style: SavedStyle
    active?: boolean
  }>(),
  { active: false },
)
defineEmits<{ activate: []; edit: []; delete: [] }>()
</script>

<template>
  <div
    class="rounded-lg border bg-[#0f172a] p-3"
    :class="active ? 'border-[#c5a059]' : 'border-[#1e293b]'"
  >
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <span class="font-semibold text-white">{{ style.name }}</span>
      <span class="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-300">
        {{ style.theme === 'dark' ? '🌙 OSCURO' : '☀️ CLARO' }}
      </span>
      <span
        v-if="active"
        class="rounded bg-[#c5a059]/20 px-2 py-0.5 text-xs font-bold text-[#e5be48]"
      >
        <i class="fas fa-check-circle"></i> ACTIVO
      </span>
    </div>

    <div class="mb-2 flex flex-wrap gap-3 text-xs text-slate-400">
      <span :title="style.fontName || 'Fuente Estándar'">
        <i class="fas fa-font"></i> {{ style.fontName || 'Fuente Estándar' }}
      </span>
      <span>
        <i class="fas fa-text-height"></i>
        T:{{ style.sizes.titles }}px S:{{ style.sizes.subtitles }}px P:{{ style.sizes.body }}px
      </span>
    </div>

    <ColorSwatches :palette="style.palette" class="mb-3" />

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded bg-[#c5a059] px-3 py-1 text-xs font-semibold text-[#0f172a] transition hover:bg-[#b38e44]"
        @click="$emit('activate')"
      >
        <i class="fas fa-check"></i> Activar
      </button>
      <button
        class="rounded border border-[#1e293b] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
        @click="$emit('edit')"
      >
        <i class="fas fa-pen"></i> Editar
      </button>
      <button
        class="rounded border border-[#1e293b] px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
        @click="$emit('delete')"
      >
        <i class="fas fa-trash-alt"></i> Borrar
      </button>
    </div>
  </div>
</template>
