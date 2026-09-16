<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

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

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
    dismiss()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
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
  window.removeEventListener('keydown', handleKeydown)
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
    <!-- Botón Saltar Intro -->
    <div class="loader-topbar">
      <div class="loader-brand-badge">
        <span class="badge-dot"></span>
        <span>ODA LEGAL &bull; Portafolio</span>
      </div>
      <button
        type="button"
        class="btn-skip-intro"
        aria-label="Saltar intro y entrar al sitio"
        @click="dismiss"
      >
        <span>Saltar</span>
        <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path
            fill-rule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
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

<style>
/* Contenedor Overlay Pantalla Completa */
.tangram-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background-color: #0b0f19;
  background-image: 
    radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(197, 160, 89, 0.12) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(6, 182, 212, 0.08) 0px, transparent 65%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  box-sizing: border-box;
  opacity: 1;
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
}

.tangram-loader-overlay.fade-out {
  opacity: 0;
  pointer-events: none;
}

/* Barra superior */
.loader-topbar {
  width: 100%;
  max-width: 1100px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 20;
}

.loader-brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.badge-dot {
  width: 7px;
  height: 7px;
  background-color: #c5a059;
  border-radius: 50%;
  box-shadow: 0 0 10px #c5a059;
}

.btn-skip-intro {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1.1rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  color: #cbd5e1;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.btn-skip-intro:hover {
  background: rgba(197, 160, 89, 0.2);
  border-color: rgba(197, 160, 89, 0.4);
  color: #ffffff;
  transform: translateX(2px);
}

/* Escenario Central y Escalador */
.loader-stage-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.tangram-scaler-wrapper {
  position: relative;
  flex-shrink: 0;
  margin: auto;
  overflow: visible;
  transition: width 0.12s ease-out, height 0.12s ease-out;
}

.tangram-board {
  position: absolute;
  top: 0;
  left: 0;
  width: 1040px;
  height: 860px;
  background: rgba(15, 23, 42, 0.75);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.7),
    inset 0 0 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  will-change: transform;
}

/* Figuras SVG del Tangram */
.tangram-figura {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 400px;
  height: 400px;
  overflow: visible;
  pointer-events: none;
}

.tangram-figura polygon {
  stroke: rgba(255, 255, 255, 0.85);
  stroke-width: 2px;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

/* Paleta de 5 colores de la página (ODA Legal Design Tokens) */
#figura-1 polygon { fill: var(--svc-color-4, #c5a059); } /* Color 4: Dorado ODA (Triángulo Grande 1) */
#figura-2 polygon { fill: var(--svc-color-3, #1e293b); } /* Color 3: Pizarra Profundo (Triángulo Grande 2) */
#figura-3 polygon { fill: var(--svc-color-1, #e4edf7); } /* Color 1: Azul Claro / Fondo (Triángulo Mediano) */
#figura-4 polygon { fill: var(--svc-color-5, #0f172a); } /* Color 5: Azul Noche / Contraste (Triángulo Pequeño 1) */
#figura-5 polygon { fill: var(--svc-color-4, #c5a059); } /* Color 4: Dorado ODA (Triángulo Pequeño 2) */
#figura-6 polygon { fill: var(--svc-color-2, #ffffff); } /* Color 2: Blanco / Superficie (Cuadrado) */
#figura-7 polygon { fill: var(--svc-color-2, #ffffff); } /* Color 2: Blanco / Superficie (Paralelogramo) */

/* Animación y transform-origins */
.anim-tx,
.anim-ty,
.anim-rot {
  animation-duration: 8.8s;
  animation-timing-function: cubic-bezier(0.35, 0, 0.25, 1);
  animation-fill-mode: forwards;
  will-change: transform;
}

#figura-1 .anim-tx  { animation-name: figura1-translateX; }
#figura-1 .anim-ty  { animation-name: figura1-translateY; }
#figura-1 .anim-rot {
  transform-origin: 200px 66.67px;
  animation-name: figura1-rotate;
}

#figura-2 .anim-tx  { animation-name: figura2-translateX; }
#figura-2 .anim-ty  { animation-name: figura2-translateY; }
#figura-2 .anim-rot {
  transform-origin: 66.67px 200px;
  animation-name: figura2-rotate;
}

#figura-3 .anim-tx  { animation-name: figura3-translateX; }
#figura-3 .anim-ty  { animation-name: figura3-translateY; }
#figura-3 .anim-rot {
  transform-origin: 333.33px 333.33px;
  animation-name: figura3-rotate;
}

#figura-4 .anim-tx  { animation-name: figura4-translateX; }
#figura-4 .anim-ty  { animation-name: figura4-translateY; }
#figura-4 .anim-rot {
  transform-origin: 200px 266.67px;
  animation-name: figura4-rotate;
}

#figura-5 .anim-tx  { animation-name: figura5-translateX; }
#figura-5 .anim-ty  { animation-name: figura5-translateY; }
#figura-5 .anim-rot {
  transform-origin: 366.67px 100px;
  animation-name: figura5-rotate;
}

#figura-6 .anim-tx  { animation-name: figura6-translateX; }
#figura-6 .anim-ty  { animation-name: figura6-translateY; }
#figura-6 .anim-rot {
  transform-origin: 300px 200px;
  animation-name: figura6-rotate;
}

#figura-7 .anim-tx  { animation-name: figura7-translateX; }
#figura-7 .anim-ty  { animation-name: figura7-translateY; }
#figura-7 .anim-rot {
  transform-origin: 150px 350px;
  animation-name: figura7-rotate;
}

