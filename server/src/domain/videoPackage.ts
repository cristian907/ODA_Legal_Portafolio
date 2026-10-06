export interface StoredFile {
  path: string
  fileName: string
}

export interface StoredTrack extends StoredFile {
  label: string
  language: string
}

export interface ThumbnailSet {
  spritePath: string
  vttPath: string
  intervalSeconds: number
  width: number
  height: number
}

export interface VideoManifest {
  id: string
  title: string
  createdAt: string
  durationSeconds: number
  video: StoredFile
  subtitles: StoredTrack[]
  audioTracks: StoredTrack[]
  thumbnails: ThumbnailSet
}
