/** Mirror of the manifest returned by the local video server (server/src/domain/videoPackage.ts). */
export interface VideoStoredFile {
  path: string
  fileName: string
}

export interface VideoStoredTrack extends VideoStoredFile {
  label: string
  language: string
}

export interface VideoThumbnails {
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
  video: VideoStoredFile
  subtitles: VideoStoredTrack[]
  audioTracks: VideoStoredTrack[]
  thumbnails: VideoThumbnails
}

/** Editable form state; files stay null until the admin picks them. */
export interface VideoTrackDraft {
  file: File | null
  label: string
  language: string
}

export interface VideoUploadDraft {
  title: string
  video: File | null
  subtitles: VideoTrackDraft[]
  audioTracks: VideoTrackDraft[]
}

/** Draft that passed validation: every file is present. */
export interface VideoTrackUpload {
  file: File
  label: string
  language: string
}

export interface VideoUploadPayload {
  title: string
  video: File
  subtitles: VideoTrackUpload[]
  audioTracks: VideoTrackUpload[]
}
