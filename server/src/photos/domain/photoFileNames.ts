import { fileExtension } from '../../domain/fileExtension'

const ORIGINAL_BASE_NAME = 'original'
const CROPPED_FILE_PATTERN = /^cropped-(\d+)\.webp$/

export function originalPhotoFileName(uploadedFileName: string): string {
  return `${ORIGINAL_BASE_NAME}${fileExtension(uploadedFileName)}`
}

export function croppedPhotoFileName(version: number): string {
  return `cropped-${version}.webp`
}

export function findOriginalPhotoFileName(storedFileNames: string[]): string | null {
  return storedFileNames.find((name) => name.startsWith(`${ORIGINAL_BASE_NAME}.`)) ?? null
}

export function croppedVersionOf(fileName: string): number | null {
  const match = CROPPED_FILE_PATTERN.exec(fileName)
  return match ? Number(match[1]) : null
}

export function latestCroppedVersion(storedFileNames: string[]): number {
  const versions = storedFileNames.map(croppedVersionOf).filter((version) => version !== null)
  return Math.max(0, ...versions)
}
