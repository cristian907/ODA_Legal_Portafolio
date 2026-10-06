import { ALLOWED_EXTENSIONS, TITLE_MAX_LENGTH } from '../config'
import { ValidationError } from './errors'
import { hasAllowedExtension } from './fileExtension'

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
  videos: FileCandidate[]
  subtitles: SubtitleCandidate[]
  audioTracks: TrackCandidate[]
}

export type ValidVideoPackage = VideoPackageCandidate

function describeExtensions(extensions: readonly string[]): string {
  if (extensions.length === 1) return extensions[0]
  return `${extensions.slice(0, -1).join(', ')} o ${extensions[extensions.length - 1]}`
}

function titleErrors(title: string): string[] {
  const trimmed = title.trim()
  if (!trimmed) return ['El título es obligatorio.']
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return [`El título no puede superar los ${TITLE_MAX_LENGTH} caracteres.`]
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
    ...videoErrors(candidate.videos),
    ...subtitleListErrors(candidate.subtitles),
    ...audioTrackListErrors(candidate.audioTracks),
  ]
  if (errors.length > 0) throw new ValidationError(errors)
  return { ...candidate, title: candidate.title.trim() }
}
