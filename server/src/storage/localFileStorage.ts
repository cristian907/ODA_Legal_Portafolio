import { mkdir, open, rename, rm, writeFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { PHOTOS_DIR, UPLOADS_DIR, UPLOADS_PUBLIC_PATH, UPLOADS_TMP_DIR } from '../config'

export async function ensureUploadDirectories(): Promise<void> {
  await mkdir(UPLOADS_TMP_DIR, { recursive: true })
  await mkdir(PHOTOS_DIR, { recursive: true })
}

/** Resolves a direct child of `parent`, rejecting names that escape it. */
export function childDirectory(parent: string, name: string): string {
  const directory = resolve(parent, name)
  const relativePath = relative(parent, directory)
  if (!relativePath || relativePath.startsWith('..') || relativePath.includes(sep)) {
    throw new Error(`Invalid directory name: ${name}`)
  }
  return directory
}

export function packageDirectory(packageId: string): string {
  return childDirectory(UPLOADS_DIR, packageId)
}

export function publicFileUrl(packageId: string, storedName: string): string {
  return `${UPLOADS_PUBLIC_PATH}/${packageId}/${storedName}`
}

export async function createPackageDirectory(packageId: string): Promise<string> {
  const directory = packageDirectory(packageId)
  await mkdir(directory, { recursive: false })
  return directory
}

export async function moveIntoPackage(
  temporaryPath: string,
  packageId: string,
  storedName: string,
): Promise<string> {
  const destination = join(packageDirectory(packageId), storedName)
  await rename(temporaryPath, destination)
  return destination
}

export async function writePackageFile(
  packageId: string,
  storedName: string,
  content: string,
): Promise<void> {
  await writeFile(join(packageDirectory(packageId), storedName), content, 'utf8')
}

export async function readFileStart(filePath: string, byteCount: number): Promise<string> {
  const handle = await open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(byteCount)
    const { bytesRead } = await handle.read(buffer, 0, byteCount, 0)
    return buffer.subarray(0, bytesRead).toString('utf8')
  } finally {
    await handle.close()
  }
}

export async function removePackage(packageId: string): Promise<void> {
  await rm(packageDirectory(packageId), { recursive: true, force: true })
}

export async function removeFiles(filePaths: string[]): Promise<void> {
  await Promise.all(filePaths.map((filePath) => rm(filePath, { force: true })))
}
