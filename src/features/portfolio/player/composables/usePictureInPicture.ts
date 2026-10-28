import { onMounted, ref, type Ref } from 'vue'

export function usePictureInPicture(videoRef: Ref<HTMLVideoElement | null>) {
  const isPiPSupported = ref(false)

  async function togglePiP(): Promise<void> {
    const video = videoRef.value
    if (!video) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else await video.requestPictureInPicture()
    } catch (error) {
      console.warn('PiP error', error)
    }
  }

  onMounted(() => {
    isPiPSupported.value = 'pictureInPictureEnabled' in document
  })

  return { isPiPSupported, togglePiP }
}
