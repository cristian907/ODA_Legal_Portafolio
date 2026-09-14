<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { SIZE_BOUNDS } from '@/shared/constants/palettes'
import type { PaletteKey, SizeKey, ThemeName } from '@/types/theme'
import SegmentedControl from '@/components/form/SegmentedControl.vue'
import ColorRow from '@/components/form/ColorRow.vue'
import SizeRow from '@/components/form/SizeRow.vue'
import FontUploader from '@/components/form/FontUploader.vue'

const emit = defineEmits<{ back: [] }>()
const theme = useThemeStore()

const draft = computed(() => theme.draft)

const themeModel = computed<string>({
  get: () => theme.draft?.theme ?? 'light',
  set: (v) => theme.setDraftTheme(v as ThemeName),
})

const themeOptions = [
  { value: 'light', label: 'Claro', icon: 'fa-sun' },
  { value: 'dark', label: 'Oscuro', icon: 'fa-moon' },
]

const nameError = computed(() => theme.validateStyleName(theme.draft?.name ?? '').message)

const colorRows: { key: PaletteKey; label: string }[] = [
  { key: 'c1', label: 'Fondo de sección' },
  { key: 'c2', label: 'Fondo de tarjetas' },
  { key: 'c3', label: 'Texto principal' },
  { key: 'c4', label: 'Primario / Íconos' },
  { key: 'c5', label: 'Destaque / Hover' },
]

const sizeRows: { key: SizeKey; label: string }[] = [
  { key: 'titles', label: 'Títulos' },
  { key: 'subtitles', label: 'Subtítulos' },
  { key: 'body', label: 'Cuerpo' },
]

function onFontLoad({ dataUrl, name }: { dataUrl: string; name: string }) {
  if (!theme.draft) return
  theme.draft.fontDataUrl = dataUrl
  theme.draft.fontName = name
}
function onFontReset() {
  if (!theme.draft) return
  theme.draft.fontDataUrl = null
  theme.draft.fontName = null
}
</script>

<template>
  <div v-if="draft" class="flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        @click="emit('back')"
      >
        <i class="fas fa-arrow-left"></i> Volver
      </button>
      <span class="font-semibold text-white">{{ draft.id ? 'Editar estilo' : 'Nuevo estilo' }}</span>
    </div>

    <!-- Nombre -->
    <section class="flex flex-col gap-1.5">
      <span class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">Nombre</span>
      <input
        v-model="draft.name"
        type="text"
        maxlength="40"
        placeholder="Nombre del estilo (opcional)"
        class="rounded-lg border bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none"
        :class="nameError ? 'border-red-500' : 'border-[#1e293b] focus:border-[#c5a059]'"
      />
      <span v-if="nameError" class="text-xs text-red-400">{{ nameError }}</span>
    </section>

    <!-- Tema del estilo -->
    <section class="flex flex-col gap-1.5">
      <span class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">
        Tema del estilo
      </span>
      <SegmentedControl v-model="themeModel" :options="themeOptions" />
      <span class="text-xs text-slate-500">
        Define si el estilo es claro u oscuro; al activarlo, el sitio abre en ese modo.
      </span>
    </section>

    <!-- Colores -->
    <section class="flex flex-col gap-1">
      <span class="mb-1 text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">Colores</span>
      <ColorRow
        v-for="row in colorRows"
        :key="row.key"
        :label="row.label"
        v-model="draft.palette[row.key]"
      />
    </section>

    <!-- Tipografía -->
    <section class="flex flex-col gap-3">
      <span class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">Tipografía</span>
      <FontUploader :font-name="draft.fontName" @load="onFontLoad" @reset="onFontReset" />
      <div class="flex flex-col gap-1">
        <SizeRow
          v-for="row in sizeRows"
          :key="row.key"
          :label="row.label"
          :min="SIZE_BOUNDS[row.key].min"
          :max="SIZE_BOUNDS[row.key].max"
          v-model="draft.sizes[row.key]"
        />
      </div>
    </section>
  </div>
</template>
