import { describe, expect, it } from 'vitest'
import { DEFAULT_GALLERY_SETTINGS, restoreGallerySettings } from './gallerySettings'

describe('restoreGallerySettings', () => {
  it('uses the defaults when nothing was stored', () => {
    expect(restoreGallerySettings(null)).toEqual({
      aspectRatio: '4:3',
      autoplay: true,
      autoplayIntervalSeconds: 5,
      loop: true,
    })
  })

  it('keeps valid stored values and fills missing ones', () => {
    expect(restoreGallerySettings({ aspectRatio: '1:1', loop: false })).toEqual({
      ...DEFAULT_GALLERY_SETTINGS,
      aspectRatio: '1:1',
      loop: false,
    })
  })

  it('falls back to the defaults for invalid stored values', () => {
    expect(restoreGallerySettings({ aspectRatio: '2:1', autoplayIntervalSeconds: 99 })).toEqual(
      DEFAULT_GALLERY_SETTINGS,
    )
    expect(restoreGallerySettings('broken')).toEqual(DEFAULT_GALLERY_SETTINGS)
  })

  it('resets only the invalid fields', () => {
    expect(restoreGallerySettings({ aspectRatio: '2:1', loop: false })).toEqual({
      ...DEFAULT_GALLERY_SETTINGS,
      loop: false,
    })
  })
})
