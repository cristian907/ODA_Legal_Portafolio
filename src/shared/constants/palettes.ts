import type { Palette, PaletteKey, Sizes, SizeKey, ThemeName } from '@/types/theme'

// Unified factory palettes + size bounds.
// Previously duplicated across js/main.js and js/admin.js — now a single source.

export const DEFAULT_PALETTES: Record<ThemeName, Palette> = {
  light: { c1: '#e4edf7', c2: '#ffffff', c3: '#1e293b', c4: '#c5a059', c5: '#0f172a' },
  dark: { c1: '#0f172a', c2: '#1e293b', c3: '#f8fafc', c4: '#d4af37', c5: '#e5be48' },
}

export const DEFAULT_SIZES: Sizes = {
  titles: 40,
  subtitles: 20,
  body: 16,
}

export interface SizeBound {
  min: number
  max: number
  default: number
}

// Min/max/default for each themeable text size (px).
export const SIZE_BOUNDS: Record<SizeKey, SizeBound> = {
  titles: { min: 16, max: 140, default: 40 },
  subtitles: { min: 12, max: 80, default: 20 },
  body: { min: 8, max: 40, default: 16 },
}

// Palette keys mapped to the CSS custom properties they drive.
export const PALETTE_VARS: Record<PaletteKey, string> = {
  c1: '--svc-color-1',
  c2: '--svc-color-2',
  c3: '--svc-color-3',
  c4: '--svc-color-4',
  c5: '--svc-color-5',
}

export const SIZE_VARS: Record<SizeKey, string> = {
  titles: '--size-titles',
  subtitles: '--size-subtitles',
  body: '--size-body',
}

// Validation helpers shared by the theme editor.
export const HEX_RE = /^#([0-9A-F]{3}){1,2}$/i
export const STYLE_NAME_RE = /^[\p{L}\p{N} _#-]+$/u
