<template>
  <div class="auth-page">
    <div class="auth-toolbar"><PreferenceControls /></div>
    <div class="auth-layout">
      <section class="auth-intro">
        <div class="auth-brand"><span class="brand-mark"><Sparkles :size="17" /></span><span>{{ t('common.brand') }}</span></div>
        <p class="eyebrow">{{ t('common.product') }}</p><h1>{{ t('auth.welcome') }}</h1><p>{{ t('auth.subtitle') }}</p><div class="intro-rule"></div><span>01 / 03</span>
      </section>
      <section class="auth-card card">
        <div class="auth-card-header"><p class="eyebrow">SIGN IN</p><h2>{{ t('auth.signIn') }}</h2></div>
        <p v-if="DEMO_MODE" class="demo-note">{{ t('demo.loginHint') }}<button class="demo-note-reset" type="button" @click="resetDemo">{{ t('demo.reset') }}</button></p>
        <form @submit.prevent="handleLogin">
          <div class="form-group"><label>{{ t('auth.email') }}</label><input v-model="email" type="email" :placeholder="t('auth.emailPlaceholder')" required /></div>
          <div class="form-group"><label>{{ t('auth.password') }}</label><input v-model="password" type="password" :placeholder="t('auth.passwordPlaceholder')" required /></div>
          <p v-if="error" class="error form-message">{{ error }}</p>
          <button type="submit" class="btn-primary auth-submit" :disabled="loading">{{ loading ? t('auth.signingIn') : t('auth.signIn') }}<ArrowUpRight :size="17" /></button>
        </form>
        <p class="auth-link">{{ t('auth.noAccount') }} <router-link to="/register">{{ t('auth.registerNow') }}</router-link></p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ArrowUpRight, Sparkles } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'
import { login } from '../api/auth'
import { getProfile } from '../api/user'
import PreferenceControls from '../components/PreferenceControls.vue'
import { DEMO_MODE, DEMO_CREDENTIALS, resetDemo } from '../demo'
const { t } = useI18n(); const router = useRouter(); const authStore = useAuthStore()
// 演示构建下预填演示账号，访客点一下登录就能完整体验；真实环境保持空白。
const email = ref(DEMO_MODE ? DEMO_CREDENTIALS.email : ''); const password = ref(DEMO_MODE ? DEMO_CREDENTIALS.password : ''); const error = ref(''); const loading = ref(false)
async function handleLogin() { error.value = ''; loading.value = true; try { const data = await login(email.value, password.value); authStore.setAuth(data); try { authStore.setUserInfo(await getProfile()) } catch (_) {}; router.push('/dashboard') } catch (e) { error.value = e.message } finally { loading.value = false } }
</script>

<style scoped>
.auth-page { min-height: 100vh; padding: 28px 40px; display: grid; place-items: center; position: relative; } .auth-toolbar { position: fixed; top: 24px; right: 40px; }
.auth-layout { width: min(100%, 900px); display: grid; grid-template-columns: 1fr 420px; gap: 72px; align-items: center; } .auth-intro { padding: 24px 0; }
.auth-brand { display: inline-flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 750; margin-bottom: 76px; } .brand-mark { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9px; background: var(--primary); color: var(--primary-text); }
.auth-intro h1 { max-width: 360px; margin-top: 18px; font-size: clamp(36px, 6vw, 62px); line-height: 1; font-weight: 650; letter-spacing: 0; } .auth-intro > p:not(.eyebrow) { max-width: 300px; margin-top: 22px; color: var(--text-soft); font-size: 16px; line-height: 1.7; }
.intro-rule { width: 80px; height: 1px; margin: 76px 0 14px; background: var(--border-strong); } .auth-intro > span { color: var(--text-faint); font-size: 11px; } .auth-card { padding: 34px; } .auth-card-header { margin-bottom: 28px; } .auth-card h2 { margin-top: 8px; font-size: 26px; font-weight: 650; }
.auth-submit { width: 100%; margin-top: 4px; } .form-message { margin: -4px 0 14px; } .auth-link { margin-top: 20px; color: var(--text-soft); font-size: 13px; text-align: center; } .auth-link a { color: var(--text); font-weight: 700; } .demo-note { margin-bottom: 18px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-soft); background: var(--bg-soft); font-size: 12px; line-height: 1.6; } .demo-note-reset { margin-left: 6px; padding: 3px 8px; border: 1px solid var(--border); border-radius: 999px; color: var(--text-soft); background: var(--bg-elevated); font-size: 11px; cursor: pointer; } .demo-note-reset:hover { color: var(--text); background: var(--bg-hover); }
@media (max-width: 720px) { .auth-page { padding: 84px 16px 28px; } .auth-toolbar { top: 20px; right: 16px; } .auth-layout { display: block; } .auth-intro { padding: 0 8px 28px; } .auth-brand { margin-bottom: 42px; } .auth-intro h1 { font-size: 42px; } .auth-intro > p:not(.eyebrow) { margin-top: 14px; } .intro-rule { margin-top: 32px; } .auth-card { padding: 24px 20px; } }
</style>
