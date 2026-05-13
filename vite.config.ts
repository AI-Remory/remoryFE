import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendOrigin = env.REMORY_BACKEND_ORIGIN || 'http://141.164.48.128:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/uploads': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/health': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
