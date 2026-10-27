import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useThemeStore } from './theme'
import type { SavedStyle } from '@/types/theme'

vi.mock('@/composables/useTheme', () => ({
  setThemeAttribute: vi.fn(),
  applyResolvedStyle: vi.fn(),
}))

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length(): number {
    return this.values.size
  }
  clear(): void {
    this.values.clear()
  }
  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }
  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.values.delete(key)
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

function sampleStyle(id: string, name: string, theme: 'light' | 'dark' = 'light'): SavedStyle {
  return {
    id,
    name,
    theme,
    palette: { c1: '#fff', c2: '#fff', c3: '#000', c4: '#c5a059', c5: '#000' },
    sizes: { titles: 40, subtitles: 20, body: 16 },
    fontDataUrl: null,
    fontName: null,
  }
}

describe('useThemeStore validations and naming', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
    setActivePinia(createPinia())
  })

  describe('validateStyleName', () => {
    it('accepts empty names since it is optional', () => {
      const store = useThemeStore()
      expect(store.validateStyleName('')).toEqual({ ok: true, message: null })
      expect(store.validateStyleName('   ')).toEqual({ ok: true, message: null })
    })

    it('rejects names shorter than 2 characters', () => {
      const store = useThemeStore()
      expect(store.validateStyleName('A')).toEqual({
        ok: false,
        message: 'Usa al menos 2 caracteres.',
      })
    })

    it('rejects names longer than 40 characters', () => {
      const store = useThemeStore()
      const longName = 'A'.repeat(41)
      expect(store.validateStyleName(longName)).toEqual({
        ok: false,
        message: 'Máximo 40 caracteres.',
      })
    })

    it('rejects characters not allowed by STYLE_NAME_RE', () => {
      const store = useThemeStore()
      expect(store.validateStyleName('Estilo <Test>')).toEqual({
        ok: false,
        message: 'Solo letras, números, espacios, guiones y numeral (#).',
      })
      expect(store.validateStyleName('Estilo @ Legal')).toEqual({
        ok: false,
        message: 'Solo letras, números, espacios, guiones y numeral (#).',
      })
    })

    it('detects duplicate style names case-insensitively', () => {
      const store = useThemeStore()
      store.savedStyles.push(sampleStyle('s1', 'Dorado Clásico'))

      const exact = store.validateStyleName('Dorado Clásico')
      expect(exact.ok).toBe(false)
      expect(exact.message).toBe('Ya existe un estilo con ese nombre.')

      const lower = store.validateStyleName('dorado clásico')
      expect(lower.ok).toBe(false)
      expect(lower.message).toBe('Ya existe un estilo con ese nombre.')

      const distinct = store.validateStyleName('Dorado Moderno')
      expect(distinct.ok).toBe(true)
    })

    it('allows keeping the same name when editing the existing style', () => {
      const store = useThemeStore()
      const existing = sampleStyle('s1', 'Estilo Actual')
      store.savedStyles.push(existing)
      store.openDraft(existing)

      const check = store.validateStyleName('Estilo Actual')
      expect(check.ok).toBe(true)
      expect(check.message).toBe(null)
    })
  })

  describe('defaultStyleName', () => {
    it('generates sequential default names starting from #1', () => {
      const store = useThemeStore()
      expect(store.defaultStyleName('light')).toBe('Estilo Claro #1')
      expect(store.defaultStyleName('dark')).toBe('Estilo Oscuro #1')
    })

    it('finds the next available number without colliding with existing styles', () => {
      const store = useThemeStore()
      store.savedStyles.push(sampleStyle('s1', 'Estilo Claro #1', 'light'))

      expect(store.defaultStyleName('light')).toBe('Estilo Claro #2')
    })

    it('fills gaps or handles deletions properly without duplicates', () => {
      const store = useThemeStore()
      // Suppose #1 was deleted and only #2 exists
      store.savedStyles.push(sampleStyle('s2', 'Estilo Claro #2', 'light'))

      // It should safely use #1 since it is available
      expect(store.defaultStyleName('light')).toBe('Estilo Claro #1')

      // Add #1 as well
      store.savedStyles.push(sampleStyle('s1', 'Estilo Claro #1', 'light'))
      // Now next available is #3
      expect(store.defaultStyleName('light')).toBe('Estilo Claro #3')
    })

    it('does not collide with manually named styles that follow the default pattern', () => {
      const store = useThemeStore()
      store.savedStyles.push(sampleStyle('s1', 'Estilo Claro #1', 'light'))
      store.savedStyles.push(sampleStyle('s2', 'Estilo Claro #2', 'light'))

      expect(store.defaultStyleName('light')).toBe('Estilo Claro #3')
    })
  })

  describe('saveDraft with uniqueness guarantee', () => {
    it('saves with automatically assigned unique default name when typedName is empty', () => {
      const store = useThemeStore()
      store.savedStyles.push(sampleStyle('s1', 'Estilo Claro #1', 'light'))
      store.openDraft(null, 'light')

      const res = store.saveDraft('')
      expect(res.ok).toBe(true)
      expect(res.name).toBe('Estilo Claro #2')
      expect(store.savedStyles[0].name).toBe('Estilo Claro #2')
    })

    it('rejects saving if typedName is a duplicate', () => {
      const store = useThemeStore()
      store.savedStyles.push(sampleStyle('s1', 'Estilo Uno', 'light'))
      store.openDraft(null, 'light')

      const res = store.saveDraft('Estilo Uno')
      expect(res.ok).toBe(false)
      expect(res.message).toBe('Ya existe un estilo con ese nombre.')
    })
  })
})