/* ==========================================================================
   21 KEYFRAMES (FIGURA 164 -> FIGURA 29 -> FIGURA 7)
   ========================================================================== */

/* FIGURA 1 */
@keyframes figura1-translateX {
  0%, 15%   { transform: translateX(300px); }
  45%, 60%  { transform: translateX(311.78px); }
  88%, 100% { transform: translateX(-6.41px); }
}
@keyframes figura1-translateY {
  0%, 15%   { transform: translateY(10px); }
  45%, 60%  { transform: translateY(437.61px); }
  88%, 100% { transform: translateY(390.47px); }
}
@keyframes figura1-rotate {
  0%, 15%   { transform: rotate(0deg); }
  45%, 60%  { transform: rotate(225deg); }
  88%, 100% { transform: rotate(315deg); }
}

/* FIGURA 2 */
@keyframes figura2-translateX {
  0%, 15%   { transform: translateX(466.67px); }
  45%, 60%  { transform: translateX(350.83px); }
  88%, 100% { transform: translateX(739.75px); }
}
@keyframes figura2-translateY {
  0%, 15%   { transform: translateY(310px); }
  45%, 60%  { transform: translateY(398.56px); }
  88%, 100% { transform: translateY(257.14px); }
}
@keyframes figura2-rotate {
  0%, 15%   { transform: rotate(180deg); }
  45%, 60%  { transform: rotate(135deg); }
  88%, 100% { transform: rotate(135deg); }
}

/* FIGURA 3 */
@keyframes figura3-translateX {
  0%, 15%   { transform: translateX(133.33px); }
  45%, 60%  { transform: translateX(60.60px); }
  88%, 100% { transform: translateX(166.67px); }
}
@keyframes figura3-translateY {
  0%, 15%   { transform: translateY(310px); }
  45%, 60%  { transform: translateY(-111.90px); }
  88%, 100% { transform: translateY(123.81px); }
}
@keyframes figura3-rotate {
  0%, 15%   { transform: rotate(90deg); }
  45%, 60%  { transform: rotate(225deg); }
  88%, 100% { transform: rotate(405deg); }
}

/* FIGURA 4 */
@keyframes figura4-translateX {
  0%, 15%   { transform: translateX(233.33px); }
  45%, 60%  { transform: translateX(453.20px); }
  88%, 100% { transform: translateX(135.01px); }
}
@keyframes figura4-translateY {
  0%, 15%   { transform: translateY(143.33px); }
  45%, 60%  { transform: translateY(190.47px); }
  88%, 100% { transform: translateY(96.19px); }
}
@keyframes figura4-rotate {
  0%, 15%   { transform: rotate(90deg); }
  45%, 60%  { transform: rotate(315deg); }
  88%, 100% { transform: rotate(225deg); }
}

/* FIGURA 5 */
@keyframes figura5-translateX {
  0%, 15%   { transform: translateX(233.33px); }
  45%, 60%  { transform: translateX(333.68px); }
  88%, 100% { transform: translateX(156.91px); }
}
@keyframes figura5-translateY {
  0%, 15%   { transform: translateY(676.67px); }
  45%, 60%  { transform: translateY(545.70px); }
  88%, 100% { transform: translateY(215.72px); }
}
@keyframes figura5-rotate {
  0%, 15%   { transform: rotate(90deg); }
  45%, 60%  { transform: rotate(225deg); }
  88%, 100% { transform: rotate(135deg); }
}

/* FIGURA 6 */
@keyframes figura6-translateX {
  0%, 15%   { transform: translateX(200px); }
  45%, 60%  { transform: translateX(93.93px); }
  88%, 100% { transform: translateX(341.43px); }
}
@keyframes figura6-translateY {
  0%, 15%   { transform: translateY(110px); }
  45%, 60%  { transform: translateY(139.29px); }
  88%, 100% { transform: translateY(139.29px); }
}
@keyframes figura6-rotate {
  0%, 15%   { transform: rotate(0deg); }
  45%, 60%  { transform: rotate(45deg); }
  88%, 100% { transform: rotate(45deg); }
}

/* FIGURA 7 */
@keyframes figura7-translateX {
  0%, 15%   { transform: translateX(300px); }
  45%, 60%  { transform: translateX(526.77px); }
  88%, 100% { transform: translateX(279.29px); }
}
@keyframes figura7-translateY {
  0%, 15%   { transform: translateY(410px); }
  45%, 60%  { transform: translateY(201.42px); }
  88%, 100% { transform: translateY(-10.71px); }
}
@keyframes figura7-rotate {
  0%, 15%   { transform: rotate(0deg); }
  45%, 60%  { transform: rotate(135deg); }
  88%, 100% { transform: rotate(45deg); }
}

/* Barra de progreso inferior */
.loader-footer {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  z-index: 20;
}

.loader-progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

.loader-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #c5a059 0%, #3b82f6 50%, #06b6d4 100%);
  border-radius: 9999px;
  transition: width 0.08s linear;
  box-shadow: 0 0 10px rgba(197, 160, 89, 0.5);
}

.loader-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.loader-percentage {
  font-family: monospace;
  color: #c5a059;
  font-weight: 600;
}

@media (max-width: 640px) {
  .tangram-loader-overlay {
    padding: 1rem 0.75rem;
  }
  
  .loader-brand-badge {
    font-size: 0.7rem;
    padding: 0.35rem 0.75rem;
    gap: 0.4rem;
  }
  
  .btn-skip-intro {
    font-size: 0.75rem;
    padding: 0.35rem 0.8rem;
  }
  
  .loader-footer {
    max-width: 100%;
    padding: 0 0.5rem;
  }
}
</style>
