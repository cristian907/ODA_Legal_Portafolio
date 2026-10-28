import { describe, expect, it } from 'vitest'
import { splitByExtension } from './splitByExtension'

const file = (name: string) => new File(['x'], name)

describe('splitByExtension', () => {
  it('separates allowed files from rejected ones, case-insensitively', () => {
    const files = [file('es.VTT'), file('notes.txt'), file('en.vtt')]
    const { accepted, rejected } = splitByExtension(files, ['.vtt'])
    expect(accepted.map((f) => f.name)).toEqual(['es.VTT', 'en.vtt'])
    expect(rejected.map((f) => f.name)).toEqual(['notes.txt'])
  })

  it('handles an empty selection', () => {
    expect(splitByExtension([], ['.mp4'])).toEqual({ accepted: [], rejected: [] })
  })
})
