import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8006'
  // GitHub Pages 部署在 /<repo>/ 子路径下，需要显式指定 base；
  // 本地开发与常规服务器部署保持默认的 '/'。
  const base = env.VITE_BASE || '/'

  return {
    base,
    plugins: [vue()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  }
})
