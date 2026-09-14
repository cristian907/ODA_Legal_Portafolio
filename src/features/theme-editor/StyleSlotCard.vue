<script setup lang="ts">
import ColorSwatches from './ColorSwatches.vue'
import { DEFAULT_PALETTES } from '@/shared/constants/palettes'
import type { SavedStyle, ThemeName } from '@/types/theme'

const props = withDefaults(
  defineProps<{
    theme: ThemeName
    style?: SavedStyle | null
    isDefault?: boolean
    muted?: boolean
  }>(),
  { style: null, isDefault: false, muted: false },
)
defineEmits<{ edit: []; change: []; create: [] }>()

const label = props.theme === 'dark' ? 'Oscuro' : 'Claro'
const icon = props.theme === 'dark' ? '🌙' : '☀️'
</script>

<template>
  <div
    class="rounded-lg border border-[#1e293b] bg-[#0f172a] p-3 transition"
    :class="{ 'opacity-50': muted }"
  >
    <div class="mb-2 flex items-center gap-2 text-sm text-slate-300">
      <strong class="text-white">{{ icon }} {{ label }}</strong>
      <span
        v-if="isDefault"
        class="rounded bg-[#c5a059]/20 px-2 py-0.5 text-xs font-semibold text-[#e5be48]"
      >
        <i class="fas fa-star"></i> Por defecto
      </span>
    </div>

    <!-- Empty slot (factory) -->
    <template v-if="!style">
      <p class="mb-2 text-xs text-slate-500">Sin estilo — usa valores de fábrica</p>
      <ColorSwatches :palette="DEFAULT_PALETTES[theme]" class="mb-3" />
      <button
        class="rounded bg-[#c5a059] px-3 py-1 text-xs font-semibold text-[#0f172a] transition hover:bg-[#b38e44]"
        @click="$emit('create')"
      >
        <i class="fas fa-plus"></i> Crear estilo {{ label.toLowerCase() }}
      </button>
    </template>

    <!-- Occupied slot -->
    <template v-else>
      <div class="mb-1 font-semibold text-white">{{ style.name }}</div>
      <div class="mb-2 text-xs text-slate-400">
        <i class="fas fa-font"></i> {{ style.fontName || 'Fuente Estándar' }}
      </div>
      <ColorSwatches :palette="style.palette" class="mb-3" />
      <div class="flex gap-2">
        <button
          class="rounded border border-[#1e293b] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
          @click="$emit('edit')"
        >
          <i class="fas fa-pen"></i> Editar
        </button>
        <button
          class="rounded border border-[#1e293b] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
          @click="$emit('change')"
        >
          <i class="fas fa-random"></i> Cambiar
        </button>
      </div>
    </template>
  </div>
</template>
