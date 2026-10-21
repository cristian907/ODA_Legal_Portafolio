import { afterEach, describe, expect, it, vi } from 'vitest'
import { classifyFailure, FileServerError, requestJson } from './fileServerClient'

describe('classifyFailure', () => {
  it('reports a missing response as a network error', () => {
    const error = classifyFailure(0, null)
    expect(error.kind).toBe('network')
    expect(error.errors[0]).toContain('pnpm dev')
  })

  it('reports a dev proxy failure without the backend error shape as a network error', () => {
    const error = classifyFailure(500, null)
    expect(error.kind).toBe('network')
    expect(error.errors[0]).toContain('pnpm dev')
  })

  it('reports a backend 5xx with its error list as a server error', () => {
    const error = classifyFailure(500, { errors: ['No se pudo guardar el video.'] })
    expect(error).toMatchObject({ kind: 'server', errors: ['No se pudo guardar el video.'] })
  })

  it('reports a 4xx with its error list as a validation error', () => {
    const error = classifyFailure(400, { errors: ['El título es obligatorio.'] })
    expect(error).toMatchObject({ kind: 'validation', errors: ['El título es obligatorio.'] })
  })

  it('falls back to a generic message for a 4xx without an error list', () => {
    const error = classifyFailure(404, null)
    expect(error).toMatchObject({
      kind: 'validation',
      errors: ['El servidor respondió con un error inesperado.'],
    })
  })
})

describe('requestJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed body of a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"id":"a"}', { status: 200 })))
    await expect(requestJson('/api/x', { method: 'GET' })).resolves.toEqual({ id: 'a' })
  })

  it('returns null for an empty successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(requestJson('/api/x', { method: 'DELETE' })).resolves.toBeNull()
  })

  it('throws the classified backend errors of a failed response', async () => {
    const body = JSON.stringify({ errors: ['La foto no existe.'] })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 404 })))
    await expect(requestJson('/api/x', { method: 'PUT' })).rejects.toMatchObject({
      kind: 'validation',
      errors: ['La foto no existe.'],
    })
  })

  it('throws a network error when the request cannot be sent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(requestJson('/api/x', { method: 'GET' })).rejects.toBeInstanceOf(FileServerError)
  })
})
