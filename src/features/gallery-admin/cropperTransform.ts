import type { PhotoRotation, PhotoTransform, TransformedImageCrop } from '@/types/gallery'

export interface CropperFlip {
  horizontal: boolean
  vertical: boolean
}

/**
 * What vue-advanced-cropper reports: `coordinates` live in the image as displayed
 * (EXIF auto-oriented by the browser, then transformed), in natural pixels.
 * Its transform mirrors the source image first and then rotates it clockwise by
 * `rotate` degrees (CSS `rotate(r) scaleX(±1) scaleY(±1)`); `rotate` accumulates
 * and can be negative or exceed 360.
 */
export interface CropperState {
  coordinates: TransformedImageCrop
  rotate: number
  flip: CropperFlip
}

interface Size {
  width: number
  height: number
}

export type FlipAxis = 'horizontal' | 'vertical'

function normalizeRotation(degrees: number): PhotoRotation {
  const quarterTurns = Math.round(degrees / 90)
  return ((((quarterTurns % 4) + 4) % 4) * 90) as PhotoRotation
}

function isQuarterTurn(rotation: PhotoRotation): boolean {
  return rotation === 90 || rotation === 270
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)))
}

function clampCrop(crop: TransformedImageCrop, bounds: Size): TransformedImageCrop {
  const width = clampInteger(crop.width, 1, bounds.width)
  const height = clampInteger(crop.height, 1, bounds.height)
  const left = clampInteger(crop.left, 0, bounds.width - width)
  const top = clampInteger(crop.top, 0, bounds.height - height)
  return { left, top, width, height }
}

/**
 * A single mirror commutes with a rotation by inverting its direction
 * (rotate(r)·mirror = mirror·rotate(−r)); mirroring both axes is a half turn,
 * which commutes with any rotation. The same rule converts in both directions.
 */
function swapMirrorOrder(rotation: PhotoRotation, flip: CropperFlip): PhotoRotation {
  const singleMirror = flip.horizontal !== flip.vertical
  return singleMirror ? normalizeRotation(-rotation) : rotation
}

/**
 * Converts the cropper state into the server's transform (rotate clockwise,
 * then mirror inside the rotated image). `orientedSize` is the image size after
 * EXIF auto-orientation, before any rotation.
 */
export function toServerTransform(state: CropperState, orientedSize: Size): PhotoTransform {
  const rotation = swapMirrorOrder(normalizeRotation(state.rotate), state.flip)
  const bounds = isQuarterTurn(rotation)
    ? { width: orientedSize.height, height: orientedSize.width }
    : orientedSize
  return {
    crop: clampCrop(state.coordinates, bounds),
    rotation,
    flipHorizontal: state.flip.horizontal,
    flipVertical: state.flip.vertical,
  }
}

/** Inverse of `toServerTransform`: the cropper state that reproduces a saved transform. */
export function toCropperState(transform: PhotoTransform): CropperState {
  const flip = { horizontal: transform.flipHorizontal, vertical: transform.flipVertical }
  return {
    coordinates: { ...transform.crop },
    rotate: swapMirrorOrder(transform.rotation, flip),
    flip,
  }
}

/**
 * The cropper mirrors the source image before rotating it, so at a quarter turn
 * its horizontal axis shows up vertically. Returns which source axis to toggle
 * so the image mirrors along the axis the person sees.
 */
export function visualFlip(axis: FlipAxis, rotate: number): CropperFlip {
  const swapped = isQuarterTurn(normalizeRotation(rotate))
  const horizontal = axis === 'horizontal' ? !swapped : swapped
  return { horizontal, vertical: !horizontal }
}
