import { photoFileSchema } from '@/schemas/gallery'

export interface RejectedPhotoFile {
  name: string
  reason: string
}

export interface PhotoFilePartition {
  accepted: File[]
  rejected: RejectedPhotoFile[]
}

/** Splits picked files into photos the editor can open and files reported back with the first reason. */
export function partitionPhotoFiles(files: File[]): PhotoFilePartition {
  const accepted: File[] = []
  const rejected: RejectedPhotoFile[] = []
  for (const file of files) {
    const result = photoFileSchema.safeParse(file)
    if (result.success) accepted.push(file)
    else rejected.push({ name: file.name, reason: result.error.issues[0].message })
  }
  return { accepted, rejected }
}
