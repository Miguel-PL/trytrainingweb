import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** Cambia solo esto: 'local' | 'dev' | 'prod' */
const PROXY_ENV = 'local'

const API_PROXY_TARGET = {
  local: 'http://127.0.0.1:8000',
  dev: 'http://trytraining.test',
  prod: 'https://api.trytraining.es',
}[PROXY_ENV]

if (!API_PROXY_TARGET) {
  throw new Error(`vite.config.js: PROXY_ENV="${PROXY_ENV}" no tiene URL en API_PROXY_TARGET`)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        // Subidas grandes / red lenta (el 413 lo suele devolver Nginx/PHP del target, no Vite)
        timeout: 600_000,
      },
    },
  },
})
