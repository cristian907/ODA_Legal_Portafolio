import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import { NotFoundError, ValidationError } from '../domain/errors'
import { isUuid } from '../domain/identifiers'
import { removeFiles } from '../storage/localFileStorage'
import {
  croppedPhotoFileName,
  croppedVersionOf,
  findOriginalPhotoFileName,
  latestCroppedVersion,
  originalPhotoFileName,
} from './domain/photoFileNames'
import type { PhotoRecord } from './domain/photoRecord'
import type { ImageSize, PhotoTransform } from './domain/photoTransform'
import { validatePhotoTransform, validatePhotoUpload } from './domain/validatePhotoUpload'
import {
  createPhotoDirectory,
  listPhotoFiles,
  moveIntoPhotoDirectory,
  photoFilePath,
  photoPublicUrl,
  removePhoto,
  removePhotoFiles,
} from './photoStorage'
import { readImageDimensions } from './readImageDimensions'
import { renderCroppedPhoto } from './renderCroppedPhoto'

interface StoredOriginal {
  fileName: string
  size: ImageSize
}

interface StoredPhoto {
  fileNames: string[]
  original: StoredOriginal
}

const PHOTO_NOT_FOUND_MESSAGE = 'La foto no existe.'

function requirePhotoId(request: Request): string {
  const photoId = String(request.params.id)
  if (!isUuid(photoId)) throw new ValidationError(['El identificador de la foto no es válido.'])
  return photoId
}

function requireUploadedFile(request: Request): Express.Multer.File {
  if (!request.file) throw new ValidationError(['Debes adjuntar una foto.'])
  return request.file
}

function parseTransformField(rawValue: unknown): unknown {
  try {
    return JSON.parse(typeof rawValue === 'string' ? rawValue : '')
  } catch {
    throw new ValidationError(['La transformación de la foto no tiene un formato válido.'])
  }
}

function toPhotoRecord(photoId: string, original: StoredOriginal, transform: PhotoTransform, version: number): PhotoRecord {
  return {
    id: photoId,
    originalPath: photoPublicUrl(photoId, original.fileName),
    croppedPath: photoPublicUrl(photoId, croppedPhotoFileName(version)),
    originalWidth: original.size.width,
    originalHeight: original.size.height,
    transform,
    version,
  }
}

async function renderVersion(
  photoId: string,
  original: StoredOriginal,
  transform: PhotoTransform,
  version: number,
): Promise<PhotoRecord> {
  const croppedName = croppedPhotoFileName(version)
  try {
    await renderCroppedPhoto(photoFilePath(photoId, original.fileName), photoFilePath(photoId, croppedName), transform)
  } catch (error) {
    await removePhotoFiles(photoId, [croppedName])
    throw error
  }
  return toPhotoRecord(photoId, original, transform, version)
}

async function storeNewPhoto(photoId: string, file: Express.Multer.File, rawTransform: unknown): Promise<PhotoRecord> {
  const size = await readImageDimensions(file.path)
  const transform = validatePhotoUpload({ fileName: file.originalname, transform: rawTransform, originalSize: size })
  const original = { fileName: originalPhotoFileName(file.originalname), size }
  await createPhotoDirectory(photoId)
  await moveIntoPhotoDirectory(file.path, photoId, original.fileName)
  return renderVersion(photoId, original, transform, 1)
}

async function findStoredPhoto(photoId: string): Promise<StoredPhoto> {
  const fileNames = await listPhotoFiles(photoId)
  const originalName = fileNames && findOriginalPhotoFileName(fileNames)
  if (!fileNames || !originalName) throw new NotFoundError(PHOTO_NOT_FOUND_MESSAGE)
  const size = await readImageDimensions(photoFilePath(photoId, originalName))
  return { fileNames, original: { fileName: originalName, size } }
}

function croppedFileNames(fileNames: string[]): string[] {
  return fileNames.filter((name) => croppedVersionOf(name) !== null)
}

export async function createPhoto(request: Request, response: Response): Promise<void> {
  const file = requireUploadedFile(request)
  const photoId = randomUUID()
  try {
    const rawTransform = parseTransformField(request.body?.transform)
    response.status(201).json(await storeNewPhoto(photoId, file, rawTransform))
  } catch (error) {
    await Promise.all([removePhoto(photoId), removeFiles([file.path])])
    throw error
  }
}

export async function recropPhoto(request: Request, response: Response): Promise<void> {
  const photoId = requirePhotoId(request)
  const stored = await findStoredPhoto(photoId)
  const transform = validatePhotoTransform(request.body?.transform, stored.original.size)
  const record = await renderVersion(photoId, stored.original, transform, latestCroppedVersion(stored.fileNames) + 1)
  await removePhotoFiles(photoId, croppedFileNames(stored.fileNames))
  response.json(record)
}

export async function deletePhoto(request: Request, response: Response): Promise<void> {
  await removePhoto(requirePhotoId(request))
  response.status(204).end()
}
