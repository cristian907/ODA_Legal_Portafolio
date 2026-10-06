import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Local file server; override with VITE_API_TARGET to run a second instance side by side.
const VIDEO_SERVER_URL = process.env.VITE_API_TARGET ?? 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': VIDEO_SERVER_URL,
      '/uploads': VIDEO_SERVER_URL,
    },
  },
})
