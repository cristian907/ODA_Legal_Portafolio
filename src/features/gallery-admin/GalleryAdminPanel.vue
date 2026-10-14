<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '@/stores/gallery'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import SegmentedControl from '@/components/form/SegmentedControl.vue'
import {
  ASPECT_RATIOS,
  DESKTOP_ITEMS_PER_VIEW,
  MAX_AUTOPLAY_INTERVAL_SECONDS,
  MIN_AUTOPLAY_INTERVAL_SECONDS,
  PHOTO_EXTENSIONS,
} from '@/schemas/gallery'
import type { AspectRatio, DesktopPhotosPerView, GalleryPhoto, SlideStep } from '@/types/gallery'
import PhotoEditorModal from './PhotoEditorModal.vue'
import { partitionPhotoFiles } from './partitionPhotoFiles'
import type { EditorSession } from './editorSession'

const store = useGalleryStore()
const { photos, settings, isRecropping, isSaving, errors, recropFailures } = storeToRefs(store)
const { show } = useToast()
const { confirm } = useConfirm()

const ratioOptions = ASPECT_RATIOS.map((ratio) => ({ value: ratio, label: ratio }))
const desktopItemsOptions = DESKTOP_ITEMS_PER_VIEW.map((count) => ({
  value: String(count),
  label: `${count} fotos`,
}))
const slideStepOptions = computed(() => [
  { value: 'single', label: 'De una en una' },
  { value: 'group', label: `De ${settings.value.itemsPerView} en ${settings.value.itemsPerView}` },
])
const thumbRatio = computed(() => settings.value.aspectRatio.replace(':', ' / '))
const accept = PHOTO_EXTENSIONS.join(',')
const isBusy = computed(() => isSaving.value || isRecropping.value)

/* ---------- Settings ---------- */
async function changeRatio(value: string): Promise<void> {
  const aspectRatio = value as AspectRatio
  if (aspectRatio === settings.value.aspectRatio || isRecropping.value) return
  if (photos.value.length > 0) {
    const accepted = await confirm({
      title: 'Cambiar proporción',
      message: 'Cambiar la proporción recortará de nuevo todas las fotos centradas. Luego puedes ajustar cada una.',
      confirmLabel: 'Cambiar proporción',
    })
    if (!accepted) return
  }
  const saved = await store.updateSettings({ aspectRatio })
  if (saved && Object.keys(recropFailures.value).length === 0) show('Proporción cambiada')
}

function setItemsPerView(value: string): void {
  store.updateSettings({ itemsPerView: Number(value) as DesktopPhotosPerView })
}

function setSlideStep(value: string): void {
  store.updateSettings({ slideStep: value as SlideStep })
}

function setAutoplay(autoplay: boolean): void {
  store.updateSettings({ autoplay })
}
function setLoop(loop: boolean): void {
  store.updateSettings({ loop })
}
function setIntervalSeconds(event: Event): void {
  store.updateSettings({ autoplayIntervalSeconds: Number((event.target as HTMLInputElement).value) })
}

/* ---------- Adding photos ---------- */
const fileInput = ref<HTMLInputElement | null>(null)
const session = ref<EditorSession | null>(null)
const isDragOverDropzone = ref(false)

function openPicker(): void {
  if (!isBusy.value) fileInput.value?.click()
}

function openQueue(files: File[]): void {
  if (files.length === 0) return
  const { accepted, rejected } = partitionPhotoFiles(files)
  if (rejected.length === 1) {
    show(`«${rejected[0].name}» no se agregó. ${rejected[0].reason}`, 'error')
  } else if (rejected.length > 1) {
    const details = rejected.map(({ name, reason }) => `«${name}» (${reason.replace(/\.$/, '')})`).join(' · ')
    show(`No se agregaron ${rejected.length} archivos: ${details}`, 'error')
  }
  if (accepted.length > 0) session.value = { mode: 'add', files: accepted }
}

function onFilesPicked(event: Event): void {
  const input = event.target as HTMLInputElement
  openQueue(Array.from(input.files ?? []))
  input.value = ''
}

function onDropzoneDrop(event: DragEvent): void {
  isDragOverDropzone.value = false
  if (!isBusy.value) openQueue(Array.from(event.dataTransfer?.files ?? []))
}

/* ---------- Editing and removing ---------- */
function edit(photo: GalleryPhoto): void {
  session.value = { mode: 'edit', photo }
}

