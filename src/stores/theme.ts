import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import {
  DEFAULT_PALETTES,
  DEFAULT_SIZES,
  STYLE_NAME_RE,
} from '@/shared/constants/palettes'
import {
  readJSON,
  readRaw,
  writeJSON,
  writeRaw,
  removeKey,
} from '@/composables/useLocalStorage'
import { setThemeAttribute, applyResolvedStyle } from '@/composables/useTheme'
import type {
  AppliedConfig,
  NameValidation,
  SavedStyle,
  ThemeConfig,
  ThemeName,
} from '@/types/theme'

type LibraryFilter = 'all' | ThemeName

function toThemeName(value: string | null, fallback: ThemeName = 'light'): ThemeName {
  return value === 'dark' || value === 'light' ? value : fallback
}

/**
 * Theme store — the reactive heart of the live theming system.
 *
 * Replaces the legacy admin.js module state + the iframe/postMessage preview:
 * the editor mutates reactive state here, and the live preview reads it
 * directly (no cross-document messaging).
 */
export const useThemeStore = defineStore('theme', () => {
  // ---- Site-facing state -------------------------------------------------
  const currentTheme = ref<ThemeName>('light')
  const themeDefault = ref<ThemeName>('light')
  const allowToggle = ref(true)
  const appliedLight = ref<AppliedConfig | null>(null)
  const appliedDark = ref<AppliedConfig | null>(null)

  // ---- Editor state ------------------------------------------------------
  const savedStyles = ref<SavedStyle[]>([])
  const activeLightId = ref<string | null>(null)
  const activeDarkId = ref<string | null>(null)
  const draft = ref<SavedStyle | null>(null)

  // Library UI state
  const librarySearch = ref('')
  const libraryThemeFilter = ref<LibraryFilter>('all')
  const libraryPage = ref(1)
  const PAGE_SIZE = 4

  // ---- Config resolution -------------------------------------------------
  function factoryConfig(theme: ThemeName): ThemeConfig {
    return {
      theme,
      palette: { ...DEFAULT_PALETTES[theme] },
      sizes: { ...DEFAULT_SIZES },
      fontDataUrl: null,
      fontName: null,
    }
  }

  function activeStyleForTheme(theme: ThemeName): SavedStyle | null {
    const id = theme === 'dark' ? activeDarkId.value : activeLightId.value
    return savedStyles.value.find((s) => s.id === id) || null
  }

  function getConfigForTheme(theme: ThemeName): ThemeConfig {
    const s = activeStyleForTheme(theme)
    if (s) {
      return {
        theme,
        palette: { ...s.palette },
        sizes: { ...s.sizes },
        fontDataUrl: s.fontDataUrl || null,
        fontName: s.fontName || null,
      }
    }
    const applied = theme === 'dark' ? appliedDark.value : appliedLight.value
    return applied ? { theme, ...applied } : factoryConfig(theme)
  }

  /** Config the live preview should show: the draft while editing, else default. */
  const previewConfig = computed<ThemeConfig>(() =>
    draft.value ? draft.value : getConfigForTheme(themeDefault.value),
  )

  // ---- Persistence -------------------------------------------------------
  function persistSavedStyles(): void {
    writeJSON(STORAGE_KEYS.SAVED_STYLES, savedStyles.value)
  }

  function persistAppliedForTheme(theme: ThemeName): void {
    const c = getConfigForTheme(theme)
    const applied: AppliedConfig = {
      palette: c.palette,
      sizes: c.sizes,
      fontDataUrl: c.fontDataUrl,
      fontName: c.fontName,
    }
    const key = theme === 'dark' ? STORAGE_KEYS.APPLIED_DARK : STORAGE_KEYS.APPLIED_LIGHT
    writeJSON(key, applied)
    if (theme === 'dark') appliedDark.value = applied
    else appliedLight.value = applied

    const id = theme === 'dark' ? activeDarkId.value : activeLightId.value
    const idKey = theme === 'dark' ? STORAGE_KEYS.ACTIVE_STYLE_DARK : STORAGE_KEYS.ACTIVE_STYLE_LIGHT
    if (id) writeRaw(idKey, id)
    else removeKey(idKey)
  }

  /** Each slot may only hold a style of its own theme; free stale slots. */
  function reconcileSlots(): void {
    const l = savedStyles.value.find((s) => s.id === activeLightId.value)
    if (activeLightId.value && (!l || l.theme !== 'light')) {
      activeLightId.value = null
      persistAppliedForTheme('light')
    }
    const d = savedStyles.value.find((s) => s.id === activeDarkId.value)
    if (activeDarkId.value && (!d || d.theme !== 'dark')) {
      activeDarkId.value = null
      persistAppliedForTheme('dark')
    }
  }

  /** Assign a style to its slot and make it the default mode. */
  function applyStyleToSite(style: SavedStyle): void {
    if (style.theme === 'dark') activeDarkId.value = style.id
    else activeLightId.value = style.id
    themeDefault.value = style.theme
    writeRaw(STORAGE_KEYS.THEME_DEFAULT, themeDefault.value)
    writeRaw(STORAGE_KEYS.THEME_CURRENT, themeDefault.value)
    persistAppliedForTheme(style.theme)
    reconcileSlots()
  }

  // ---- Applying tokens to the document (site side) -----------------------
  function applyCurrent(): void {
    setThemeAttribute(currentTheme.value)
    applyResolvedStyle(getConfigForTheme(currentTheme.value))
  }

  // ---- Init paths --------------------------------------------------------
  function initFromStorage(): void {
    loadEditorState()
    themeDefault.value = toThemeName(readRaw(STORAGE_KEYS.THEME_DEFAULT, 'light'))
    allowToggle.value = readRaw(STORAGE_KEYS.THEME_ALLOW_TOGGLE, 'true') !== 'false'
    appliedLight.value = readJSON<AppliedConfig | null>(STORAGE_KEYS.APPLIED_LIGHT, null)
    appliedDark.value = readJSON<AppliedConfig | null>(STORAGE_KEYS.APPLIED_DARK, null)

    if (!allowToggle.value) {
      currentTheme.value = themeDefault.value
    } else {
      currentTheme.value = toThemeName(readRaw(STORAGE_KEYS.THEME_CURRENT, null), themeDefault.value)
    }
    applyCurrent()
  }

  function loadEditorState(): void {
    savedStyles.value = readJSON<SavedStyle[]>(STORAGE_KEYS.SAVED_STYLES, [])
    activeLightId.value = readRaw(STORAGE_KEYS.ACTIVE_STYLE_LIGHT, null)
    activeDarkId.value = readRaw(STORAGE_KEYS.ACTIVE_STYLE_DARK, null)
    themeDefault.value = toThemeName(readRaw(STORAGE_KEYS.THEME_DEFAULT, 'light'))
    allowToggle.value = readRaw(STORAGE_KEYS.THEME_ALLOW_TOGGLE, 'true') !== 'false'

    migrateLegacyActive()
    reconcileSlots()
  }

  function migrateLegacyActive(): void {
    const legacy = readRaw(STORAGE_KEYS.LEGACY_ACTIVE_STYLE, null)
    if (legacy && !activeLightId.value && !activeDarkId.value) {
      const s = savedStyles.value.find((x) => x.id === legacy)
      if (s) {
        if (s.theme === 'dark') activeDarkId.value = s.id
        else activeLightId.value = s.id
        persistAppliedForTheme(s.theme)
      }
    }
    removeKey(STORAGE_KEYS.LEGACY_ACTIVE_STYLE)
  }

  // ---- Visitor toggle ----------------------------------------------------
  function toggleTheme(): void {
    if (!allowToggle.value) return
    currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
    writeRaw(STORAGE_KEYS.THEME_CURRENT, currentTheme.value)
    applyCurrent()
  }

  // ---- Policy (general view) ---------------------------------------------
  function setThemeDefault(mode: ThemeName): void {
    themeDefault.value = mode
    writeRaw(STORAGE_KEYS.THEME_DEFAULT, mode)
    writeRaw(STORAGE_KEYS.THEME_CURRENT, mode)
  }

  function setAllowToggle(value: boolean): void {
    allowToggle.value = value
    writeRaw(STORAGE_KEYS.THEME_ALLOW_TOGGLE, String(value))
  }

  // ---- Library helpers ---------------------------------------------------
  const isActive = (id: string | null): boolean =>
    id !== null && (id === activeLightId.value || id === activeDarkId.value)

  const filteredStyles = computed<SavedStyle[]>(() => {
    let list = savedStyles.value
    if (libraryThemeFilter.value !== 'all') {
      list = list.filter((s) => s.theme === libraryThemeFilter.value)
    }
    const term = librarySearch.value.trim().toLowerCase()
    if (term) list = list.filter((s) => s.name.toLowerCase().includes(term))
    return list
  })

  const totalLibraryPages = computed(() =>
    Math.max(1, Math.ceil(filteredStyles.value.length / PAGE_SIZE)),
  )

  const pagedStyles = computed<SavedStyle[]>(() => {
    const page = Math.min(libraryPage.value, totalLibraryPages.value)
    const start = (page - 1) * PAGE_SIZE
    return filteredStyles.value.slice(start, start + PAGE_SIZE)
  })

  // ---- Name validation ---------------------------------------------------
  function validateStyleName(value: string): NameValidation {
    const name = (value || '').trim()
    if (!name) return { ok: true, message: null }
    if (name.length < 2) return { ok: false, message: 'Usa al menos 2 caracteres.' }
    if (name.length > 40) return { ok: false, message: 'Máximo 40 caracteres.' }
    if (!STYLE_NAME_RE.test(name))
      return { ok: false, message: 'Solo letras, números, espacios, guiones y numeral (#).' }
    const currentId = draft.value ? draft.value.id : null
    const dup = savedStyles.value.some(
      (s) => s.id !== currentId && s.name.toLowerCase() === name.toLowerCase(),
    )
    if (dup) return { ok: false, message: 'Ya existe un estilo con ese nombre.' }
    return { ok: true, message: null }
  }

  // ---- Draft lifecycle ---------------------------------------------------
  function openDraft(style: SavedStyle | null = null, presetTheme: ThemeName = 'light'): void {
    if (style) {
      draft.value = {
        id: style.id,
        name: style.name,
        theme: style.theme,
        palette: { ...style.palette },
        sizes: { ...style.sizes },
        fontDataUrl: style.fontDataUrl || null,
        fontName: style.fontName || null,
      }
    } else {
      const theme = presetTheme || 'light'
      draft.value = {
        id: null,
        name: '',
        theme,
        palette: { ...DEFAULT_PALETTES[theme] },
        sizes: { ...DEFAULT_SIZES },
        fontDataUrl: null,
        fontName: null,
      }
    }
  }

  function closeDraft(): void {
    draft.value = null
  }

  function setDraftTheme(theme: ThemeName): void {
    if (!draft.value) return
    draft.value.theme = theme
    draft.value.palette = { ...DEFAULT_PALETTES[theme] }
  }

  interface SaveResult {
    ok: boolean
    name?: string
    message?: string | null
  }

  /** Persists + activates on success. */
  function saveDraft(typedName: string): SaveResult {
    if (!draft.value) return { ok: false, message: 'No hay borrador activo.' }
    const check = validateStyleName(typedName)
    if (!check.ok) return check

    const name =
      (typedName || '').trim() ||
      `Estilo ${draft.value.theme === 'dark' ? 'Oscuro' : 'Claro'} #${savedStyles.value.length + 1}`
    draft.value.name = name

    if (draft.value.id) {
      const idx = savedStyles.value.findIndex((s) => s.id === draft.value!.id)
      if (idx !== -1) savedStyles.value[idx] = { ...draft.value }
    } else {
      draft.value.id = `style_${Date.now()}`
      savedStyles.value.unshift({ ...draft.value })
      libraryPage.value = 1
    }

    persistSavedStyles()
    const saved = savedStyles.value.find((s) => s.id === draft.value!.id)
    if (saved) applyStyleToSite(saved)
    const savedName = draft.value.name
    draft.value = null
    return { ok: true, name: savedName }
  }

  function activateStyle(style: SavedStyle): string {
    applyStyleToSite(style)
    return style.theme === 'dark' ? 'oscuro' : 'claro'
  }

  function deleteStyle(style: SavedStyle): void {
    savedStyles.value = savedStyles.value.filter((s) => s.id !== style.id)
    persistSavedStyles()
    if (style.id === activeLightId.value) {
      activeLightId.value = null
      persistAppliedForTheme('light')
    }
    if (style.id === activeDarkId.value) {
      activeDarkId.value = null
      persistAppliedForTheme('dark')
    }
  }

  function resetAll(): void {
    activeLightId.value = null
    activeDarkId.value = null
    themeDefault.value = 'light'
    allowToggle.value = true
    writeRaw(STORAGE_KEYS.THEME_DEFAULT, 'light')
    writeRaw(STORAGE_KEYS.THEME_CURRENT, 'light')
    writeRaw(STORAGE_KEYS.THEME_ALLOW_TOGGLE, 'true')
    persistAppliedForTheme('light')
    persistAppliedForTheme('dark')
  }

  return {
    currentTheme,
    themeDefault,
    allowToggle,
    appliedLight,
    appliedDark,
    savedStyles,
    activeLightId,
    activeDarkId,
    draft,
    librarySearch,
    libraryThemeFilter,
    libraryPage,
    PAGE_SIZE,
    previewConfig,
    filteredStyles,
    totalLibraryPages,
    pagedStyles,
    isActive,
    activeStyleForTheme,
    getConfigForTheme,
    initFromStorage,
    loadEditorState,
    applyCurrent,
    toggleTheme,
    setThemeDefault,
    setAllowToggle,
    validateStyleName,
    openDraft,
    closeDraft,
    setDraftTheme,
    saveDraft,
    activateStyle,
    deleteStyle,
    resetAll,
  }
})
