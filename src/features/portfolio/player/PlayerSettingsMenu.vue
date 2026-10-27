<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlayerSettingsSubmenu from './PlayerSettingsSubmenu.vue'
import type { PlayerMenuOption } from './types'

type SettingsTab = 'main' | 'audio' | 'subtitles' | 'speed'

interface SettingsRow {
  tab: Exclude<SettingsTab, 'main'>
  icon: string
  label: string
  summary: string
}

const SPEED_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const props = defineProps<{
  open: boolean
  audioOptions: PlayerMenuOption[]
  selectedAudio: number
  subtitleOptions: PlayerMenuOption[]
  selectedSubtitle: number
  playbackRate: number
}>()

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'select-audio', index: number): void
  (e: 'select-subtitle', index: number): void
  (e: 'select-rate', rate: number): void
}>()

const currentTab = ref<SettingsTab>('main')

const speedOptions: PlayerMenuOption[] = SPEED_RATES.map((rate) => ({
  value: rate,
  label: rate === 1 ? '1x (Normal)' : `${rate}x`,
}))

function labelOf(options: PlayerMenuOption[], value: number): string {
  return options.find((option) => option.value === value)?.label ?? ''
}

const rows = computed<SettingsRow[]>(() => [
  {
    tab: 'audio',
    icon: 'fa-language',
    label: 'Pista de audio',
    summary: labelOf(props.audioOptions, props.selectedAudio),
  },
  {
    tab: 'subtitles',
    icon: 'fa-closed-captioning',
    label: 'Subtítulos',
    summary: labelOf(props.subtitleOptions, props.selectedSubtitle),
  },
  {
    tab: 'speed',
    icon: 'fa-gauge-high',
    label: 'Velocidad',
    summary: props.playbackRate === 1 ? 'Normal' : `${props.playbackRate}x`,
  },
])

watch(
  () => props.open,
  () => {
    currentTab.value = 'main'
  },
)

function toggleOpen(): void {
  emit('update:open', !props.open)
}

function showMainTab(): void {
  currentTab.value = 'main'
}

function selectAudio(index: number): void {
  emit('select-audio', index)
  showMainTab()
}

function selectSubtitle(index: number): void {
  emit('select-subtitle', index)
  showMainTab()
}

function selectRate(rate: number): void {
  emit('select-rate', rate)
  showMainTab()
}
</script>

<template>
  <div class="relative">
    <button
      class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base opacity-85 transition-all duration-200 hover:bg-white/10 hover:opacity-100 hover:text-[var(--svc-color-4)]"
      :class="{ 'rotate-45 opacity-100 text-[var(--svc-color-4)]': open }"
      title="Configuración"
      @click="toggleOpen"
    >
      <i class="fas fa-gear"></i>
    </button>

    <div
      v-if="open"
      class="player-settings-popup absolute bottom-12 right-0 z-50 w-72 overflow-hidden rounded-xl border border-[var(--svc-color-4)]/20 bg-black/95 shadow-2xl backdrop-blur-xl transition-all"
      @click.stop
    >
      <div v-if="currentTab === 'main'" class="py-1">
        <button
          v-for="row in rows"
          :key="row.tab"
          class="settings-row flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/15 hover:text-[var(--svc-color-4)]"
          @click="currentTab = row.tab"
        >
          <div class="flex items-center gap-3">
            <i class="fas opacity-70" :class="row.icon"></i>
            <span>{{ row.label }}</span>
          </div>
          <div class="flex items-center gap-1.5 opacity-60">
            <span class="max-w-[100px] truncate settings-summary">{{ row.summary }}</span>
            <i class="fas fa-chevron-right text-[10px]"></i>
          </div>
        </button>
      </div>

      <PlayerSettingsSubmenu
        v-else-if="currentTab === 'audio'"
        title="Pista de audio"
        :options="audioOptions"
        :selected="selectedAudio"
        @back="showMainTab"
        @select="selectAudio"
      />

      <PlayerSettingsSubmenu
        v-else-if="currentTab === 'subtitles'"
        title="Subtítulos"
        :options="subtitleOptions"
        :selected="selectedSubtitle"
        @back="showMainTab"
        @select="selectSubtitle"
      />

      <PlayerSettingsSubmenu
        v-else
        title="Velocidad de reproducción"
        :options="speedOptions"
        :selected="playbackRate"
        @back="showMainTab"
        @select="selectRate"
      />
    </div>
  </div>
</template>

<style scoped>
.player-settings-popup {
  color: var(--text-on-dark);
}

.settings-row {
  font-size: 13px;
}

.settings-summary {
  font-size: 11px;
}
</style>
