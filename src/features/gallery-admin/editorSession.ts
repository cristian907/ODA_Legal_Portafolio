import type { GalleryPhoto } from '@/types/gallery'

/** What the photo editor opens with: a queue of new files, or one saved photo. */
export type EditorSession = { mode: 'add'; files: File[] } | { mode: 'edit'; photo: GalleryPhoto }
