export type ThemeName = 'light' | 'dark'

/** The five base colors that drive the whole site palette. */
export interface Palette {
  c1: string
  c2: string
  c3: string
  c4: string
  c5: string
}

export type PaletteKey = keyof Palette

/** Themeable text sizes, in pixels. */
export interface Sizes {
  titles: number
  subtitles: number
  body: number
}

export type SizeKey = keyof Sizes

/** A saved style in the library. `id` is null only while drafting a new one. */
export interface SavedStyle {
  id: string | null
  name: string
  theme: ThemeName
  palette: Palette
  sizes: Sizes
  fontDataUrl: string | null
  fontName: string | null
}

/** A resolved style config the site renders for a given theme. */
export interface ThemeConfig {
  theme: ThemeName
  palette: Palette
  sizes: Sizes
  fontDataUrl: string | null
  fontName: string | null
}

/** The persisted `oda_applied_*` shape the site reads on boot. */
export interface AppliedConfig {
  palette: Palette
  sizes: Sizes
  fontDataUrl: string | null
  fontName: string | null
}

export interface NameValidation {
  ok: boolean
  message: string | null
}
