import { ALLOWED_EXTENSIONS, SUBTITLE_MAX_LENGTH, TITLE_MAX_LENGTH } from '../config'
import { ValidationError } from './errors'
import { describeExtensions, hasAllowedExtension } from './fileExtension'

const MIN_SUBTITLES = 2
const MIN_AUDIO_TRACKS = 2
const BYTE_ORDER_MARK = '﻿'
const WEBVTT_SIGNATURE = 'WEBVTT'

export interface FileCandidate {
  fileName: string
}

export interface TrackCandidate extends FileCandidate {
  label: string
  language: string
}

export interface SubtitleCandidate extends TrackCandidate {
  contentStart: string
}

export interface VideoPackageCandidate {
  title: string
  subtitle?: string
  videos: FileCandidate[]
  poster?: FileCandidate | null
  subtitles: SubtitleCandidate[]
  audioTracks: TrackCandidate[]
}

export type ValidVideoPackage = VideoPackageCandidate

function titleErrors(title: string): string[] {
  const trimmed = title.trim()
  if (!trimmed) return ['El título es obligatorio.']
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return [`El título no puede superar los ${TITLE_MAX_LENGTH} caracteres.`]
  }
  return []
}

function subtitleTextErrors(subtitle?: string): string[] {
  if (!subtitle) return []
  const trimmed = subtitle.trim()
  if (trimmed.length > SUBTITLE_MAX_LENGTH) {
    return [`El subtítulo no puede superar los ${SUBTITLE_MAX_LENGTH} caracteres.`]
  }
  return []
}

function videoErrors(videos: FileCandidate[]): string[] {
  if (videos.length === 0) return ['Debes adjuntar un archivo de video.']
  if (videos.length > 1) return ['Solo se permite un archivo de video.']
  const [video] = videos
  if (!hasAllowedExtension(video.fileName, ALLOWED_EXTENSIONS.video)) {
    return [`El video "${video.fileName}" debe tener formato ${describeExtensions(ALLOWED_EXTENSIONS.video)}.`]
  }
  return []
}

function posterErrors(poster?: FileCandidate | null): string[] {
  if (!poster) return []
  if (!hasAllowedExtension(poster.fileName, ALLOWED_EXTENSIONS.poster)) {
    return [`La miniatura "${poster.fileName}" debe tener formato ${describeExtensions(ALLOWED_EXTENSIONS.poster)}.`]
  }
  return []
}

function trackMetadataErrors(track: TrackCandidate, trackName: string): string[] {
  const errors: string[] = []
  if (!track.label.trim()) errors.push(`${trackName} necesita una etiqueta.`)
  if (!track.language.trim()) errors.push(`${trackName} necesita un idioma.`)
  return errors
}

function isWebVtt(contentStart: string): boolean {
  const withoutBom = contentStart.startsWith(BYTE_ORDER_MARK) ? contentStart.slice(1) : contentStart
  return withoutBom.startsWith(WEBVTT_SIGNATURE)
}

function subtitleErrors(subtitle: SubtitleCandidate, index: number): string[] {
  const trackName = `El subtítulo ${index + 1}`
  const errors = trackMetadataErrors(subtitle, trackName)
  const fileLabel = `${trackName} ("${subtitle.fileName}")`
  if (!hasAllowedExtension(subtitle.fileName, ALLOWED_EXTENSIONS.subtitles)) {
    errors.push(`${fileLabel} debe tener formato ${describeExtensions(ALLOWED_EXTENSIONS.subtitles)}.`)
  } else if (!isWebVtt(subtitle.contentStart)) {
    errors.push(`${fileLabel} no es un archivo WebVTT válido.`)
  }
  return errors
}

function audioTrackErrors(audioTrack: TrackCandidate, index: number): string[] {
  const trackName = `La pista de audio ${index + 1}`
  const errors = trackMetadataErrors(audioTrack, trackName)
  if (!hasAllowedExtension(audioTrack.fileName, ALLOWED_EXTENSIONS.audioTracks)) {
    errors.push(
      `${trackName} ("${audioTrack.fileName}") debe tener formato ${describeExtensions(ALLOWED_EXTENSIONS.audioTracks)}.`,
    )
  }
  return errors
}

function subtitleListErrors(subtitles: SubtitleCandidate[]): string[] {
  if (subtitles.length < MIN_SUBTITLES) return [`Debes adjuntar al menos ${MIN_SUBTITLES} subtítulos.`]
  return subtitles.flatMap(subtitleErrors)
}

function audioTrackListErrors(audioTracks: TrackCandidate[]): string[] {
  if (audioTracks.length < MIN_AUDIO_TRACKS) {
    return [`Debes adjuntar al menos ${MIN_AUDIO_TRACKS} pistas de audio.`]
  }
  return audioTracks.flatMap(audioTrackErrors)
}

export function validateVideoPackage(candidate: VideoPackageCandidate): ValidVideoPackage {
  const errors = [
    ...titleErrors(candidate.title),
    ...subtitleTextErrors(candidate.subtitle),
    ...videoErrors(candidate.videos),
    ...posterErrors(candidate.poster),
    ...subtitleListErrors(candidate.subtitles),
    ...audioTrackListErrors(candidate.audioTracks),
  ]
  if (errors.length > 0) throw new ValidationError(errors)
  return {
    ...candidate,
    title: candidate.title.trim(),
    ...(candidate.subtitle?.trim() ? { subtitle: candidate.subtitle.trim() } : {}),
    ...(candidate.poster ? { poster: candidate.poster } : {}),
  }
}
