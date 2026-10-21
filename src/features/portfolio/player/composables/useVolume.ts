import { ref } from 'vue'

const FALLBACK_RESTORE_VOLUME = 0.8

function clampVolume(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100
}

/** Volume and mute state; the caller decides which media element it drives. */
export function useVolume() {
  const volume = ref(1)
  const isMuted = ref(false)
  let volumeBeforeMute = 1

  function setVolume(value: number): void {
    const nextVolume = clampVolume(value)
    volume.value = nextVolume
    isMuted.value = nextVolume === 0
    if (nextVolume > 0) volumeBeforeMute = nextVolume
  }

  function toggleMute(): void {
    if (isMuted.value || volume.value === 0) {
      setVolume(volumeBeforeMute > 0 ? volumeBeforeMute : FALLBACK_RESTORE_VOLUME)
      return
    }
    volumeBeforeMute = volume.value
    volume.value = 0
    isMuted.value = true
  }

  function changeVolumeBy(delta: number): void {
    setVolume(volume.value + delta)
  }

  return { volume, isMuted, setVolume, toggleMute, changeVolumeBy }
}
