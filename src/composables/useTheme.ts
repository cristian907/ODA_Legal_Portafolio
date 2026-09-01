import { PALETTE_VARS, SIZE_VARS } from '@/shared/constants/palettes'
import type { Palette, Sizes, ThemeName, ThemeConfig } from '@/types/theme'

// Imperative helpers that write the design tokens onto <html>. These are the
// ONLY place that touches document styles for theming — stores call them so the
// live site and the editor preview stay in sync through reactive state.

const FONT_STYLE_ID = 'customFontStyle'
const CUSTOM_FONT_NAME = 'CustomUploadedFont'
const FALLBACK_FONT = "'Plus Jakarta Sans', sans-serif"

const root = (): HTMLElement => document.documentElement

/** Set data-theme (light | dark) on <html>. */
export function setThemeAttribute(theme: ThemeName): void {
  root().setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
}

/** Apply a { c1..c5 } palette to the CSS custom properties. */
export function applyPalette(palette: Palette): void {
  const style = root().style
  ;(Object.keys(PALETTE_VARS) as (keyof Palette)[]).forEach((key) => {
    if (palette[key]) style.setProperty(PALETTE_VARS[key], palette[key])
  })
}

/** Apply { titles, subtitles, body } sizes (numbers → px). */
export function applySizes(sizes: Sizes): void {
  const style = root().style
  ;(Object.keys(SIZE_VARS) as (keyof Sizes)[]).forEach((key) => {
    if (sizes[key] != null) style.setProperty(SIZE_VARS[key], `${sizes[key]}px`)
  })
}

/**
 * Inject (or remove) an uploaded font as @font-face and point --font-main at it.
 * Passing a falsy dataUrl restores the fallback font.
 */
export function applyFont(dataUrl: string | null): void {
  const doc = document
  let styleEl = doc.getElementById(FONT_STYLE_ID) as HTMLStyleElement | null

  if (!dataUrl) {
    if (styleEl) styleEl.remove()
    root().style.setProperty('--font-main', FALLBACK_FONT)
    return
  }

  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.id = FONT_STYLE_ID
    doc.head.appendChild(styleEl)
  }
  styleEl.textContent = `@font-face { font-family: '${CUSTOM_FONT_NAME}'; src: url(${dataUrl}); font-display: swap; }`
  root().style.setProperty('--font-main', `'${CUSTOM_FONT_NAME}', ${FALLBACK_FONT}`)
}

/** Apply a full resolved config { palette, sizes, fontDataUrl } at once. */
export function applyResolvedStyle(config: ThemeConfig): void {
  applyPalette(config.palette)
  applySizes(config.sizes)
  applyFont(config.fontDataUrl)
}
