<script setup lang="ts">
import { computed, onBeforeUnmount, provide, watch } from 'vue'
import PortfolioPage from '@/features/portfolio/PortfolioPage.vue'
import type { ThemeConfig } from '@/types/theme'

const props = defineProps<{ config: ThemeConfig }>()

// Tell the portfolio subtree it is a non-interactive preview (header not fixed,
// theme toggle inert) so it can live inside a scrolling panel.
provide('previewMode', true)

const PREVIEW_FONT = 'PreviewUploadedFont'
const FALLBACK = "'Plus Jakarta Sans', sans-serif"
let fontStyleEl: HTMLStyleElement | null = null

// Inject/refresh an @font-face for the uploaded font, scoped to the preview.
watch(
  () => props.config.fontDataUrl,
  (dataUrl) => {
    if (!dataUrl) {
      if (fontStyleEl) {
        fontStyleEl.remove()
        fontStyleEl = null
      }
      return
    }
    if (!fontStyleEl) {
      fontStyleEl = document.createElement('style')
      document.head.appendChild(fontStyleEl)
    }
    fontStyleEl.textContent = `@font-face { font-family: '${PREVIEW_FONT}'; src: url(${dataUrl}); font-display: swap; }`
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (fontStyleEl) fontStyleEl.remove()
})

// The design tokens applied ONLY to this container's scope. Inline custom
// properties win over the [data-theme] rules, so the draft palette shows for
// either theme while data-theme keeps the correct semantic-alias mapping.
const containerStyle = computed(() => {
  const { palette, sizes, fontDataUrl } = props.config
  return {
    '--svc-color-1': palette.c1,
    '--svc-color-2': palette.c2,
    '--svc-color-3': palette.c3,
    '--svc-color-4': palette.c4,
    '--svc-color-5': palette.c5,
    '--size-titles': `${sizes.titles}px`,
    '--size-subtitles': `${sizes.subtitles}px`,
    '--size-body': `${sizes.body}px`,
    '--font-main': fontDataUrl ? `'${PREVIEW_FONT}', ${FALLBACK}` : FALLBACK,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-main)',
    // Body-size text inherits from this wrapper (the real <body> rule can't
    // reach the preview subtree), so drive it from the draft token here.
    fontSize: 'var(--size-body)',
  }
})
</script>

<template>
  <div class="h-full overflow-y-auto" :data-theme="config.theme" :style="containerStyle">
    <PortfolioPage />
  </div>
</template>
