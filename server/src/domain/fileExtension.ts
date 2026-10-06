import { extname } from 'node:path'

export function fileExtension(fileName: string): string {
  return extname(fileName).toLowerCase()
}

export function hasAllowedExtension(fileName: string, allowed: readonly string[]): boolean {
  return allowed.includes(fileExtension(fileName))
}
