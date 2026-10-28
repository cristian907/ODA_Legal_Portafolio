import { describe, expect, it } from 'vitest'
import { MAX_PHOTO_BYTES } from '@/schemas/gallery'
import { partitionPhotoFiles } from './partitionPhotoFiles'

function file(name: string, size = 10): File {
  return new File([new Uint8Array(size)], name)
}

describe('partitionPhotoFiles', () => {
  it('keeps valid photos in their original order', () => {
    const files = [file('a.jpg'), file('b.PNG'), file('c.webp')]
    expect(partitionPhotoFiles(files)).toEqual({ accepted: files, rejected: [] })
  })

  it('reports each rejected file with its name and reason', () => {
    const good = file('ok.jpeg')
    const big = file('huge.jpg', MAX_PHOTO_BYTES + 1)
    const { accepted, rejected } = partitionPhotoFiles([file('notes.pdf'), good, big])
    expect(accepted).toEqual([good])
    expect(rejected).toEqual([
      { name: 'notes.pdf', reason: 'La foto debe ser .jpg, .jpeg, .png o .webp.' },
      { name: 'huge.jpg', reason: 'La foto puede pesar como máximo 10 MB.' },
    ])
  })
})
