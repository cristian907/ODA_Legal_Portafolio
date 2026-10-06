import { describe, expect, it } from 'vitest'
import { MAX_AUDIO_DRIFT_SECONDS, needsAudioResync } from './audioDrift'

describe('needsAudioResync', () => {
  it('uses a 0.3 second tolerance', () => {
    expect(MAX_AUDIO_DRIFT_SECONDS).toBe(0.3)
  })

  it('keeps the audio running while the drift is within tolerance', () => {
    expect(needsAudioResync(10, 10)).toBe(false)
    expect(needsAudioResync(10.29, 10)).toBe(false)
    expect(needsAudioResync(9.71, 10)).toBe(false)
  })

  it('resyncs when the audio runs ahead or behind past the tolerance', () => {
    expect(needsAudioResync(10.31, 10)).toBe(true)
    expect(needsAudioResync(9.5, 10)).toBe(true)
  })

  it('accepts a custom tolerance', () => {
    expect(needsAudioResync(10.2, 10, 0.1)).toBe(true)
  })
})
