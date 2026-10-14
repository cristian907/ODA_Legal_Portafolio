import { gallerySettingsSchema } from '@/schemas/gallery'
import type { GallerySettings } from '@/types/gallery'

export const DEFAULT_GALLERY_SETTINGS: Readonly<GallerySettings> = Object.freeze({
  aspectRatio: '4:3',
  autoplay: true,
  autoplayIntervalSeconds: 5,
  loop: true,
  itemsPerView: 3,
  slideStep: 'single',
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function restoredValue<K extends keyof GallerySettings>(stored: Record<string, unknown>, key: K): GallerySettings[K] {
  const parsed = gallerySettingsSchema.shape[key].safeParse(stored[key])
  return parsed.success ? (parsed.data as GallerySettings[K]) : DEFAULT_GALLERY_SETTINGS[key]
}

/** Rebuilds settings read from storage, replacing each missing or invalid field with its default. */
export function restoreGallerySettings(stored: unknown): GallerySettings {
  const source = isRecord(stored) ? stored : {}
  return {
    aspectRatio: restoredValue(source, 'aspectRatio'),
    autoplay: restoredValue(source, 'autoplay'),
    autoplayIntervalSeconds: restoredValue(source, 'autoplayIntervalSeconds'),
    loop: restoredValue(source, 'loop'),
    itemsPerView: restoredValue(source, 'itemsPerView'),
    slideStep: restoredValue(source, 'slideStep'),
  }
}
