import { describe, expect, it } from 'vitest'
import { resolvePlayerShortcut } from './playerShortcuts'

describe('resolvePlayerShortcut', () => {
  it.each([
    [' ', { type: 'toggle-play' }],
    ['k', { type: 'toggle-play' }],
    ['K', { type: 'toggle-play' }],
    ['f', { type: 'toggle-fullscreen' }],
    ['m', { type: 'toggle-mute' }],
    ['c', { type: 'toggle-subtitles' }],
  ])('maps %j to %j', (key, shortcut) => {
    expect(resolvePlayerShortcut(key)).toEqual(shortcut)
  })

  it('skips 5 seconds with arrows and 10 seconds with j / l', () => {
    expect(resolvePlayerShortcut('ArrowLeft')).toEqual({ type: 'skip', seconds: -5 })
    expect(resolvePlayerShortcut('ArrowRight')).toEqual({ type: 'skip', seconds: 5 })
    expect(resolvePlayerShortcut('j')).toEqual({ type: 'skip', seconds: -10 })
    expect(resolvePlayerShortcut('l')).toEqual({ type: 'skip', seconds: 10 })
  })

  it('changes the volume by a tenth with the vertical arrows', () => {
    expect(resolvePlayerShortcut('ArrowUp')).toEqual({ type: 'change-volume', delta: 0.1 })
    expect(resolvePlayerShortcut('ArrowDown')).toEqual({ type: 'change-volume', delta: -0.1 })
  })

  it('maps digits to a percentage of the video', () => {
    expect(resolvePlayerShortcut('0')).toEqual({ type: 'seek-percent', percent: 0 })
    expect(resolvePlayerShortcut('7')).toEqual({ type: 'seek-percent', percent: 70 })
  })

  it('ignores unrelated keys', () => {
    expect(resolvePlayerShortcut('x')).toBeNull()
    expect(resolvePlayerShortcut('Enter')).toBeNull()
  })
})
