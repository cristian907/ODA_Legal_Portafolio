<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import SegmentedControl from '@/components/form/SegmentedControl.vue'
import SavedStyleCard from './SavedStyleCard.vue'
import type { SavedStyle, ThemeName } from '@/types/theme'

const emit = defineEmits<{
  create: [presetTheme: ThemeName | null]
  edit: [style: SavedStyle]
}>()

const theme = useThemeStore()
const { confirm } = useConfirm()
const { show } = useToast()

const filterModel = computed<string>({
  get: () => theme.libraryThemeFilter,
  set: (v) => {
    theme.libraryThemeFilter = v as 'all' | ThemeName
    theme.libraryPage = 1
  },
})

const filterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'light', label: 'Claro', icon: 'fa-sun' },
  { value: 'dark', label: 'Oscuro', icon: 'fa-moon' },
]

function onSearch(e: Event) {
  theme.librarySearch = (e.target as HTMLInputElement).value
  theme.libraryPage = 1
}

function activate(style: SavedStyle) {
  const mode = theme.activateStyle(style)
  show(`"${style.name}" activado como estilo del modo ${mode}`)
}

async function remove(style: SavedStyle) {
  const wasActive = theme.isActive(style.id)
  const message = wasActive
    ? `"${style.name}" está activo en el modo ${style.theme === 'dark' ? 'oscuro' : 'claro'}. Si lo borras, ese modo vuelve a los valores de fábrica.`
    : `¿Seguro que quieres borrar el estilo "${style.name}"? Esta acción no se puede deshacer.`
  const ok = await confirm({ title: 'Borrar estilo', message, confirmLabel: 'Borrar', variant: 'danger' })
  if (!ok) return
  theme.deleteStyle(style)
  show(`Estilo "${style.name}" eliminado`)
}

function goPage(p: number) {
  theme.libraryPage = Math.min(Math.max(1, p), theme.totalLibraryPages)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <button class="btn-primary w-full" @click="emit('create', null)">
      <i class="fas fa-plus-circle"></i> Crear estilo nuevo
    </button>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">
          Estilos guardados ({{ theme.savedStyles.length }})
        </span>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl v-model="filterModel" :options="filterOptions" size="sm" />
        <div class="relative">
          <i class="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500"></i>
          <input
            type="text"
            placeholder="Buscar..."
            :value="theme.librarySearch"
            class="w-40 rounded border border-[#1e293b] bg-[#0b0f17] py-1 pl-7 pr-2 text-sm text-white outline-none focus:border-[#c5a059]"
            @input="onSearch"
          />
        </div>
      </div>
    </div>

    <!-- List -->
    <p v-if="theme.savedStyles.length === 0" class="py-6 text-center text-sm text-slate-500">
      No hay estilos guardados todavía. Crea el primero con "Crear estilo nuevo".
    </p>
    <p v-else-if="theme.pagedStyles.length === 0" class="py-6 text-center text-sm text-slate-500">
      Ningún estilo coincide con "{{ theme.librarySearch }}".
    </p>
    <div v-else class="flex flex-col gap-3">
      <SavedStyleCard
        v-for="style in theme.pagedStyles"
        :key="style.id ?? style.name"
        :style="style"
        :active="theme.isActive(style.id)"
        @activate="activate(style)"
        @edit="emit('edit', style)"
        @delete="remove(style)"
      />
    </div>

    <!-- Pagination -->
    <div v-if="theme.totalLibraryPages > 1" class="flex justify-center gap-1">
      <button
        class="rounded border border-[#1e293b] px-2 py-1 text-sm text-slate-300 disabled:opacity-40"
        :disabled="theme.libraryPage === 1"
        @click="goPage(theme.libraryPage - 1)"
      >
        ‹
      </button>
      <button
        v-for="p in theme.totalLibraryPages"
        :key="p"
        class="rounded border px-3 py-1 text-sm"
        :class="
          p === theme.libraryPage
            ? 'border-[#c5a059] bg-[#c5a059] text-[#0f172a]'
            : 'border-[#1e293b] text-slate-300'
        "
        @click="goPage(p)"
      >
        {{ p }}
      </button>
      <button
        class="rounded border border-[#1e293b] px-2 py-1 text-sm text-slate-300 disabled:opacity-40"
        :disabled="theme.libraryPage === theme.totalLibraryPages"
        @click="goPage(theme.libraryPage + 1)"
      >
        ›
      </button>
    </div>
  </div>
</template>
