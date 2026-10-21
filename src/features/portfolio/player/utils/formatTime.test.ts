import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65.9)).toBe('1:05')
  })

  it('adds hours when the time reaches one hour', () => {
    expect(formatTime(3725)).toBe('1:02:05')
  })

  it('falls back to 0:00 for invalid values', () => {
    expect(formatTime(Number.NaN)).toBe('0:00')
    expect(formatTime(-3)).toBe('0:00')
  })
})
