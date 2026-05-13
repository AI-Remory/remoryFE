import {defineConfig, loadEnv, type ProxyOptions} from 'vite'
import react from '@vitejs/plugin-react'

function getApiProxyTarget(apiBaseUrl?: string) {
    if (!apiBaseUrl) {
        return undefined
    }

    try {
        return new URL(apiBaseUrl).origin
    } catch {
        return undefined
    }
}

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')
    const apiProxyTarget = getApiProxyTarget(env.VITE_API_BASE_URL)
    const proxy: Record<string, ProxyOptions> | undefined = apiProxyTarget
        ? {
            '/api': {
                target: apiProxyTarget,
                changeOrigin: true,
                ws: true,
            },
        }
        : undefined

    return {
        plugins: [react()],
        server: proxy ? {proxy} : undefined,
    }
})
