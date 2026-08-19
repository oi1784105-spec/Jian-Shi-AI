<template>
  <div v-if="authStore.isLoggedIn" class="admin-layout">
    <aside class="sidebar"><router-link to="/" class="sidebar-brand"><span class="brand-mark"><Sparkles :size="16" /></span><span><strong>{{ t('common.brand') }}</strong><small>{{ t('common.product') }}</small></span></router-link><p class="sidebar-eyebrow">ADMIN CONSOLE</p><nav class="sidebar-nav"><router-link to="/" exact-active-class="active"><LayoutDashboard :size="17" />{{ t('common.overview') }}</router-link><router-link to="/users" active-class="active"><UsersRound :size="17" />{{ t('common.users') }}</router-link><router-link to="/interviews" active-class="active"><MessagesSquare :size="17" />{{ t('common.interviews') }}</router-link></nav><div class="sidebar-bottom"><span class="admin-email">{{ authStore.email }}</span><button class="sidebar-logout" type="button" @click="logout"><LogOut :size="15" />{{ t('common.logout') }}</button></div></aside>
    <div class="admin-content"><header class="mobile-topbar"><button class="icon-button" type="button" :aria-label="menuOpen ? 'Close menu' : 'Open menu'" @click="menuOpen = !menuOpen"><Menu v-if="!menuOpen" :size="18" /><X v-else :size="18" /></button><span>{{ t('common.product') }}</span><div><PreferenceControls /></div></header><div v-if="menuOpen" class="mobile-nav"><router-link to="/" @click="menuOpen = false">{{ t('common.overview') }}</router-link><router-link to="/users" @click="menuOpen = false">{{ t('common.users') }}</router-link><router-link to="/interviews" @click="menuOpen = false">{{ t('common.interviews') }}</router-link></div><main class="admin-main"><router-view /></main></div>
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LayoutDashboard, LogOut, Menu, MessagesSquare, Sparkles, UsersRound, X } from '@lucide/vue'
import { useAuthStore } from './stores/auth'
import PreferenceControls from './components/PreferenceControls.vue'
const { t } = useI18n(); const authStore = useAuthStore(); const router = useRouter(); const menuOpen = ref(false)
function logout() { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.admin-layout { min-height:100vh; display:flex; } .sidebar { width:236px; flex:0 0 auto; position:fixed; inset:0 auto 0 0; display:flex; flex-direction:column; padding:28px 18px 20px; background:var(--bg-elevated); border-right:1px solid var(--border); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); } .sidebar-brand { display:flex; align-items:center; gap:10px; } .brand-mark { width:30px; height:30px; display:grid; place-items:center; border-radius:9px; color:var(--primary-text); background:var(--primary); } .sidebar-brand strong { display:block; font-size:17px; font-weight:750; } .sidebar-brand small { display:block; margin-top:2px; color:var(--text-faint); font-size:9px; font-weight:700; } .sidebar-eyebrow { margin:56px 10px 12px; color:var(--text-faint); font-size:10px; font-weight:700; }
.sidebar-nav { display:flex; flex-direction:column; gap:4px; } .sidebar-nav a { display:flex; align-items:center; gap:10px; padding:11px 12px; border-radius:var(--radius-md); color:var(--text-soft); font-size:13px; } .sidebar-nav a:hover,.sidebar-nav a.active { color:var(--text); background:var(--bg-hover); } .sidebar-nav a.active { box-shadow:inset 2px 0 var(--primary); } .sidebar-bottom { margin-top:auto; padding-top:16px; border-top:1px solid var(--border); } .admin-email { display:block; max-width:190px; overflow:hidden; color:var(--text-faint); font-size:11px; text-overflow:ellipsis; white-space:nowrap; } .sidebar-logout { width:100%; min-height:34px; margin-top:12px; display:flex; align-items:center; justify-content:flex-start; gap:8px; padding:0 10px; color:var(--text-soft); background:transparent; border:1px solid transparent; border-radius:var(--radius-md); font-size:12px; } .sidebar-logout:hover { color:var(--danger); background:var(--danger-bg); }
.admin-content { width:calc(100% - 236px); min-width:0; margin-left:236px; } .mobile-topbar,.mobile-nav { display:none; }
@media (max-width:850px) { .sidebar { display:none; } .admin-content { width:100%; margin-left:0; } .mobile-topbar { min-height:62px; padding:0 18px; display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--border); background:var(--bg-elevated); } .mobile-topbar > span { color:var(--text-soft); font-size:12px; font-weight:700; } .mobile-topbar > div { margin-left:auto; } .mobile-nav { position:relative; z-index:5; padding:8px 16px 12px; display:flex; gap:6px; border-bottom:1px solid var(--border); background:var(--bg-elevated); } .mobile-nav a { padding:9px 10px; color:var(--text-soft); border-radius:var(--radius-md); font-size:12px; } .mobile-nav a.router-link-active { color:var(--text); background:var(--bg-hover); } }
</style>
