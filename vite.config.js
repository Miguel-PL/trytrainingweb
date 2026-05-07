import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** Cambia solo esto: 'dev' | 'prod' */
const PROXY_ENV = 'prod'

const API_PROXY_TARGET = {
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
      },
    },
  },
})
