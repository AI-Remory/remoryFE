import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://141.164.48.128:8000',
                changeOrigin: true,
                ws: true,
            },
        },
    },
})