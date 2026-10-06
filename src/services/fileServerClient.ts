const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor de archivos. Ejecuta `pnpm dev`.'
const UNEXPECTED_ERROR_MESSAGE = 'El servidor respondió con un error inesperado.'

export type FileServerErrorKind = 'network' | 'validation' | 'server'

export class FileServerError extends Error {
  readonly kind: FileServerErrorKind
  readonly errors: string[]

  constructor(kind: FileServerErrorKind, errors: string[]) {
    super(errors.join(' '))
    this.name = 'FileServerError'
    this.kind = kind
    this.errors = errors
  }
}

function backendErrors(body: unknown): string[] {
  const errors = (body as { errors?: unknown } | null)?.errors
  return Array.isArray(errors) ? errors.filter((item) => typeof item === 'string') : []
}

/**
 * Maps a failed response to a typed error. A 5xx without the backend's
 * `{ errors: string[] }` body comes from the dev proxy when the file server
 * is down, so it is reported as a network failure.
 */
export function classifyFailure(status: number, body: unknown): FileServerError {
  const errors = backendErrors(body)
  const isProxyFailure = status >= 500 && errors.length === 0
  if (status === 0 || isProxyFailure) return new FileServerError('network', [NETWORK_ERROR_MESSAGE])
  const kind: FileServerErrorKind = status >= 400 && status < 500 ? 'validation' : 'server'
  return new FileServerError(kind, errors.length > 0 ? errors : [UNEXPECTED_ERROR_MESSAGE])
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function isSuccess(status: number): boolean {
  return status >= 200 && status < 300
}

/** Sends a request and returns the parsed JSON body (null when empty); throws FileServerError on failure. */
export async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw classifyFailure(0, null)
  }
  const body = parseJson(await response.text())
  if (!response.ok) throw classifyFailure(response.status, body)
  return body
}
