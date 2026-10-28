import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildPhotoFormData, deletePhoto, recropPhoto, uploadPhoto } from './photoApi'
import type { PhotoRecord, PhotoTransform } from '@/types/gallery'

const transform: PhotoTransform = {
  crop: { left: 10, top: 20, width: 400, height: 300 },
  rotation: 90,
  flipHorizontal: false,
  flipVertical: true,
}

const record: PhotoRecord = {
  id: 'abc',
  originalPath: '/uploads/photos/abc/original.jpg',
  croppedPath: '/uploads/photos/abc/cropped-1.webp',
  originalWidth: 800,
  originalHeight: 600,
  transform,
  version: 1,
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildPhotoFormData', () => {
  it('sends the photo file and its serialized transform', () => {
    const formData = buildPhotoFormData(new File(['x'], 'office.jpg'), transform)
    expect((formData.get('photo') as File).name).toBe('office.jpg')
    expect(JSON.parse(formData.get('transform') as string)).toEqual(transform)
  })
})

describe('uploadPhoto', () => {
  it('posts the form data and returns the created record', async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify(record), { status: 201 }))
    await expect(uploadPhoto(new File(['x'], 'office.jpg'), transform)).resolves.toEqual(record)
    expect(fetchMock).toHaveBeenCalledWith('/api/photos', expect.objectContaining({ method: 'POST' }))
  })

  it('throws the backend validation errors', async () => {
    mockFetch(new Response(JSON.stringify({ errors: ['Debes adjuntar una foto.'] }), { status: 400 }))
    await expect(uploadPhoto(new File(['x'], 'office.jpg'), transform)).rejects.toMatchObject({
      kind: 'validation',
      errors: ['Debes adjuntar una foto.'],
    })
  })
})

describe('recropPhoto', () => {
  it('puts the transform as JSON and returns the new record', async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify({ ...record, version: 2 }), { status: 200 }))
    await expect(recropPhoto('abc', transform)).resolves.toMatchObject({ version: 2 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/photos/abc/crop')
    expect(init.method).toBe('PUT')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({ transform })
  })
})

describe('deletePhoto', () => {
  it('deletes the photo by its encoded id', async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }))
    await deletePhoto('a/b')
    expect(fetchMock).toHaveBeenCalledWith('/api/photos/a%2Fb', { method: 'DELETE' })
  })
})
