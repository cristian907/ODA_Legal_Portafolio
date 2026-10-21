import { extname } from 'node:path'

export function fileExtension(fileName: string): string {
  return extname(fileName).toLowerCase()
}

export function hasAllowedExtension(fileName: string, allowed: readonly string[]): boolean {
  return allowed.includes(fileExtension(fileName))
}

export function describeExtensions(extensions: readonly string[]): string {
  if (extensions.length === 1) return extensions[0]
  return `${extensions.slice(0, -1).join(', ')} o ${extensions[extensions.length - 1]}`
}
