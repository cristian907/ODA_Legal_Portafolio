import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { FileServerError } from '@/services/fileServerClient'
import { deletePhoto, recropPhoto, uploadPhoto } from '@/services/photoApi'
import type { GalleryPhoto, PhotoRecord, PhotoTransform } from '@/types/gallery'
import { useGalleryStore } from './gallery'

vi.mock('@/services/photoApi', () => ({
  uploadPhoto: vi.fn(),
  recropPhoto: vi.fn(),
  deletePhoto: vi.fn(),
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

const baseTransform: PhotoTransform = {
  crop: { left: 0, top: 0, width: 400, height: 300 },
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
}

function recordFor(id: string, overrides: Partial<PhotoRecord> = {}): PhotoRecord {
  return {
    id,
    originalPath: `/uploads/photos/${id}/original.jpg`,
    croppedPath: `/uploads/photos/${id}/cropped-1.webp`,
    originalWidth: 400,
    originalHeight: 300,
    transform: baseTransform,
    version: 1,
    ...overrides,
  }
}

function galleryPhoto(id: string, overrides: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return { ...recordFor(id), title: `Foto ${id}`, alt: `Descripción ${id}`, ...overrides }
}

function storedJson(key: string): unknown {
  return JSON.parse(localStorage.getItem(key) ?? 'null')
}

function seedPhotos(photos: GalleryPhoto[]): void {
  localStorage.setItem(STORAGE_KEYS.GALLERY_PHOTOS, JSON.stringify(photos))
}

const photoFile = () => new File(['x'], 'office.jpg')

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
  vi.mocked(uploadPhoto).mockReset()
  vi.mocked(recropPhoto).mockReset()
  vi.mocked(deletePhoto).mockReset().mockResolvedValue(undefined)
  setActivePinia(createPinia())
})

describe('gallery store initial state', () => {
  it('starts empty with default settings', () => {
    const store = useGalleryStore()
    expect(store.photos).toEqual([])
    expect(store.settings).toEqual({ aspectRatio: '4:3', autoplay: true, autoplayIntervalSeconds: 5, loop: true })
  })

  it('restores photos and settings from storage', () => {
    seedPhotos([galleryPhoto('a')])
    localStorage.setItem(STORAGE_KEYS.GALLERY_SETTINGS, JSON.stringify({ aspectRatio: '1:1' }))
    const store = useGalleryStore()
    expect(store.photos.map((photo) => photo.id)).toEqual(['a'])
    expect(store.settings.aspectRatio).toBe('1:1')
  })
})

describe('addPhoto', () => {
  it('uploads the photo and appends it with trimmed metadata', async () => {
    vi.mocked(uploadPhoto).mockResolvedValue(recordFor('new'))
    const store = useGalleryStore()

    const added = await store.addPhoto(photoFile(), baseTransform, { title: ' Sala ', alt: ' Sala de juntas ' })

    expect(uploadPhoto).toHaveBeenCalledWith(expect.any(File), baseTransform)
    expect(added).toMatchObject({ id: 'new', title: 'Sala', alt: 'Sala de juntas' })
    expect(store.photos).toHaveLength(1)
    expect(storedJson(STORAGE_KEYS.GALLERY_PHOTOS)).toEqual([added])
  })

  it('rejects invalid metadata or files without calling the server', async () => {
    const store = useGalleryStore()
    const added = await store.addPhoto(new File(['x'], 'scan.gif'), baseTransform, {
      title: '',
      alt: 'a'.repeat(151),
    })
    expect(added).toBeNull()
    expect(store.errors).toEqual([
      'La foto debe ser .jpg, .jpeg, .png o .webp.',
      'El texto alternativo no puede superar los 150 caracteres.',
    ])
    expect(uploadPhoto).not.toHaveBeenCalled()
  })

  it('reports the server errors when the upload fails', async () => {
    vi.mocked(uploadPhoto).mockRejectedValue(new FileServerError('validation', ['Archivo inválido.']))
    const store = useGalleryStore()
    expect(await store.addPhoto(photoFile(), baseTransform, { title: '', alt: 'Recepción' })).toBeNull()
    expect(store.errors).toEqual(['Archivo inválido.'])
    expect(store.isSaving).toBe(false)
  })
})

describe('updatePhoto', () => {
  it('updates metadata without re-cropping', async () => {
    seedPhotos([galleryPhoto('a')])
    const store = useGalleryStore()
    await store.updatePhoto('a', { title: 'Nuevo', transform: structuredClone(baseTransform) })
    expect(recropPhoto).not.toHaveBeenCalled()
    expect(store.photos[0].title).toBe('Nuevo')
  })

  it('re-crops when the transform changes', async () => {
    seedPhotos([galleryPhoto('a')])
    const rotated = { ...baseTransform, rotation: 90 as const }
    vi.mocked(recropPhoto).mockResolvedValue(recordFor('a', { transform: rotated, version: 2 }))
    const store = useGalleryStore()

    await store.updatePhoto('a', { transform: rotated })

    expect(recropPhoto).toHaveBeenCalledWith('a', rotated)
    expect(store.photos[0]).toMatchObject({ version: 2, transform: rotated, title: 'Foto a' })
  })

  it('reports an unknown photo', async () => {
    const store = useGalleryStore()
    expect(await store.updatePhoto('missing', { title: 'x' })).toBeNull()
    expect(store.errors).toEqual(['La foto no existe.'])
  })
})

describe('removePhoto and movePhoto', () => {
  it('removes the photo locally even when the server deletion fails', async () => {
    seedPhotos([galleryPhoto('a'), galleryPhoto('b')])
    vi.mocked(deletePhoto).mockRejectedValue(new FileServerError('network', ['Sin conexión.']))
    const store = useGalleryStore()
    await store.removePhoto('a')
    expect(deletePhoto).toHaveBeenCalledWith('a')
    expect(store.photos.map((photo) => photo.id)).toEqual(['b'])
  })

  it('moves a photo and persists the order', () => {
    seedPhotos([galleryPhoto('a'), galleryPhoto('b'), galleryPhoto('c')])
    const store = useGalleryStore()
    store.movePhoto('c', 0)
    expect(store.photos.map((photo) => photo.id)).toEqual(['c', 'a', 'b'])
    const stored = storedJson(STORAGE_KEYS.GALLERY_PHOTOS) as GalleryPhoto[]
    expect(stored.map((photo) => photo.id)).toEqual(['c', 'a', 'b'])
  })
})

describe('updateSettings', () => {
  it('persists settings that do not affect the crop without re-cropping', async () => {
    seedPhotos([galleryPhoto('a')])
    const store = useGalleryStore()
    expect(await store.updateSettings({ autoplay: false, autoplayIntervalSeconds: 8 })).toBe(true)
    expect(recropPhoto).not.toHaveBeenCalled()
    expect(storedJson(STORAGE_KEYS.GALLERY_SETTINGS)).toMatchObject({ autoplay: false, autoplayIntervalSeconds: 8 })
  })

  it('rejects invalid settings', async () => {
    const store = useGalleryStore()
    expect(await store.updateSettings({ autoplayIntervalSeconds: 30 })).toBe(false)
    expect(store.errors).toEqual(['El intervalo debe ser un número entero entre 2 y 10 segundos.'])
    expect(store.settings.autoplayIntervalSeconds).toBe(5)
  })

  it('re-crops every photo centered, one at a time, keeping rotation and flips', async () => {
    const flipped = { ...baseTransform, rotation: 90 as const, flipHorizontal: true }
    seedPhotos([galleryPhoto('a'), galleryPhoto('b', { transform: flipped })])
    let inFlight = 0
    let maxInFlight = 0
    vi.mocked(recropPhoto).mockImplementation(async (id, transform) => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await Promise.resolve()
      inFlight -= 1
      return recordFor(id, { transform, version: 2 })
    })
    const store = useGalleryStore()

    const pending = store.updateSettings({ aspectRatio: '1:1' })
    expect(store.isRecropping).toBe(true)
    expect(await pending).toBe(true)

    expect(maxInFlight).toBe(1)
    expect(recropPhoto).toHaveBeenNthCalledWith(1, 'a', {
      ...baseTransform,
      crop: { left: 50, top: 0, width: 300, height: 300 },
    })
    expect(recropPhoto).toHaveBeenNthCalledWith(2, 'b', {
      ...flipped,
      crop: { left: 0, top: 50, width: 300, height: 300 },
    })
    expect(store.photos.every((photo) => photo.version === 2)).toBe(true)
    expect(store.isRecropping).toBe(false)
  })

  it('keeps the old record of a photo that fails to re-crop', async () => {
    seedPhotos([galleryPhoto('a'), galleryPhoto('b')])
    vi.mocked(recropPhoto).mockImplementation(async (id, transform) => {
      if (id === 'a') throw new FileServerError('server', ['No se pudo recortar la foto.'])
      return recordFor(id, { transform, version: 2 })
    })
    const store = useGalleryStore()

    await store.updateSettings({ aspectRatio: '16:9' })

    expect(store.photos[0]).toEqual(galleryPhoto('a'))
    expect(store.photos[1].version).toBe(2)
    expect(store.recropFailures).toEqual({ a: ['No se pudo recortar la foto.'] })
    expect(store.errors).toEqual(['No se pudo ajustar 1 foto a la nueva proporción.'])
    expect(store.settings.aspectRatio).toBe('16:9')
  })
})