async function remove(photo: GalleryPhoto): Promise<void> {
  const accepted = await confirm({
    title: 'Eliminar foto',
    message: 'La foto dejará de mostrarse en el carrusel y sus archivos se eliminarán del servidor.',
    confirmLabel: 'Eliminar foto',
    variant: 'danger',
  })
  if (!accepted) return
  await store.removePhoto(photo.id)
  show('Foto eliminada')
}

/* ---------- Reordering ---------- */
const announcement = ref('')
const draggingId = ref<string | null>(null)
const dropIndex = ref<number | null>(null)

function photoLabel(photo: GalleryPhoto, index: number): string {
  return photo.title || photo.alt || `Foto ${index + 1}`
}

async function move(photo: GalleryPhoto, toIndex: number, focusSelector?: string): Promise<void> {
  if (toIndex < 0 || toIndex >= photos.value.length) return
  store.movePhoto(photo.id, toIndex)
  announcement.value = `Foto movida a la posición ${toIndex + 1} de ${photos.value.length}`
  if (!focusSelector) return
  await nextTick()
  // Keep keyboard focus on the moved photo; fall back to the other arrow at the list edges.
  const row = document.querySelector<HTMLElement>(`[data-photo-id="${photo.id}"]`)
  const target =
    row?.querySelector<HTMLButtonElement>(`${focusSelector}:not([disabled])`) ??
    row?.querySelector<HTMLButtonElement>('[data-move]:not([disabled])')
  target?.focus()
}

function onDragStart(event: DragEvent, photo: GalleryPhoto): void {
  draggingId.value = photo.id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', photo.id)
  }
}

function onDragOver(event: DragEvent, index: number): void {
  if (!draggingId.value) return
  event.preventDefault()
  const row = event.currentTarget as HTMLElement
  const { top, height } = row.getBoundingClientRect()
  dropIndex.value = event.clientY < top + height / 2 ? index : index + 1
}

function onDrop(): void {
  const id = draggingId.value
  const target = dropIndex.value
  endDrag()
  if (!id || target === null) return
  const from = photos.value.findIndex((photo) => photo.id === id)
  const photo = photos.value[from]
  if (!photo) return
  // Dropping below itself shifts the destination up by one once the photo leaves its slot.
  const toIndex = target > from ? target - 1 : target
  if (toIndex !== from) move(photo, toIndex)
}

function endDrag(): void {
  draggingId.value = null
  dropIndex.value = null
}

function altExcerpt(alt: string): string {
  return alt.length > 90 ? `${alt.slice(0, 90).trimEnd()}…` : alt
}

const switchClass =
  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-50'
const iconButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition outline-none hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex flex-col gap-6 p-5 [color-scheme:dark] min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto">
      <!-- Carousel settings -->
      <section
        class="flex flex-col gap-5 rounded-xl border border-[#1e293b] bg-[#111827] p-4"
        aria-labelledby="gallerySettingsHeading"
      >
        <h3
          id="gallerySettingsHeading"
          class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500"
        >
          Ajustes del carrusel
        </h3>

        <div class="flex flex-col gap-2">
          <span id="galleryRatioLabel" class="text-sm text-slate-200">Proporción</span>
          <div role="group" aria-labelledby="galleryRatioLabel" class="flex flex-wrap items-center gap-3">
            <SegmentedControl
              :model-value="settings.aspectRatio"
              :options="ratioOptions"
              size="sm"
              :class="isRecropping && 'pointer-events-none opacity-60'"
              class="font-mono"
              @update:model-value="changeRatio"
            />
            <span v-if="isRecropping" class="flex items-center gap-2 text-xs text-[#e5be48]">
              <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Recortando fotos…
            </span>
          </div>
          <p class="sr-only" aria-live="polite">{{ isRecropping ? 'Recortando fotos…' : '' }}</p>
        </div>

        <div class="flex flex-col gap-2">
          <span id="galleryDesktopItemsLabel" class="text-sm text-slate-200">Fotos en escritorio</span>
          <div role="group" aria-labelledby="galleryDesktopItemsLabel" class="flex flex-wrap items-center gap-3">
            <SegmentedControl
              :model-value="String(settings.itemsPerView)"
              :options="desktopItemsOptions"
              size="sm"
              @update:model-value="setItemsPerView"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span id="gallerySlideStepLabel" class="text-sm text-slate-200">Avance de fotos</span>
          <div role="group" aria-labelledby="gallerySlideStepLabel" class="flex flex-wrap items-center gap-3">
            <SegmentedControl
              :model-value="settings.slideStep"
              :options="slideStepOptions"
              size="sm"
              @update:model-value="setSlideStep"
            />
          </div>
        </div>

        <div class="flex items-center justify-between gap-4">
          <span id="galleryAutoplayLabel" class="text-sm text-slate-200">Reproducción automática</span>
          <button
            type="button"
            role="switch"
            :aria-checked="settings.autoplay"
            aria-labelledby="galleryAutoplayLabel"
            :class="[switchClass, settings.autoplay ? 'border-[#c5a059] bg-[#c5a059]' : 'border-[#334155] bg-[#0b0f17]']"
            @click="setAutoplay(!settings.autoplay)"
          >
            <span
              class="inline-block h-4 w-4 rounded-full transition-transform"
              :class="settings.autoplay ? 'translate-x-6 bg-[#0f172a]' : 'translate-x-1 bg-slate-400'"
            ></span>
          </button>
        </div>

        <div class="flex flex-col gap-2" :class="!settings.autoplay && 'opacity-50'">
          <div class="flex items-baseline justify-between gap-3">
            <label for="galleryInterval" class="text-sm text-slate-200">Pasar cada</label>
            <span class="font-mono text-sm text-slate-200 tabular-nums" aria-hidden="true">
              {{ settings.autoplayIntervalSeconds }} s
            </span>
          </div>
          <input
            id="galleryInterval"
            type="range"
            class="gallery-range w-full"
            :min="MIN_AUTOPLAY_INTERVAL_SECONDS"
            :max="MAX_AUTOPLAY_INTERVAL_SECONDS"
            step="1"
            :value="settings.autoplayIntervalSeconds"
            :disabled="!settings.autoplay"
            :aria-valuetext="`${settings.autoplayIntervalSeconds} segundos`"
            @input="setIntervalSeconds"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <span id="galleryLoopLabel" class="text-sm text-slate-200">Bucle infinito</span>
          <button
            type="button"
            role="switch"
            :aria-checked="settings.loop"
            aria-labelledby="galleryLoopLabel"
            :class="[switchClass, settings.loop ? 'border-[#c5a059] bg-[#c5a059]' : 'border-[#334155] bg-[#0b0f17]']"
            @click="setLoop(!settings.loop)"
          >
            <span
              class="inline-block h-4 w-4 rounded-full transition-transform"
              :class="settings.loop ? 'translate-x-6 bg-[#0f172a]' : 'translate-x-1 bg-slate-400'"
            ></span>
          </button>
        </div>
      </section>

      <!-- Photos -->
      <section class="flex flex-col gap-3" aria-labelledby="galleryPhotosHeading">
        <div class="flex items-center justify-between gap-3">
          <h3
            id="galleryPhotosHeading"
            class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500"
          >
            Fotos (<span class="font-mono tabular-nums">{{ photos.length }}</span>)
          </h3>
          <button
            v-if="photos.length > 0"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-[#c5a059]/40 px-3 py-1.5 text-sm font-semibold text-[#e5be48] transition outline-none hover:bg-[#c5a059]/10 focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isBusy"
            @click="openPicker"
          >
            <i class="fas fa-plus" aria-hidden="true"></i> Agregar fotos
          </button>
        </div>

        <input
          ref="fileInput"
          type="file"
          multiple
          :accept="accept"
          class="sr-only"
          tabindex="-1"
          aria-hidden="true"
          @change="onFilesPicked"
        />

        <button
          v-if="photos.length === 0"
          type="button"
          class="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-60"
          :class="isDragOverDropzone ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-[#1e293b] hover:border-[#c5a059]/60'"
          :disabled="isBusy"
          aria-describedby="galleryDropzoneHint"
          @click="openPicker"
          @dragenter.prevent="isDragOverDropzone = true"
          @dragover.prevent="isDragOverDropzone = true"
          @dragleave="isDragOverDropzone = false"
          @drop.prevent="onDropzoneDrop"
        >
          <i class="fas fa-images text-xl text-[#c5a059]" aria-hidden="true"></i>
          <span class="text-sm text-slate-300">Aún no hay fotos. Agrega la primera para armar el carrusel.</span>
          <span class="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[#e5be48]">
            <i class="fas fa-plus" aria-hidden="true"></i> Agregar fotos
          </span>
          <span id="galleryDropzoneHint" class="text-xs text-slate-500">
            o arrástralas aquí · .jpg, .png o .webp
          </span>
        </button>

        <ol v-else class="flex flex-col" @dragleave.self="dropIndex = null">
          <li
            v-for="(photo, index) in photos"
            :key="photo.id"
            :data-photo-id="photo.id"
            class="photo-row relative py-1"
            :class="{
              'drop-before': dropIndex === index && draggingId !== null,
              'drop-after': dropIndex === index + 1 && index === photos.length - 1 && draggingId !== null,
            }"
            @dragover="onDragOver($event, index)"
            @drop.prevent="onDrop"
          >
            <div
              class="flex items-center gap-3 rounded-lg border bg-[#111827] p-2 pr-1.5 transition"
              :class="[
                draggingId === photo.id ? 'opacity-40' : '',
                recropFailures[photo.id] ? 'border-amber-500/50' : 'border-[#1e293b]',
              ]"
            >
              <span
                class="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-base leading-none text-slate-500 select-none hover:text-slate-300 active:cursor-grabbing"
                draggable="true"
                title="Arrastra para reordenar"
                aria-hidden="true"
                @dragstart="onDragStart($event, photo)"
                @dragend="endDrag"
                >⠿</span
              >
              <img
                :src="photo.croppedPath"
                :alt="''"
                class="w-16 shrink-0 rounded-md bg-[#0b0f17] object-cover"
                :style="{ aspectRatio: thumbRatio }"
                loading="lazy"
                draggable="false"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm" :class="photo.title ? 'text-slate-100' : 'text-slate-500 italic'">
                  {{ photo.title || 'Sin título' }}
                </p>
                <p v-if="photo.alt" class="truncate text-xs text-slate-500" :title="photo.alt">{{ altExcerpt(photo.alt) }}</p>
                <p
                  v-if="recropFailures[photo.id]"
                  class="mt-1 inline-flex items-center gap-1.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[0.7rem] font-semibold text-amber-300"
                  :title="recropFailures[photo.id].join(' ')"
                >
                  <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
                  No se ajustó a la nueva proporción
                </p>
              </div>
              <div class="flex shrink-0 items-center">
                <button
                  type="button"
                  data-move="up"
                  :class="iconButton"
                  :disabled="index === 0 || isBusy"
                  :aria-label="`Subir «${photoLabel(photo, index)}»`"
                  @click="move(photo, index - 1, '[data-move=up]')"
                >
                  <i class="fas fa-arrow-up text-xs" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  data-move="down"
                  :class="iconButton"
                  :disabled="index === photos.length - 1 || isBusy"
                  :aria-label="`Bajar «${photoLabel(photo, index)}»`"
                  @click="move(photo, index + 1, '[data-move=down]')"
                >
                  <i class="fas fa-arrow-down text-xs" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  :class="iconButton"
                  :disabled="isBusy"
                  :aria-label="`Editar «${photoLabel(photo, index)}»`"
                  title="Editar"
                  @click="edit(photo)"
                >
                  <i class="fas fa-pen text-xs" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  :class="[iconButton, 'hover:!text-red-400']"
                  :disabled="isBusy"
                  :aria-label="`Eliminar foto «${photoLabel(photo, index)}»`"
                  title="Eliminar foto"
                  @click="remove(photo)"
                >
                  <i class="fas fa-trash-can text-xs" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </li>
        </ol>
        <p class="sr-only" aria-live="polite">{{ announcement }}</p>

        <ul
          v-if="errors.length > 0 && !isBusy && !session"
          class="flex flex-col gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
          aria-live="polite"
        >
          <li v-for="error in errors" :key="error" class="flex gap-2">
            <i class="fas fa-triangle-exclamation mt-0.5" aria-hidden="true"></i>
            <span>{{ error }}</span>
          </li>
        </ul>
      </section>
    </div>

    <PhotoEditorModal v-if="session" :session="session" @close="session = null" />
  </div>
</template>

<style scoped>
.gallery-range {
  accent-color: #c5a059;
}
.gallery-range:focus-visible {
  outline: 2px solid #c5a059;
  outline-offset: 2px;
}

/* Insertion marker while dragging a row. */
.photo-row.drop-before::before,
.photo-row.drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 1px;
  background: #c5a059;
}
.photo-row.drop-before::before {
  top: -1px;
}
.photo-row.drop-after::after {
  bottom: -1px;
}
</style>
