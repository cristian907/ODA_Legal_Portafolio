import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { PHOTOS_DIR, PHOTOS_PUBLIC_PATH } from '../config'
import { childDirectory } from '../storage/localFileStorage'

export function photoDirectory(photoId: string): string {
  return childDirectory(PHOTOS_DIR, photoId)
}

export function photoFilePath(photoId: string, storedName: string): string {
  return join(photoDirectory(photoId), storedName)
}

export function photoPublicUrl(photoId: string, storedName: string): string {
  return `${PHOTOS_PUBLIC_PATH}/${photoId}/${storedName}`
}

export async function createPhotoDirectory(photoId: string): Promise<void> {
  await mkdir(photoDirectory(photoId), { recursive: false })
}

export async function moveIntoPhotoDirectory(
  temporaryPath: string,
  photoId: string,
  storedName: string,
): Promise<string> {
  const destination = photoFilePath(photoId, storedName)
  await rename(temporaryPath, destination)
  return destination
}

/** Stored file names of a photo, or null when the photo does not exist. */
export async function listPhotoFiles(photoId: string): Promise<string[] | null> {
  try {
    return await readdir(photoDirectory(photoId))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function removePhotoFiles(photoId: string, storedNames: string[]): Promise<void> {
  await Promise.all(storedNames.map((name) => rm(photoFilePath(photoId, name), { force: true })))
}

export async function removePhoto(photoId: string): Promise<void> {
  await rm(photoDirectory(photoId), { recursive: true, force: true })
}
