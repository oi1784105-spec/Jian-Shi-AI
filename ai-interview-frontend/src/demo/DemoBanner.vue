<template>
  <div v-if="DEMO_MODE" class="demo-badge" role="status">
    <span class="demo-dot" />
    <span class="demo-text"><strong>{{ t('demo.title') }}</strong><small>{{ t('demo.hint') }}</small></span>
    <button class="demo-reset" type="button" @click="resetDemo">{{ t('demo.reset') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { DEMO_MODE, resetDemo } from '../demo'

const { t } = useI18n()
</script>

<style scoped>
/* 常驻左下角，保持醒目但不遮挡主流程操作。 */
.demo-badge { position: fixed; left: 16px; bottom: 16px; z-index: 60; display: flex; align-items: center; gap: 10px; max-width: min(92vw, 460px); padding: 9px 12px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--bg-elevated); box-shadow: 0 10px 30px rgba(0, 0, 0, .12); font-size: 11px; }
.demo-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: var(--warning); }
.demo-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.demo-text strong { color: var(--text); font-size: 11px; font-weight: 700; }
.demo-text small { color: var(--text-faint); font-size: 10px; line-height: 1.4; }
.demo-reset { flex: 0 0 auto; padding: 5px 9px; border: 1px solid var(--border); border-radius: 999px; color: var(--text-soft); background: var(--bg-soft); font-size: 10px; cursor: pointer; }
.demo-reset:hover { color: var(--text); background: var(--bg-hover); }
@media (max-width: 520px) { .demo-badge { right: 12px; left: 12px; max-width: none; } .demo-text small { display: none; } }
</style>
