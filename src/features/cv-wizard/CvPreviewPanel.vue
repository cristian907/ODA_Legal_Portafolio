<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCvStore } from '@/stores/cv'
import { usePdfExport } from '@/composables/usePdfExport'
import { useToast } from '@/composables/useToast'
import CvPaper from './CvPaper.vue'

const cv = useCvStore()
const { exportSheet } = usePdfExport()
const { show } = useToast()

const viewport = ref<HTMLElement | null>(null)
const paper = ref<{ sheet: HTMLElement | null } | null>(null)
const zoom = ref(1)

const SHEET_W = 794
const SHEET_H = 1123

function sheetEl() {
  return paper.value?.sheet || null
}

function applyZoom() {
  const el = sheetEl()
  if (el) el.style.transform = `scale(${zoom.value})`
}

function autoFit() {
  if (!viewport.value) return
  const availW = viewport.value.clientWidth - 40
  const availH = viewport.value.clientHeight - 40
  zoom.value = Math.min(availW / SHEET_W, availH / SHEET_H, 1.05)
  applyZoom()
}

function adjustZoom(delta: number) {
  zoom.value = Math.min(1.5, Math.max(0.4, zoom.value + delta))
  applyZoom()
}

async function downloadPdf() {
  const p = cv.cvData.personal
  const filename = `Curriculum_${p.firstName || 'Candidato'}_${p.lastName || 'CV'}.pdf`.replace(/\s+/g, '_')
  show('Generando PDF...')
  try {
    await exportSheet(sheetEl(), filename)
    show('¡PDF descargado con éxito!')
  } catch {
    show('Error al generar el PDF', 'error')
  }
}

function onResize() {
  autoFit()
}

onMounted(() => {
  nextTick(autoFit)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

defineExpose({ autoFit, downloadPdf })
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Toolbar -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] px-5 py-3">
      <div class="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <i class="fas fa-file-invoice"></i> Vista Previa CV
      </div>
      <div class="flex items-center gap-2">
        <button
          class="rounded border border-[#1e293b] px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
          title="Reducir zoom"
          @click="adjustZoom(-0.1)"
        >
          <i class="fas fa-search-minus"></i>
        </button>
        <button
          class="rounded border border-[#1e293b] px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
          title="Ajustar a pantalla"
          @click="autoFit"
        >
          <i class="fas fa-expand"></i> Ajustar
        </button>
        <button
          class="rounded border border-[#1e293b] px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
          title="Aumentar zoom"
          @click="adjustZoom(0.1)"
        >
          <i class="fas fa-search-plus"></i>
        </button>
        <button
          class="rounded bg-[#c5a059] px-3 py-1.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#b38e44]"
          title="Descargar en PDF"
          @click="downloadPdf"
        >
          <i class="fas fa-file-pdf"></i> Descargar PDF
        </button>
      </div>
    </div>

    <!-- Scrollable A4 viewport -->
    <div
      ref="viewport"
      class="cv-preview-viewport flex min-h-0 flex-1 justify-center overflow-auto bg-[#0b0f17] p-5"
    >
      <div class="self-start">
        <CvPaper ref="paper" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv-preview-viewport :deep(.cv-paper-sheet) {
  transform-origin: top center;
  flex-shrink: 0;
}
</style>
