<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import SegmentedControl from '@/components/form/SegmentedControl.vue'
import StyleSlotCard from './StyleSlotCard.vue'
import type { SavedStyle, ThemeName } from '@/types/theme'

const emit = defineEmits<{
  create: [presetTheme: ThemeName | null]
  edit: [style: SavedStyle | null]
  change: []
}>()

const theme = useThemeStore()
const { confirm } = useConfirm()
const { show } = useToast()

const defaultMode = computed<string>({
  get: () => theme.themeDefault,
  set: (v) => theme.setThemeDefault(v as ThemeName),
})

const modeOptions = [
  { value: 'light', label: 'Claro', icon: 'fa-sun' },
  { value: 'dark', label: 'Oscuro', icon: 'fa-moon' },
]

const lightStyle = computed(() => theme.activeStyleForTheme('light'))
const darkStyle = computed(() => theme.activeStyleForTheme('dark'))

async function resetAll() {
  const ok = await confirm({
    title: 'Restablecer todo',
    message:
      '¿Restablecer el sitio a los valores de fábrica en ambos modos? Se desactivarán los estilos actuales. Tus estilos guardados se conservan.',
    confirmLabel: 'Restablecer',
    variant: 'danger',
  })
  if (!ok) return
  theme.resetAll()
  show('Sitio restablecido a los valores de fábrica')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Apariencia del sitio -->
    <section class="flex flex-col gap-3">
      <span class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">
        Apariencia del sitio
      </span>

      <div class="flex items-center justify-between">
        <span class="text-[0.82rem] text-slate-300">Modo por defecto</span>
        <SegmentedControl v-model="defaultMode" :options="modeOptions" size="sm" />
      </div>

      <label class="flex cursor-pointer items-start justify-between gap-4">
        <span class="flex flex-col">
          <span class="text-[0.82rem] text-slate-300">Permitir que el visitante cambie de modo</span>
          <span class="text-xs text-slate-500">
            {{
              theme.allowToggle
                ? 'El botón claro/oscuro aparece en el sitio.'
                : 'El sitio queda forzado al modo por defecto; el botón se oculta.'
            }}
          </span>
        </span>
        <input
          type="checkbox"
          class="mt-1 h-5 w-5 shrink-0 accent-[#c5a059]"
          :checked="theme.allowToggle"
          @change="theme.setAllowToggle(($event.target as HTMLInputElement).checked)"
        />
      </label>
    </section>

    <!-- Estilos activos por modo -->
    <section class="flex flex-col gap-3">
      <span class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">
        Estilos activos por modo
      </span>
      <StyleSlotCard
        theme="light"
        :style="lightStyle"
        :is-default="theme.themeDefault === 'light'"
        :muted="theme.themeDefault !== 'light' && !theme.allowToggle"
        @edit="emit('edit', lightStyle)"
        @change="emit('change')"
        @create="emit('create', 'light')"
      />
      <StyleSlotCard
        theme="dark"
        :style="darkStyle"
        :is-default="theme.themeDefault === 'dark'"
        :muted="theme.themeDefault !== 'dark' && !theme.allowToggle"
        @edit="emit('edit', darkStyle)"
        @change="emit('change')"
        @create="emit('create', 'dark')"
      />
    </section>

    <!-- Acciones -->
    <section class="flex flex-col gap-2">
      <button class="btn-primary w-full" @click="emit('create', null)">
        <i class="fas fa-plus-circle"></i> Crear estilo nuevo
      </button>
      <button
        class="rounded-lg border border-[#1e293b] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
        @click="resetAll"
      >
        <i class="fas fa-undo"></i> Restablecer todo por defecto
      </button>
    </section>
  </div>
</template>
