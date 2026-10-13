<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Cropper, type Coordinates } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { useGalleryStore } from '@/stores/gallery'
import { useToast } from '@/composables/useToast'
import { aspectRatioValue, centeredCrop } from '@/features/gallery/centeredCrop'
import { PHOTO_ALT_MAX_LENGTH, PHOTO_TITLE_MAX_LENGTH, photoMetadataSchema } from '@/schemas/gallery'
import { MAX_ZOOM, minimumCropSize, zoomLevel } from './cropZoom'
import { toCropperState, toServerTransform, visualFlip, type FlipAxis } from './cropperTransform'
import type { EditorSession } from './editorSession'
import { useDialogFocus } from './useDialogFocus'

interface Size {
  width: number
  height: number
}

/** Public methods plus the internal state the zoom slider reads. */
type CropperInstance = InstanceType<typeof Cropper> & { imageSize: Size }

const props = defineProps<{ session: EditorSession }>()
const emit = defineEmits<{ close: [] }>()

const store = useGalleryStore()
const { settings, isSaving, errors } = storeToRefs(store)
const { show } = useToast()

/* ---------- Session: queue of new files or one saved photo ---------- */
const queueIndex = ref(0)
const queue = computed(() => (props.session.mode === 'add' ? props.session.files : []))
const isQueue = computed(() => queue.value.length > 1)
const currentFile = computed(() => queue.value[queueIndex.value] ?? null)
const editedPhoto = computed(() => (props.session.mode === 'edit' ? props.session.photo : null))

const heading = computed(() => {
  if (editedPhoto.value) return 'Editar foto'
  return isQueue.value ? `Foto ${queueIndex.value + 1} de ${queue.value.length}` : 'Agregar foto'
})
const subheading = computed(() => currentFile.value?.name ?? editedPhoto.value?.title ?? '')

const objectUrl = ref<string | null>(null)
watch(
  currentFile,
  (file) => {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = file ? URL.createObjectURL(file) : null
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})
const imageSrc = computed(() => objectUrl.value ?? editedPhoto.value?.originalPath ?? '')
const cropperKey = computed(() => editedPhoto.value?.id ?? `queue-${queueIndex.value}`)

/* ---------- Metadata ---------- */
const title = ref(editedPhoto.value?.title ?? '')
const alt = ref(editedPhoto.value?.alt ?? '')
const showFieldErrors = ref(false)
const altInput = ref<HTMLInputElement | null>(null)

const metadataResult = computed(() => photoMetadataSchema.safeParse({ title: title.value, alt: alt.value }))
function fieldError(field: 'title' | 'alt'): string | null {
  if (!showFieldErrors.value || metadataResult.value.success) return null
  return metadataResult.value.error.issues.find((issue) => issue.path[0] === field)?.message ?? null
}
const titleError = computed(() => fieldError('title'))
const altError = computed(() => fieldError('alt'))

/* ---------- Cropper ---------- */
const cropper = ref<CropperInstance | null>(null)
const isReady = ref(false)
const loadFailed = ref(false)
const naturalSize = ref<Size | null>(null)
const imageSize = ref<Size | null>(null)
const coordinates = ref<Coordinates | null>(null)
const rotation = ref(0)

const ratioValue = computed(() => aspectRatioValue(settings.value.aspectRatio))
const savedState = computed(() => (editedPhoto.value ? toCropperState(editedPhoto.value.transform) : null))
const defaultTransforms = computed(() =>
  savedState.value ? { rotate: savedState.value.rotate, flip: savedState.value.flip } : undefined,
)
/** Saved photos reopen on their crop; new ones start on the largest centered crop (zoom 1×). */
const defaultSize = computed(() => {
  const crop = savedState.value?.coordinates
  if (crop) return { width: crop.width, height: crop.height }
  return ({ imageSize: size }: { imageSize: Size }) => {
    const { width, height } = centeredCrop(size.width, size.height, settings.value.aspectRatio, 0)
    return { width, height }
  }
})
const defaultPosition = computed(() => {
  const crop = savedState.value?.coordinates
  return crop ? { left: crop.left, top: crop.top } : undefined
})

