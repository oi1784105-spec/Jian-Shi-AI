import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAiProviderStore } from '../stores/aiProvider'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { auth: true } },
  { path: '/resume/upload', name: 'ResumeUpload', component: () => import('../views/ResumeUpload.vue'), meta: { auth: true, ai: true } },
  { path: '/interview/:id', name: 'Interview', component: () => import('../views/Interview.vue'), meta: { auth: true } },
  { path: '/interview/:id/report', name: 'Report', component: () => import('../views/Report.vue'), meta: { auth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { auth: true } },
  { path: '/settings/api', name: 'ApiSettings', component: () => import('../views/ApiSettings.vue'), meta: { auth: true } },
  { path: '/', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.auth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.ai && authStore.isLoggedIn) {
    const providerStore = useAiProviderStore()
    try {
      await providerStore.refresh()
      if (providerStore.configured) next()
      else next({ path: '/settings/api', query: { required: '1' } })
    } catch (_) {
      next()
    }
  } else {
    next()
  }
})

export default router
