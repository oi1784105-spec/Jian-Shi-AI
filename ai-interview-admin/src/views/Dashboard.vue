<template>
  <div class="content-wrap"><div class="page-header"><div><p class="eyebrow">{{ t('dashboard.eyebrow') }}</p><h1 class="page-title">{{ t('dashboard.title') }}</h1><p class="page-subtitle">{{ t('dashboard.subtitle') }}</p></div><PreferenceControls /></div><div class="stats-grid"><article v-for="item in statCards" :key="item.key" class="card stat-card"><span class="stat-icon"><component :is="item.icon" :size="19" /></span><strong>{{ stats[item.key] }}</strong><span>{{ item.label }}</span></article></div></div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'; import { useI18n } from 'vue-i18n'; import { FileText, MessagesSquare, UserRound, CheckCircle2 } from '@lucide/vue'; import { userApi } from '../api'; import PreferenceControls from '../components/PreferenceControls.vue'
const { t } = useI18n(); const stats = ref({ user_count: 0, resume_count: 0, interview_count: 0, completed_interview_count: 0 }); const statCards = computed(() => [{ key:'user_count', label:t('dashboard.users'), icon:UserRound }, { key:'resume_count', label:t('dashboard.resumes'), icon:FileText }, { key:'interview_count', label:t('dashboard.interviews'), icon:MessagesSquare }, { key:'completed_interview_count', label:t('dashboard.completed'), icon:CheckCircle2 }]); onMounted(async () => { try { stats.value = await userApi.stats() } catch (e) { console.error(e) } })
</script>
<style scoped>
.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; } .stat-card { min-height:164px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; } .stat-icon { width:38px; height:38px; display:grid; place-items:center; border:1px solid var(--border); border-radius:10px; color:var(--text-soft); background:var(--bg-soft); } .stat-card strong { margin-top:20px; font-size:38px; line-height:1; font-weight:650; } .stat-card > span:last-child { margin-top:8px; color:var(--text-soft); font-size:12px; }
@media(max-width:900px) { .stats-grid { grid-template-columns:repeat(2,1fr); } } @media(max-width:520px) { .stats-grid { grid-template-columns:1fr; } .stat-card { min-height:140px; } }
</style>
