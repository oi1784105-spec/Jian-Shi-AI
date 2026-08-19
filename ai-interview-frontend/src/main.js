import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import './style.css'

const initialTheme = localStorage.getItem('jianshi-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
document.documentElement.dataset.theme = initialTheme
document.documentElement.style.colorScheme = initialTheme

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