/** Fixed stencil centered in the work area; the photo moves and zooms underneath it. */
function stencilSize({ boundaries }: { boundaries: Size }): Size {
  const available = { width: boundaries.width * 0.86, height: boundaries.height * 0.86 }
  return available.width / available.height > ratioValue.value
    ? { width: available.height * ratioValue.value, height: available.height }
    : { width: available.width, height: available.width / ratioValue.value }
}

const minCrop = computed(() =>
  imageSize.value ? minimumCropSize(imageSize.value, settings.value.aspectRatio) : { width: 0, height: 0 },
)
const zoom = computed(() =>
  imageSize.value && coordinates.value ? zoomLevel(coordinates.value, imageSize.value, settings.value.aspectRatio) : 1,
)
const zoomLabel = computed(() => `${zoom.value.toFixed(1)}×`)

function syncFromCropper(): void {
  const instance = cropper.value
  if (!instance) return
  const result = instance.getResult()
  coordinates.value = result.coordinates
  rotation.value = result.image.transforms.rotate
  imageSize.value = { ...instance.imageSize }
}

function onReady(): void {
  const result = cropper.value?.getResult()
  if (result) naturalSize.value = { width: result.image.width, height: result.image.height }
  isReady.value = true
  syncFromCropper()
}

function onError(): void {
  loadFailed.value = true
}

function setZoom(target: number): void {
  const clamped = Math.min(MAX_ZOOM, Math.max(1, target))
  if (!cropper.value || Math.abs(clamped - zoom.value) < 0.001) return
  cropper.value.zoom(clamped / zoom.value)
}
function onZoomInput(event: Event): void {
  setZoom(Number((event.target as HTMLInputElement).value))
}

function rotateBy(degrees: number): void {
  cropper.value?.rotate(degrees)
}
function flip(axis: FlipAxis): void {
  const { horizontal, vertical } = visualFlip(axis, rotation.value)
  cropper.value?.flip(horizontal, vertical)
}

/* ---------- Actions ---------- */
function resetForNext(): void {
  title.value = ''
  alt.value = ''
  showFieldErrors.value = false
  errors.value = []
  isReady.value = false
  loadFailed.value = false
  naturalSize.value = null
  imageSize.value = null
  coordinates.value = null
  rotation.value = 0
}

function advance(): void {
  if (queueIndex.value < queue.value.length - 1) {
    resetForNext()
    queueIndex.value += 1
  } else {
    close()
  }
}

function close(): void {
  if (isSaving.value) return
  errors.value = []
  emit('close')
}

function currentTransform() {
  const instance = cropper.value
  const orientedSize = editedPhoto.value
    ? { width: editedPhoto.value.originalWidth, height: editedPhoto.value.originalHeight }
    : naturalSize.value
  if (!instance || !orientedSize) return null
  const result = instance.getResult()
  return toServerTransform(
    {
      coordinates: result.coordinates,
      rotate: result.image.transforms.rotate,
      flip: { ...result.image.transforms.flip },
    },
    orientedSize,
  )
}

async function save(): Promise<void> {
  if (isSaving.value || !isReady.value) return
  if (!metadataResult.value.success) {
    showFieldErrors.value = true
    altInput.value?.focus()
    return
  }
  const transform = currentTransform()
  if (!transform) return
  const meta = { title: title.value, alt: alt.value }

  if (editedPhoto.value) {
    const updated = await store.updatePhoto(editedPhoto.value.id, { transform, ...meta })
    if (!updated) return
    show('Cambios guardados')
    close()
    return
  }

  if (!currentFile.value) return
  const added = await store.addPhoto(currentFile.value, transform, meta)
  if (!added) return
  show('Foto guardada')
  advance()
}

