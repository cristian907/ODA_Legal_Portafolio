import { randomUUID } from 'node:crypto'
import multer, { type FileFilterCallback } from 'multer'
import type { Request } from 'express'
import {
  ALLOWED_EXTENSIONS,
  MAX_TRACK_FILES,
  MAX_VIDEO_BYTES,
  UPLOADS_TMP_DIR,
  type UploadField,
} from '../config'
import { ValidationError } from '../domain/errors'
import { fileExtension, hasAllowedExtension } from '../domain/fileExtension'

const FIELD_LABELS: Record<UploadField, string> = {
  video: 'video',
  poster: 'miniatura',
  subtitles: 'subtítulo',
  audioTracks: 'pista de audio',
}

function isUploadField(fieldName: string): fieldName is UploadField {
  return fieldName in ALLOWED_EXTENSIONS
}

function filterByExtension(_request: Request, file: Express.Multer.File, accept: FileFilterCallback): void {
  if (!isUploadField(file.fieldname)) {
    accept(new ValidationError([`Campo de archivo no esperado: "${file.fieldname}".`]))
    return
  }
  const allowed = ALLOWED_EXTENSIONS[file.fieldname]
  if (!hasAllowedExtension(file.originalname, allowed)) {
    const label = FIELD_LABELS[file.fieldname]
    accept(new ValidationError([
      `El archivo de ${label} "${file.originalname}" debe tener formato ${allowed.join(', ')}.`,
    ]))
    return
  }
  accept(null, true)
}

export const temporaryDiskStorage = multer.diskStorage({
  destination: UPLOADS_TMP_DIR,
  filename: (_request, file, name) => name(null, `${randomUUID()}${fileExtension(file.originalname)}`),
})

export const uploadVideoPackage = multer({
  storage: temporaryDiskStorage,
  fileFilter: filterByExtension,
  defParamCharset: 'utf8',
  limits: {
    fileSize: MAX_VIDEO_BYTES,
    files: 2 + MAX_TRACK_FILES * 2,
  },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 },
  { name: 'subtitles', maxCount: MAX_TRACK_FILES },
  { name: 'audioTracks', maxCount: MAX_TRACK_FILES },
])
