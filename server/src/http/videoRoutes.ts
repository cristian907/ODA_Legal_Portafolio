import { Router } from 'express'
import { uploadVideoPackage } from './uploadMiddleware'
import { createVideo, deleteVideo, healthCheck } from './videoController'

export function createVideoRouter(): Router {
  const router = Router()
  router.get('/health', healthCheck)
  router.post('/videos', uploadVideoPackage, createVideo)
  router.delete('/videos/:id', deleteVideo)
  return router
}
