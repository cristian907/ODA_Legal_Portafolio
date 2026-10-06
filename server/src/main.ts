import express from 'express'
import { PORT, UPLOADS_DIR, UPLOADS_PUBLIC_PATH } from './config'
import { errorHandler } from './http/errorHandler'
import { createVideoRouter } from './http/videoRoutes'
import { ensureUploadDirectories } from './storage/localFileStorage'

function createApp(): express.Express {
  const app = express()
  app.use(UPLOADS_PUBLIC_PATH, express.static(UPLOADS_DIR, { dotfiles: 'deny' }))
  app.use('/api', createVideoRouter())
  app.use(errorHandler)
  return app
}

async function start(): Promise<void> {
  await ensureUploadDirectories()
  createApp().listen(PORT, () => {
    console.log(`Video server listening on http://localhost:${PORT}`)
  })
}

await start()
