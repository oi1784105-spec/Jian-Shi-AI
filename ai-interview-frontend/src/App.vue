<template>
  <div class="app-shell">
    <header v-if="authStore.token" class="topbar">
      <div class="topbar-inner">
        <router-link to="/dashboard" class="brand-lockup">
          <span class="brand-mark"><Sparkles :size="16" /></span>
          <span><strong>{{ t('common.brand') }}</strong><small>{{ t('common.product') }}</small></span>
        </router-link>
        <nav class="main-nav" :aria-label="t('common.records')">
          <router-link to="/dashboard"><LayoutList :size="16" />{{ t('common.records') }}</router-link>
          <router-link to="/resume/upload"><FileUp :size="16" />{{ t('common.upload') }}</router-link>
          <router-link to="/settings/api"><KeyRound :size="16" />{{ t('common.apiSettings') }}<span v-if="authStore.token && !aiProviderStore.configured" class="nav-dot" /></router-link>
        </nav>
        <div class="topbar-actions">
          <span v-if="aiProviderStore.configured" class="provider-status"><span class="status-dot" />{{ aiProviderStore.activeProvider?.name }}</span>
          <PreferenceControls />
          <router-link to="/profile" class="profile-link">
            <img v-if="authStore.userAvatar && !avatarError" :src="authStore.userAvatar" class="nav-avatar" alt="" @error="avatarError = true" />
            <span v-else class="nav-avatar-placeholder"><UserRound :size="16" /></span>
            <span class="profile-name">{{ authStore.userName || t('common.profile') }}</span>
          </router-link>
          <button class="icon-button logout-button" type="button" :title="t('common.logout')" :aria-label="t('common.logout')" @click="logout"><LogOut :size="17" /></button>
        </div>
      </div>
    </header>

    <main class="app-main"><router-view /></main>

    <footer v-if="authStore.token" class="app-footer">
      <div><strong>{{ t('common.brand') }}</strong><span>{{ t('footer.tagline') }}</span></div>
      <span>{{ t('footer.copyright') }}</span>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { FileUp, KeyRound, LayoutList, LogOut, Sparkles, UserRound } from '@lucide/vue'
import { useAuthStore } from './stores/auth'
import { getProfile } from './api/user'
import PreferenceControls from './components/PreferenceControls.vue'
import { useAiProviderStore } from './stores/aiProvider'

const { t } = useI18n()
const authStore = useAuthStore()
const aiProviderStore = useAiProviderStore()
const router = useRouter()
const avatarError = ref(false)

onMounted(async () => {
  if (!authStore.token) return
  try { authStore.setUserInfo(await getProfile()); avatarError.value = false } catch (_) {}
  try { await aiProviderStore.refresh() } catch (_) {}
})

function logout() { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.app-main { flex: 1; }
.topbar { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid var(--border); background: var(--bg-elevated); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); }
.topbar-inner { width: min(100% - 40px, var(--container)); min-height: 72px; margin: 0 auto; display: flex; align-items: center; gap: 32px; }
.brand-lockup { display: inline-flex; align-items: center; gap: 10px; min-width: 150px; }
.brand-lockup strong { display: block; font-size: 17px; font-weight: 750; letter-spacing: 0; }
.brand-lockup small { display: block; margin-top: 2px; color: var(--text-faint); font-size: 9px; font-weight: 700; letter-spacing: 0; }
.brand-mark { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; color: var(--primary-text); background: var(--primary); }
.main-nav { display: flex; align-items: center; gap: 4px; flex: 1; }
.main-nav a { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: var(--radius-md); color: var(--text-soft); font-size: 13px; }
.main-nav a:hover, .main-nav a.router-link-active { color: var(--text); background: var(--bg-hover); }
.main-nav a { position: relative; }
.nav-dot { width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--warning); }
.provider-status { display: inline-flex; align-items: center; gap: 6px; max-width: 150px; overflow: hidden; color: var(--text-faint); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
.status-dot { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: var(--success); }
.topbar-actions { display: flex; align-items: center; gap: 10px; }
.profile-link { display: inline-flex; align-items: center; gap: 8px; color: var(--text-soft); font-size: 12px; }
.profile-link:hover { color: var(--text); }
.nav-avatar, .nav-avatar-placeholder { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border); }
.nav-avatar-placeholder { display: grid; place-items: center; color: var(--text-soft); background: var(--bg-soft); }
.logout-button { display: none; }
.app-footer { width: min(100% - 40px, var(--container)); margin: 0 auto; padding: 22px 0 28px; display: flex; align-items: center; justify-content: space-between; gap: 20px; color: var(--text-faint); font-size: 11px; }
.app-footer div { display: flex; align-items: center; gap: 12px; } .app-footer strong { color: var(--text); font-size: 13px; }
@media (max-width: 720px) {
  .topbar-inner { width: min(100% - 32px, var(--container)); min-height: 64px; gap: 14px; }
  .brand-lockup { min-width: auto; } .brand-lockup small, .main-nav a span, .profile-name { display: none; }
  .main-nav { gap: 0; } .main-nav a { padding: 9px; } .topbar-actions { margin-left: auto; gap: 6px; }
  .logout-button { display: inline-flex; } .app-footer { width: min(100% - 32px, var(--container)); align-items: flex-start; flex-direction: column; gap: 8px; }
}
</style>
