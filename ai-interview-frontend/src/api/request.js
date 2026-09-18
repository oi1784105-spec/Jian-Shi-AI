import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'
import { DEMO_MODE, demoAdapter } from '../demo'

// 默认走同源相对路径，由 Nginx 或 Vite 代理转发到后端；
// 部署到 GitHub Pages 这类纯静态环境时，可以用 VITE_API_BASE_URL 指向独立后端。
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const api = axios.create({
  baseURL,
  timeout: 60000,
  // 演示构建下由本地适配器接管全部 JSON 接口，不产生任何真实网络请求。
  ...(DEMO_MODE ? { adapter: demoAdapter } : {})
})

// 请求拦截器 - 自动带上 token
api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  response => {
    const data = response.data
    if (data.code === 200) {
      return data.data
    }
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  error => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      router.push('/login')
    }
    const data = error.response?.data
    // 处理 FastAPI 422 验证错误的详细信息
    let msg = data?.message || error.message || '网络错误'
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        msg = data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ')
      } else if (typeof data.detail === 'string') {
        msg = data.detail
      }
    }
    return Promise.reject(new Error(msg))
  }
)

export default api
