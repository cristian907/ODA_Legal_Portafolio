import express, { Router } from 'express'
import { createPhoto, deletePhoto, recropPhoto } from './photoController'
import { uploadPhoto } from './photoUploadMiddleware'

const TRANSFORM_BODY_LIMIT = '10kb'

export function createPhotoRouter(): Router {
  const router = Router()
  router.post('/photos', uploadPhoto, createPhoto)
  router.put('/photos/:id/crop', express.json({ limit: TRANSFORM_BODY_LIMIT }), recropPhoto)
  router.delete('/photos/:id', deletePhoto)
  return router
}