/* ---------- Dialog behavior ---------- */
const dialog = ref<HTMLElement | null>(null)
useDialogFocus(dialog, { onEscape: close })

// Only a press that starts on the backdrop closes the editor: dragging the photo
// and releasing outside the dialog must not discard the work.
let pressStartedOnBackdrop = false
function onBackdropPointerDown(event: PointerEvent): void {
  pressStartedOnBackdrop = event.target === event.currentTarget
}
function onBackdropClick(): void {
  if (pressStartedOnBackdrop) close()
  pressStartedOnBackdrop = false
}

const toolButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 transition outline-none hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-40'
const ghostButton =
  'h-10 rounded-lg border border-[#1e293b] px-4 text-sm font-semibold text-slate-300 transition outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-50'
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-2900 flex items-center justify-center bg-black/75 p-3 sm:p-6"
      @pointerdown="onBackdropPointerDown"
      @click.self="onBackdropClick"
    >
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photoEditorHeading"
        aria-describedby="photoEditorHint"
        class="flex max-h-full w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-[#1e293b] bg-[#111827] text-white shadow-2xl"
      >
        <!-- Header -->
        <header class="flex shrink-0 items-center justify-between gap-4 border-b border-[#1e293b] px-5 py-3.5">
          <div class="min-w-0">
            <h2 id="photoEditorHeading" class="text-base font-semibold text-slate-100">{{ heading }}</h2>
            <p v-if="subheading" class="truncate text-xs text-slate-500" :title="subheading">{{ subheading }}</p>
          </div>
          <button
            type="button"
            :class="toolButton"
            aria-label="Cerrar editor"
            :disabled="isSaving"
            @click="close"
          >
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <div class="grid min-h-0 flex-1 overflow-y-auto [color-scheme:dark] md:grid-cols-[minmax(0,1fr)_300px]">
          <!-- Crop work area -->
          <div class="flex min-w-0 flex-col border-[#1e293b] md:border-r">
            <div class="relative h-[min(52vh,300px)] bg-[#0b0f17] md:h-[min(60vh,480px)]">
              <Cropper
                v-if="imageSrc && !loadFailed"
                ref="cropper"
                :key="cropperKey"
                class="photo-cropper h-full w-full"
                :src="imageSrc"
                :check-orientation="false"
                :canvas="false"
                :stencil-size="stencilSize"
                :stencil-props="{
                  handlers: {},
                  movable: false,
                  resizable: false,
                  aspectRatio: ratioValue,
                }"
                image-restriction="stencil"
                :resize-image="{ adjustStencil: false }"
                :min-width="minCrop.width"
                :min-height="minCrop.height"
                :default-transforms="defaultTransforms"
                :default-size="defaultSize"
                :default-position="defaultPosition"
                :debounce="false"
                @ready="onReady"
                @change="syncFromCropper"
                @error="onError"
              />
              <div
                v-if="!isReady && !loadFailed"
                class="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <i class="fas fa-circle-notch fa-spin text-lg text-[#c5a059]" aria-hidden="true"></i>
                <span class="sr-only">Cargando foto…</span>
              </div>
              <div
                v-if="loadFailed"
                class="absolute inset-0 flex flex-col items-center justify-center gap-1 p-6 text-center"
              >
                <p class="text-sm text-slate-300">No se pudo cargar la foto.</p>
                <p class="text-xs text-slate-500">Revisa que el archivo sea una imagen válida.</p>
              </div>
              <div v-if="isSaving" class="absolute inset-0 cursor-wait" aria-hidden="true"></div>
            </div>

            <!-- Tools -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1e293b] px-4 py-2.5">
              <div class="flex items-center gap-0.5" role="group" aria-label="Girar">
                <button
                  type="button"
                  :class="toolButton"
                  :disabled="!isReady || isSaving"
                  aria-label="Girar a la izquierda"
                  title="Girar a la izquierda"
                  @click="rotateBy(-90)"
                >
                  <i class="fas fa-rotate-left" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  :class="toolButton"
                  :disabled="!isReady || isSaving"
                  aria-label="Girar a la derecha"
                  title="Girar a la derecha"
                  @click="rotateBy(90)"
                >
                  <i class="fas fa-rotate-right" aria-hidden="true"></i>
                </button>
              </div>
              <div class="flex items-center gap-0.5" role="group" aria-label="Voltear">
                <button
                  type="button"
                  :class="toolButton"
                  :disabled="!isReady || isSaving"
                  aria-label="Voltear horizontalmente"
                  title="Voltear horizontalmente"
                  @click="flip('horizontal')"
                >
                  <i class="fas fa-left-right" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  :class="toolButton"
                  :disabled="!isReady || isSaving"
                  aria-label="Voltear verticalmente"
                  title="Voltear verticalmente"
                  @click="flip('vertical')"
                >
                  <i class="fas fa-up-down" aria-hidden="true"></i>
                </button>
              </div>

              <div class="flex min-w-[200px] flex-1 items-center gap-1">
                <button
                  type="button"
                  :class="toolButton"
                  :disabled="!isReady || isSaving || zoom <= 1"
                  aria-label="Alejar"
                  @click="setZoom(zoom - 0.5)"
                >
                  <i class="fas fa-magnifying-glass-minus" aria-hidden="true"></i>
                </button>
                <input
                  type="range"
                  class="zoom-range min-w-0 flex-1"
                  min="1"
                  :max="MAX_ZOOM"
                  step="0.05"
                  :value="zoom"
                  :disabled="!isReady || isSaving"
                  aria-label="Zoom"
                  :aria-valuetext="zoomLabel"
                  @input="onZoomInput"
                />
                <button
                  type="button"
                  :class="toolButton"
                  :disabled="!isReady || isSaving || zoom >= MAX_ZOOM"
                  aria-label="Acercar"
                  @click="setZoom(zoom + 0.5)"
                >
                  <i class="fas fa-magnifying-glass-plus" aria-hidden="true"></i>
                </button>
                <span class="w-10 text-right font-mono text-xs text-slate-400 tabular-nums" aria-hidden="true">
                  {{ zoomLabel }}
                </span>
              </div>
            </div>
            <p id="photoEditorHint" class="px-4 pb-3 text-xs text-slate-500">
              Arrastra la foto para encuadrarla. Acércala con la rueda del ratón o con el control de zoom.
            </p>
          </div>

          <!-- Details -->
          <form class="flex flex-col gap-5 p-5" novalidate @submit.prevent="save">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-baseline justify-between gap-3">
                <label
                  for="photoTitle"
                  class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500"
                >
                  Título <span class="normal-case tracking-normal text-slate-600">(opcional)</span>
                </label>
                <span
                  class="font-mono text-xs tabular-nums"
                  :class="title.length > PHOTO_TITLE_MAX_LENGTH ? 'text-red-400' : 'text-slate-500'"
                  aria-hidden="true"
                >
                  {{ title.length }}/{{ PHOTO_TITLE_MAX_LENGTH }}
                </span>
              </div>
              <input
                id="photoTitle"
                v-model="title"
                type="text"
                placeholder="Ej. Sala de reuniones"
                :disabled="isSaving"
                :aria-invalid="titleError ? 'true' : undefined"
                :aria-describedby="titleError ? 'photoTitleError' : undefined"
                class="rounded-lg border bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
                :class="
                  titleError || title.length > PHOTO_TITLE_MAX_LENGTH
                    ? 'border-red-500'
                    : 'border-[#1e293b] focus:border-[#c5a059]'
                "
              />
              <p v-if="titleError" id="photoTitleError" class="text-xs text-red-400">{{ titleError }}</p>
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="flex items-baseline justify-between gap-3">
                <label for="photoAlt" class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">
                  Texto alternativo <span class="normal-case tracking-normal text-slate-600">(opcional)</span>
                </label>
                <span
                  class="font-mono text-xs tabular-nums"
                  :class="alt.length > PHOTO_ALT_MAX_LENGTH ? 'text-red-400' : 'text-slate-500'"
                  aria-hidden="true"
                >
                  {{ alt.length }}/{{ PHOTO_ALT_MAX_LENGTH }}
                </span>
              </div>
              <textarea
                id="photoAlt"
                ref="altInput"
                v-model="alt"
                rows="3"
                placeholder="Ej. Recepción del despacho con sillas de cuero y un escritorio de madera"
                :disabled="isSaving"
                :aria-invalid="altError ? 'true' : undefined"
                :aria-describedby="altError ? 'photoAltError photoAltHint' : 'photoAltHint'"
                class="resize-none rounded-lg border bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
                :class="altError ? 'border-red-500' : 'border-[#1e293b] focus:border-[#c5a059]'"
              ></textarea>
              <p id="photoAltHint" class="text-xs text-slate-500">Describe la foto para quien no puede verla.</p>
              <p v-if="altError" id="photoAltError" class="text-xs text-red-400">{{ altError }}</p>
            </div>

            <ul
              v-if="errors.length > 0 && !isSaving"
              class="flex flex-col gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
              aria-live="polite"
            >
              <li v-for="error in errors" :key="error" class="flex gap-2">
                <i class="fas fa-triangle-exclamation mt-0.5" aria-hidden="true"></i>
                <span>{{ error }}</span>
              </li>
            </ul>
          </form>
        </div>

        <!-- Actions -->
        <footer
          class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#1e293b] bg-[#0b0f17] px-5 py-3"
        >
          <p class="sr-only" aria-live="polite">{{ isSaving ? 'Guardando foto…' : '' }}</p>
          <button type="button" :class="ghostButton" :disabled="isSaving" @click="close">Cancelar</button>
          <button v-if="isQueue" type="button" :class="ghostButton" :disabled="isSaving" @click="advance">
            Omitir
          </button>
          <button
            type="button"
            class="btn-primary h-10 !rounded-lg !px-5 !py-0 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17] disabled:cursor-not-allowed disabled:!transform-none disabled:opacity-50 disabled:!shadow-none"
            :disabled="isSaving || !isReady"
            @click="save"
          >
            <i
              class="fas"
              :class="isSaving ? 'fa-circle-notch fa-spin' : 'fa-check'"
              aria-hidden="true"
            ></i>
            {{ editedPhoto ? 'Guardar cambios' : 'Guardar foto' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* The stencil frames the published crop: a hairline in the brand gold plus
   rule-of-thirds guides to help compose the shot. */
.photo-cropper :deep(.vue-advanced-cropper__background),
.photo-cropper :deep(.vue-advanced-cropper__foreground) {
  background: #0b0f17;
}
.photo-cropper :deep(.vue-advanced-cropper__foreground) {
  opacity: 0.72;
}
.photo-cropper :deep(.vue-rectangle-stencil) {
  outline: 1px solid #c5a059;
  cursor: grab;
}
.photo-cropper :deep(.vue-rectangle-stencil__preview)::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(to right, transparent calc(33.333% - 0.5px), rgb(255 255 255 / 0.28) calc(33.333% - 0.5px), rgb(255 255 255 / 0.28) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgb(255 255 255 / 0.28) calc(66.666% - 0.5px), rgb(255 255 255 / 0.28) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px)),
    linear-gradient(to bottom, transparent calc(33.333% - 0.5px), rgb(255 255 255 / 0.28) calc(33.333% - 0.5px), rgb(255 255 255 / 0.28) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgb(255 255 255 / 0.28) calc(66.666% - 0.5px), rgb(255 255 255 / 0.28) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px));
}

.zoom-range {
  accent-color: #c5a059;
}
.zoom-range:focus-visible {
  outline: 2px solid #c5a059;
  outline-offset: 2px;
}
</style>
