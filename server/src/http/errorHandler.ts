import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { MAX_VIDEO_BYTES } from '../config'
import { NotFoundError, ProcessingError, ValidationError } from '../domain/errors'

const MEGABYTE = 1024 * 1024
const GENERIC_ERROR_MESSAGE = 'Ocurrió un error inesperado en el servidor.'

const MULTER_MESSAGES: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: `Cada archivo puede pesar como máximo ${MAX_VIDEO_BYTES / MEGABYTE} MB.`,
  LIMIT_FILE_COUNT: 'Se enviaron demasiados archivos.',
  LIMIT_UNEXPECTED_FILE: 'Se recibió un archivo inesperado o se superó la cantidad permitida.',
}

function multerMessage(error: multer.MulterError): string {
  return MULTER_MESSAGES[error.code] ?? 'No se pudieron recibir los archivos enviados.'
}

function isMalformedJsonBody(error: unknown): boolean {
  return (error as { type?: unknown } | null)?.type === 'entity.parse.failed'
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof ValidationError) {
    response.status(400).json({ errors: error.errors })
    return
  }
  if (isMalformedJsonBody(error)) {
    response.status(400).json({ errors: ['El cuerpo de la solicitud no es un JSON válido.'] })
    return
  }
  if (error instanceof NotFoundError) {
    response.status(404).json({ errors: [error.message] })
    return
  }
  if (error instanceof multer.MulterError) {
    response.status(400).json({ errors: [multerMessage(error)] })
    return
  }
  console.error(error)
  const message = error instanceof ProcessingError ? error.message : GENERIC_ERROR_MESSAGE
  response.status(500).json({ errors: [message] })
}
