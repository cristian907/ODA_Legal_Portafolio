import { describe, expect, it } from 'vitest'
import {
  croppedPhotoFileName,
  findOriginalPhotoFileName,
  latestCroppedVersion,
  originalPhotoFileName,
} from './photoFileNames'

describe('photo file names', () => {
  it('names the original after its lower-cased extension', () => {
    expect(originalPhotoFileName('Beach.JPG')).toBe('original.jpg')
  })

  it('versions every cropped rendition', () => {
    expect(croppedPhotoFileName(3)).toBe('cropped-3.webp')
  })

  it('finds the original among the stored files', () => {
    expect(findOriginalPhotoFileName(['cropped-1.webp', 'original.png'])).toBe('original.png')
    expect(findOriginalPhotoFileName(['cropped-1.webp'])).toBeNull()
  })

  it('reads the latest cropped version, ignoring unrelated files', () => {
    const files = ['original.jpg', 'cropped-2.webp', 'cropped-10.webp', 'cropped-x.webp', 'notes.txt']
    expect(latestCroppedVersion(files)).toBe(10)
  })

  it('reports version 0 when nothing was cropped yet', () => {
    expect(latestCroppedVersion(['original.jpg'])).toBe(0)
  })
})
