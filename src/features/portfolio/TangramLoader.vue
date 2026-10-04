<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'ODA LEGAL • Portafolio',
  },
)

const emit = defineEmits<{
  (e: 'finished'): void
}>()

// Duración total de la animación en milisegundos (8.8 segundos para la secuencia completa)
const ANIMATION_DURATION_MS = 8800
const FADE_DURATION_MS = 700

const isFading = ref(false)
const isVisible = ref(true)
const progress = ref(0)
const stageRef = ref<HTMLElement | null>(null)
const scale = ref(0.7)

let timerId: number | null = null
let progressInterval: number | null = null
let resizeObserver: ResizeObserver | null = null

function updateScale() {
  if (!stageRef.value) return
  const rect = stageRef.value.getBoundingClientRect()
  // Usamos 92% del espacio disponible para dejar un margen visual elegante
  const availableW = rect.width * 0.94
  const availableH = rect.height * 0.94
  if (availableW <= 0 || availableH <= 0) return

  const scaleX = availableW / 1040
  const scaleY = availableH / 860
  // Se adapta fluidamente desde pantallas ultra-compactas (0.15) hasta pantallas 4K (máximo 0.85)
  scale.value = Math.max(0.15, Math.min(scaleX, scaleY, 0.85))
}

function dismiss() {
  if (isFading.value) return
  isFading.value = true
  if (timerId) clearTimeout(timerId)
  if (progressInterval) clearInterval(progressInterval)

  setTimeout(() => {
    isVisible.value = false
    emit('finished')
  }, FADE_DURATION_MS)
}

onMounted(() => {
  window.addEventListener('resize', updateScale)

  if (stageRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateScale()
    })
    resizeObserver.observe(stageRef.value)
  }
  updateScale()

  // Barra de progreso sincronizada con el tiempo de carga
  const startTime = Date.now()
  progressInterval = window.setInterval(() => {
    const elapsed = Date.now() - startTime
    const p = Math.min(100, Math.round((elapsed / ANIMATION_DURATION_MS) * 100))
    progress.value = p
    if (p >= 100 && progressInterval) {
      clearInterval(progressInterval)
    }
  }, 50)

  // Cierre automático al culminar la animación
  timerId = window.setTimeout(() => {
    dismiss()
  }, ANIMATION_DURATION_MS)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (timerId) clearTimeout(timerId)
  if (progressInterval) clearInterval(progressInterval)
})
</script>

<template>
  <div
    v-if="isVisible"
    class="tangram-loader-overlay"
    :class="{ 'fade-out': isFading }"
    role="dialog"
    aria-label="Pantalla de carga con animación Tangram"
    aria-modal="true"
  >
    <!-- Barra superior -->
    <div class="loader-topbar">
      <div class="loader-brand-badge">
        <span class="badge-dot"></span>
        <span>{{ title }}</span>
      </div>
    </div>

    <!-- Escenario central del Tangram con escalado responsivo -->
    <div ref="stageRef" class="loader-stage-center">
      <div
        class="tangram-scaler-wrapper"
        :style="{
          width: `${(1040 * scale).toFixed(1)}px`,
          height: `${(860 * scale).toFixed(1)}px`,
        }"
      >
        <div
          class="tangram-board"
          id="loader-tablero-tangram"
          :style="{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }"
        >

          <!-- FIGURA 1: Triángulo Grande 1 -->
          <svg class="tangram-figura figura-1" id="figura-1" viewBox="0 0 400 400" aria-hidden="true">
            <g class="anim-tx">
              <g class="anim-ty">
                <g class="anim-rot">
                  <polygon points="0,0 400,0 200,200" />
                </g>
              </g>
            </g>
          </svg>

          <!-- FIGURA 2: Triángulo Grande 2 -->
          <svg class="tangram-figura figura-2" id="figura-2" viewBox="0 0 400 400" aria-hidden="true">
            <g class="anim-tx">
              <g class="anim-ty">
                <g class="anim-rot">
                  <polygon points="0,0 200,200 0,400" />
                </g>
              </g>
            </g>
          </svg>

          <!-- FIGURA 3: Triángulo Mediano -->
          <svg class="tangram-figura figura-3" id="figura-3" viewBox="0 0 400 400" aria-hidden="true">
            <g class="anim-tx">
              <g class="anim-ty">
                <g class="anim-rot">
                  <polygon points="200,400 400,400 400,200" />
                </g>
              </g>
            </g>
          </svg>

          <!-- FIGURA 4: Triángulo Pequeño 1 -->
          <svg class="tangram-figura figura-4" id="figura-4" viewBox="0 0 400 400" aria-hidden="true">
            <g class="anim-tx">
              <g class="anim-ty">
                <g class="anim-rot">
                  <polygon points="200,200 300,300 100,300" />
                </g>
              </g>
            </g>
          </svg>

          <!-- FIGURA 5: Triángulo Pequeño 2 -->
          <svg class="tangram-figura figura-5" id="figura-5" viewBox="0 0 400 400" aria-hidden="true">
            <g class="anim-tx">
              <g class="anim-ty">
                <g class="anim-rot">
                  <polygon points="300,100 400,200 400,0" />
                </g>
              </g>
            </g>
          </svg>

          <!-- FIGURA 6: Cuadrado -->
          <svg class="tangram-figura figura-6" id="figura-6" viewBox="0 0 400 400" aria-hidden="true">
            <g class="anim-tx">
              <g class="anim-ty">
                <g class="anim-rot">
                  <polygon points="200,200 300,100 400,200 300,300" />
                </g>
              </g>
            </g>
          </svg>

          <!-- FIGURA 7: Paralelogramo -->
          <svg class="tangram-figura figura-7" id="figura-7" viewBox="0 0 400 400" aria-hidden="true">
            <g class="anim-tx">
              <g class="anim-ty">
                <g class="anim-rot">
                  <polygon points="0,400 200,400 300,300 100,300" />
                </g>
              </g>
            </g>
          </svg>

        </div>
      </div>
    </div>

    <!-- Barra de progreso e indicadores inferiores -->
    <div class="loader-footer">
      <div class="loader-progress-track">
        <div class="loader-progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="loader-status-row">
        <span class="loader-status-text">Cargando experiencia...</span>
        <span class="loader-percentage">{{ progress }}%</span>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/tangram-loader.css"></style>
