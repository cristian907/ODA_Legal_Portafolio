import { describe, expect, it } from 'vitest'
import { formatFileSize } from './formatFileSize'

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1,5 KB'],
    [12.4 * 1024 * 1024, '12,4 MB'],
    [1.25 * 1024 ** 3, '1,3 GB'],
    [300 * 1024 * 1024, '300 MB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected)
  })

  it('treats invalid sizes as zero', () => {
    expect(formatFileSize(-1)).toBe('0 B')
    expect(formatFileSize(Number.NaN)).toBe('0 B')
  })
})
