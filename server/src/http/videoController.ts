import { randomUUID } from 'node:crypto'
import { basename } from 'node:path'
import type { Request, Response } from 'express'
import { ValidationError } from '../domain/errors'
import { fileExtension } from '../domain/fileExtension'
import { isUuid } from '../domain/identifiers'
import { validateVideoPackage, type VideoPackageCandidate } from '../domain/validateVideoPackage'
import type { StoredFile, StoredTrack, VideoManifest } from '../domain/videoPackage'
import {
  createPackageDirectory,
  moveIntoPackage,
  publicFileUrl,
  readFileStart,
  removeFiles,
  removePackage,
} from '../storage/localFileStorage'
import { generateThumbnails } from '../thumbnails/generateThumbnails'

type UploadedFile = Express.Multer.File

interface TrackMetadata {
  label: string
  language: string
}

interface UploadedTrack extends TrackMetadata {
  file: UploadedFile
}

interface UploadedPackage {
  title: string
  subtitle: string
  video: UploadedFile[]
  poster: UploadedFile | null
  subtitles: UploadedTrack[]
  audioTracks: UploadedTrack[]
}

interface StoredPackage {
  video: StoredFile & { diskPath: string }
  poster?: StoredFile
  subtitles: StoredTrack[]
  audioTracks: StoredTrack[]
}

const VTT_SIGNATURE_BYTES = 16

function uploadedFilesOf(request: Request, field: string): UploadedFile[] {
  const files = request.files as Record<string, UploadedFile[]> | undefined
  return files?.[field] ?? []
}

function allUploadedFiles(request: Request): UploadedFile[] {
  return ['video', 'poster', 'subtitles', 'audioTracks'].flatMap((field) => uploadedFilesOf(request, field))
}

function textField(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toTrackMetadata(entry: unknown): TrackMetadata {
  const record = (entry ?? {}) as Record<string, unknown>
  return { label: textField(record.label), language: textField(record.language) }
}

function parseTrackMetadata(rawValue: unknown, fieldName: string): TrackMetadata[] {
  if (rawValue === undefined || rawValue === '') return []
  try {
    const parsed: unknown = JSON.parse(textField(rawValue))
    if (!Array.isArray(parsed)) throw new TypeError('Expected an array')
    return parsed.map(toTrackMetadata)
  } catch {
    throw new ValidationError([`Los metadatos de "${fieldName}" no tienen un formato válido.`])
  }
}

function attachMetadata(files: UploadedFile[], metadata: TrackMetadata[]): UploadedTrack[] {
  return files.map((file, index) => ({ file, ...(metadata[index] ?? { label: '', language: '' }) }))
}

function readUploadedPackage(request: Request): UploadedPackage {
  return {
    title: textField(request.body?.title),
    subtitle: textField(request.body?.subtitle),
    video: uploadedFilesOf(request, 'video'),
    poster: uploadedFilesOf(request, 'poster')[0] ?? null,
    subtitles: attachMetadata(
      uploadedFilesOf(request, 'subtitles'),
      parseTrackMetadata(request.body?.subtitleMeta, 'subtitleMeta'),
    ),
    audioTracks: attachMetadata(
      uploadedFilesOf(request, 'audioTracks'),
      parseTrackMetadata(request.body?.audioMeta, 'audioMeta'),
    ),
  }
}

async function toCandidate(uploaded: UploadedPackage): Promise<VideoPackageCandidate> {
  const subtitles = await Promise.all(
    uploaded.subtitles.map(async (track) => ({
      fileName: track.file.originalname,
      label: track.label,
      language: track.language,
      contentStart: await readFileStart(track.file.path, VTT_SIGNATURE_BYTES),
    })),
  )
  return {
    title: uploaded.title,
    subtitle: uploaded.subtitle,
    videos: uploaded.video.map((file) => ({ fileName: file.originalname })),
    poster: uploaded.poster ? { fileName: uploaded.poster.originalname } : null,
    subtitles,
    audioTracks: uploaded.audioTracks.map((track) => ({
      fileName: track.file.originalname,
      label: track.label,
      language: track.language,
    })),
  }
}

async function storeTrack(
  packageId: string,
  track: UploadedTrack,
  storedName: string,
): Promise<StoredTrack> {
  await moveIntoPackage(track.file.path, packageId, storedName)
  return {
    path: publicFileUrl(packageId, storedName),
    fileName: basename(track.file.originalname),
    label: track.label.trim(),
    language: track.language.trim(),
  }
}

function storeTracks(packageId: string, tracks: UploadedTrack[], namePrefix: string): Promise<StoredTrack[]> {
  return Promise.all(
    tracks.map((track, index) =>
      storeTrack(packageId, track, `${namePrefix}-${index + 1}${fileExtension(track.file.originalname)}`),
    ),
  )
}

async function storePackage(packageId: string, uploaded: UploadedPackage): Promise<StoredPackage> {
  await createPackageDirectory(packageId)
  const [videoFile] = uploaded.video
  const videoName = `video${fileExtension(videoFile.originalname)}`
  const diskPath = await moveIntoPackage(videoFile.path, packageId, videoName)
  let poster: StoredFile | undefined
  if (uploaded.poster) {
    const posterName = `poster${fileExtension(uploaded.poster.originalname)}`
    await moveIntoPackage(uploaded.poster.path, packageId, posterName)
    poster = {
      path: publicFileUrl(packageId, posterName),
      fileName: basename(uploaded.poster.originalname),
    }
  }
  return {
    video: { path: publicFileUrl(packageId, videoName), fileName: basename(videoFile.originalname), diskPath },
    ...(poster ? { poster } : {}),
    subtitles: await storeTracks(packageId, uploaded.subtitles, 'subtitle'),
    audioTracks: await storeTracks(packageId, uploaded.audioTracks, 'audio'),
  }
}

async function buildPackage(packageId: string, request: Request): Promise<VideoManifest> {
  const uploaded = readUploadedPackage(request)
  const validated = validateVideoPackage(await toCandidate(uploaded))
  const stored = await storePackage(packageId, uploaded)
  const { durationSeconds, thumbnails } = await generateThumbnails(packageId, stored.video.diskPath)
  return {
    id: packageId,
    title: validated.title,
    ...(validated.subtitle ? { subtitle: validated.subtitle } : {}),
    createdAt: new Date().toISOString(),
    durationSeconds,
    video: { path: stored.video.path, fileName: stored.video.fileName },
    ...(stored.poster ? { poster: stored.poster } : {}),
    subtitles: stored.subtitles,
    audioTracks: stored.audioTracks,
    thumbnails,
  }
}

export async function createVideo(request: Request, response: Response): Promise<void> {
  const packageId = randomUUID()
  try {
    response.status(201).json(await buildPackage(packageId, request))
  } catch (error) {
    await Promise.all([removePackage(packageId), removeFiles(allUploadedFiles(request).map((file) => file.path))])
    throw error
  }
}

export async function deleteVideo(request: Request, response: Response): Promise<void> {
  const packageId = String(request.params.id)
  if (!isUuid(packageId)) {
    throw new ValidationError(['El identificador del video no es válido.'])
  }
  await removePackage(packageId)
  response.status(204).end()
}

export function healthCheck(_request: Request, response: Response): void {
  response.json({ status: 'ok' })
}
