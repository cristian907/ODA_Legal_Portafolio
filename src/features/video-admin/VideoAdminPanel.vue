<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useVideoStore } from '@/stores/video'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import {
  AUDIO_EXTENSIONS,
  MIN_AUDIO_TRACKS,
  MIN_SUBTITLES,
  SUBTITLE_EXTENSIONS,
  VIDEO_TITLE_MAX_LENGTH,
} from '@/schemas/video'
import PublishedVideoCard from './PublishedVideoCard.vue'
import TrackList from './TrackList.vue'
import VideoDropzone from './VideoDropzone.vue'
import { useVideoDraft } from './useVideoDraft'

const store = useVideoStore()
const { manifest, isPublishing, uploadProgress, errors } = storeToRefs(store)
const { show } = useToast()
const { confirm } = useConfirm()
const { draft, missing, isReady, setVideo, addTracks, updateTrack, removeTrack, reset } = useVideoDraft()

const UPLOAD_COMPLETE = 100

const isProcessing = computed(() => isPublishing.value && uploadProgress.value >= UPLOAD_COMPLETE)
const publishLabel = computed(() => {
  if (isProcessing.value) return 'Generando miniaturas…'
  if (isPublishing.value) return 'Publicando…'
  return 'Publicar video'
})
const titleLength = computed(() => draft.title.length)

async function publish(): Promise<void> {
  if (!isReady.value || isPublishing.value) return
  const published = await store.publish(draft)
  if (published) {
    reset()
    show('Video publicado')
  } else {
    show('No se pudo publicar el video', 'error')
  }
}

async function retire(): Promise<void> {
  const accepted = await confirm({
    title: 'Retirar video',
    message: 'El video dejará de mostrarse en el sitio y sus archivos se eliminarán del servidor.',
    confirmLabel: 'Retirar video',
    variant: 'danger',
  })
  if (!accepted) return
  await store.clear()
  show('Video retirado')
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex flex-col gap-6 p-5 min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto [color-scheme:dark]">
      <PublishedVideoCard
        v-if="manifest"
        :manifest="manifest"
        :disabled="isPublishing"
        @retire="retire"
      />

      <section class="flex flex-col gap-1.5">
        <div class="flex items-baseline justify-between gap-3">
          <label
            for="videoTitle"
            class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500"
          >
            Título
          </label>
          <span
            class="font-mono text-xs tabular-nums"
            :class="titleLength > VIDEO_TITLE_MAX_LENGTH ? 'text-red-400' : 'text-slate-500'"
            aria-hidden="true"
          >
            {{ titleLength }}/{{ VIDEO_TITLE_MAX_LENGTH }}
          </span>
        </div>
        <input
          id="videoTitle"
          v-model="draft.title"
          type="text"
          placeholder="Ej. Presentación del despacho"
          :disabled="isPublishing"
          class="rounded-lg border bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
          :class="
            titleLength > VIDEO_TITLE_MAX_LENGTH
              ? 'border-red-500'
              : 'border-[#1e293b] focus:border-[#c5a059]'
          "
        />
      </section>

      <section class="flex flex-col gap-1.5">
        <h3 class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">Video</h3>
        <VideoDropzone
          :file="draft.video"
          :disabled="isPublishing"
          @select="setVideo"
          @remove="setVideo(null)"
        />
      </section>

      <TrackList
        id-prefix="subtitle"
        heading="Subtítulos"
        icon="fa-closed-captioning"
        add-label="Agregar subtítulo"
        :tracks="draft.subtitles"
        :minimum="MIN_SUBTITLES"
        :extensions="SUBTITLE_EXTENSIONS"
        format-message="Los subtítulos deben ser archivos .vtt"
        label-placeholder="Español"
        :disabled="isPublishing"
        @add="addTracks('subtitles', $event)"
        @update="(index, field, value) => updateTrack('subtitles', index, field, value)"
        @remove="removeTrack('subtitles', $event)"
      />

      <TrackList
        id-prefix="audio"
        heading="Pistas de audio"
        icon="fa-volume-high"
        add-label="Agregar pista de audio"
        :tracks="draft.audioTracks"
        :minimum="MIN_AUDIO_TRACKS"
        :extensions="AUDIO_EXTENSIONS"
        format-message="Las pistas de audio deben ser .mp3, .m4a, .ogg o .wav"
        label-placeholder="Español"
        :disabled="isPublishing"
        @add="addTracks('audioTracks', $event)"
        @update="(index, field, value) => updateTrack('audioTracks', index, field, value)"
        @remove="removeTrack('audioTracks', $event)"
      />
    </div>

    <!-- Action bar: stays in view while the form scrolls -->
    <div class="sticky bottom-0 flex flex-col gap-3 border-t border-[#1e293b] bg-[#0b0f17] p-4">
      <div aria-live="polite" class="flex flex-col gap-2 empty:hidden">
        <ul
          v-if="errors.length > 0 && !isPublishing"
          class="flex flex-col gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
        >
          <li v-for="error in errors" :key="error" class="flex gap-2">
            <i class="fas fa-triangle-exclamation mt-0.5" aria-hidden="true"></i>
            <span>{{ error }}</span>
          </li>
        </ul>
        <p v-if="!isPublishing && missing.length > 0" class="text-xs text-slate-400">
          {{ missing.join(' · ') }}
        </p>
      </div>

      <div v-if="isPublishing" class="flex items-center gap-3">
        <div
          class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e293b]"
          role="progressbar"
          aria-label="Progreso de la subida"
          :aria-valuenow="uploadProgress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="h-full rounded-full bg-gradient-to-r from-[#c5a059] to-[#b38e44] transition-[width] duration-200"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
        <span class="w-10 text-right font-mono text-xs text-slate-300 tabular-nums">
          {{ uploadProgress }}%
        </span>
      </div>

      <button
        type="button"
        class="btn-primary w-full !rounded-lg !py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17] disabled:cursor-not-allowed disabled:!transform-none disabled:opacity-50 disabled:!shadow-none"
        :disabled="!isReady || isPublishing"
        @click="publish"
      >
        <i
          class="fas"
          :class="isPublishing ? 'fa-circle-notch fa-spin' : 'fa-cloud-arrow-up'"
          aria-hidden="true"
        ></i>
        {{ publishLabel }}
      </button>
      <p class="sr-only" aria-live="polite">{{ isPublishing ? publishLabel : '' }}</p>
      <p v-if="manifest && !isPublishing" class="text-center text-xs text-slate-500">
        Reemplazará el video publicado actualmente.
      </p>
    </div>
  </div>
</template>
