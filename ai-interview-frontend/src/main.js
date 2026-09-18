import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import { installDemo } from './demo'
import './style.css'

const initialTheme = localStorage.getItem('jianshi-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
document.documentElement.dataset.theme = initialTheme
document.documentElement.style.colorScheme = initialTheme

// 演示构建必须在挂载前安装：路由守卫会在首次导航时立即发起请求。
installDemo()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
