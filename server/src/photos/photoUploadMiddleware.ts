import type { NextFunction, Request, Response } from 'express'
import multer, { type FileFilterCallback } from 'multer'
import { ALLOWED_PHOTO_EXTENSIONS, MAX_PHOTO_BYTES } from '../config'
import { ValidationError } from '../domain/errors'
import { describeExtensions, hasAllowedExtension } from '../domain/fileExtension'
import { temporaryDiskStorage } from '../http/uploadMiddleware'

export const PHOTO_FIELD = 'photo'

const MEGABYTE = 1024 * 1024
const PHOTO_TOO_LARGE_MESSAGE = `La foto puede pesar como máximo ${MAX_PHOTO_BYTES / MEGABYTE} MB.`

function filterPhotoExtension(_request: Request, file: Express.Multer.File, accept: FileFilterCallback): void {
  if (hasAllowedExtension(file.originalname, ALLOWED_PHOTO_EXTENSIONS)) {
    accept(null, true)
    return
  }
  accept(new ValidationError([
    `La foto "${file.originalname}" debe tener formato ${describeExtensions(ALLOWED_PHOTO_EXTENSIONS)}.`,
  ]))
}

const receiveSinglePhoto = multer({
  storage: temporaryDiskStorage,
  fileFilter: filterPhotoExtension,
  defParamCharset: 'utf8',
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
}).single(PHOTO_FIELD)

function isFileTooLarge(error: unknown): boolean {
  return error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
}

export function uploadPhoto(request: Request, response: Response, next: NextFunction): void {
  receiveSinglePhoto(request, response, (error?: unknown) => {
    next(isFileTooLarge(error) ? new ValidationError([PHOTO_TOO_LARGE_MESSAGE]) : error)
  })
}
