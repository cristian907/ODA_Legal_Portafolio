export const MAX_AUDIO_DRIFT_SECONDS = 0.3

/** True when a side-loaded audio track drifted too far from the video clock. */
export function needsAudioResync(
  audioTime: number,
  videoTime: number,
  tolerance: number = MAX_AUDIO_DRIFT_SECONDS,
): boolean {
  return Math.abs(audioTime - videoTime) > tolerance
}
