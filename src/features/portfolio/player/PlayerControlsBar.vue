<script setup lang="ts">
import { computed } from 'vue'
import PlayerStartTimeField from './PlayerStartTimeField.vue'
import PlayerVolumeControl from './PlayerVolumeControl.vue'
import { formatTime } from './utils/formatTime'

const props = defineProps<{
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  startSecond: number
  maxStartSecond: number
  subtitlesActive: boolean
  pipSupported: boolean
  isFullscreen: boolean
  theaterMode: boolean
}>()

defineEmits<{
  (e: 'toggle-play'): void
  (e: 'skip', seconds: number): void
  (e: 'toggle-mute'): void
  (e: 'change-volume', volume: number): void
  (e: 'update:startSecond', seconds: number): void
  (e: 'toggle-subtitles'): void
  (e: 'toggle-pip'): void
  (e: 'toggle-theater'): void
  (e: 'toggle-fullscreen'): void
}>()

const formattedCurrentTime = computed(() => formatTime(props.currentTime))
const formattedDuration = computed(() => formatTime(props.duration))
</script>

<template>
  <div class="flex items-center justify-between text-white">
    <div class="flex items-center gap-1 sm:gap-2">
      <button
        class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-lg transition-transform hover:scale-110 hover:text-red-500 active:scale-95"
        :title="isPlaying ? 'Pausar (k / espacio)' : 'Reproducir (k / espacio)'"
        @click="$emit('toggle-play')"
      >
        <i class="fas" :class="isPlaying ? 'fa-pause' : 'fa-play'"></i>
      </button>

      <button
        class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm text-white/80 transition-colors hover:text-white sm:flex"
        title="Retroceder 10 segundos (j)"
        @click="$emit('skip', -10)"
      >
        <i class="fas fa-rotate-left"></i>
      </button>

      <button
        class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm text-white/80 transition-colors hover:text-white sm:flex"
        title="Adelantar 10 segundos (l)"
        @click="$emit('skip', 10)"
      >
        <i class="fas fa-rotate-right"></i>
      </button>

      <PlayerVolumeControl
        :volume="volume"
        :muted="muted"
        @toggle-mute="$emit('toggle-mute')"
        @change="$emit('change-volume', $event)"
      />

      <div class="ml-1 text-xs font-medium text-white/90 sm:text-sm">
        <span>{{ formattedCurrentTime }}</span>
        <span class="mx-1 text-white/40">/</span>
        <span class="text-white/70">{{ formattedDuration }}</span>
      </div>

      <PlayerStartTimeField
        :model-value="startSecond"
        :max="maxStartSecond"
        @update:model-value="$emit('update:startSecond', $event)"
      />
    </div>

    <div class="relative flex items-center gap-1 sm:gap-2">
      <button
        class="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/10"
        :class="subtitlesActive ? 'text-white' : 'text-white/65 hover:text-white'"
        title="Subtítulos (c)"
        @click="$emit('toggle-subtitles')"
      >
        <span class="rounded border border-current px-1 py-0.2 text-[10px] font-bold tracking-tight">CC</span>
        <span v-if="subtitlesActive" class="absolute bottom-1.5 left-2 right-2 h-0.5 rounded-full bg-red-600"></span>
      </button>

      <slot name="settings" />

      <button
        v-if="pipSupported"
        class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:flex"
        title="Pantalla en pantalla (PiP)"
        @click="$emit('toggle-pip')"
      >
        <i class="fas fa-clone"></i>
      </button>

      <button
        class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white md:flex"
        :title="theaterMode ? 'Modo normal' : 'Modo cine (teatro)'"
        @click="$emit('toggle-theater')"
      >
        <i class="fas" :class="theaterMode ? 'fa-compress' : 'fa-film'"></i>
      </button>

      <button
        class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-base text-white/85 transition-colors hover:bg-white/10 hover:text-white"
        :title="isFullscreen ? 'Salir de pantalla completa (f)' : 'Pantalla completa (f)'"
        @click="$emit('toggle-fullscreen')"
      >
        <i class="fas" :class="isFullscreen ? 'fa-compress' : 'fa-expand'"></i>
      </button>
    </div>
  </div>
</template>
