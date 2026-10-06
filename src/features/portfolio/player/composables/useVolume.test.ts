import { describe, expect, it } from 'vitest'
import { useVolume } from './useVolume'

describe('useVolume', () => {
  it('starts at full volume, unmuted', () => {
    const { volume, isMuted } = useVolume()
    expect(volume.value).toBe(1)
    expect(isMuted.value).toBe(false)
  })

  it('mutes and restores the previous volume', () => {
    const { volume, isMuted, setVolume, toggleMute } = useVolume()
    setVolume(0.4)
    toggleMute()
    expect(volume.value).toBe(0)
    expect(isMuted.value).toBe(true)
    toggleMute()
    expect(volume.value).toBe(0.4)
    expect(isMuted.value).toBe(false)
  })

  it('treats a zero volume as muted and unmutes to a default level', () => {
    const { volume, isMuted, setVolume, toggleMute } = useVolume()
    setVolume(0)
    expect(isMuted.value).toBe(true)
    toggleMute()
    expect(volume.value).toBe(1)
    expect(isMuted.value).toBe(false)
  })

  it('changes the volume by a delta clamped to [0, 1]', () => {
    const { volume, isMuted, changeVolumeBy, setVolume } = useVolume()
    changeVolumeBy(0.1)
    expect(volume.value).toBe(1)
    setVolume(0.05)
    changeVolumeBy(-0.1)
    expect(volume.value).toBe(0)
    expect(isMuted.value).toBe(true)
    changeVolumeBy(0.1)
    expect(volume.value).toBe(0.1)
    expect(isMuted.value).toBe(false)
  })
})
