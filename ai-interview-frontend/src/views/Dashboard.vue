<template>
  <div class="container">
    <div class="page-header"><div><p class="eyebrow">{{ t('dashboard.eyebrow') }}</p><h1 class="page-title">{{ t('dashboard.title') }}</h1><p class="page-subtitle">{{ t('dashboard.subtitle') }}</p></div><router-link to="/resume/upload" class="btn-primary"><Plus :size="17" />{{ t('dashboard.start') }}</router-link></div>
    <div v-if="loading" class="card loading-state"><LoaderCircle class="spin" :size="24" /><span>{{ t('common.loading') }}</span></div>
    <div v-else-if="interviews.length === 0" class="card empty-state"><div class="empty-icon"><Sparkles :size="22" /></div><h2>{{ t('dashboard.emptyTitle') }}</h2><p>{{ t('dashboard.emptyText') }}</p><router-link to="/resume/upload" class="btn-primary empty-action">{{ t('dashboard.start') }}<ArrowUpRight :size="16" /></router-link></div>
    <div v-else class="interview-list">
      <article v-for="item in interviews" :key="item.interview_id" class="card interview-item">
        <div class="item-header"><div><p class="item-kicker">{{ formatDate(item.created_at) }}</p><h2>{{ item.target_position }}</h2></div><span :class="['status', item.status]">{{ statusLabel(item.status) }}</span></div>
        <div class="item-meta"><span><span class="meta-label">{{ t('dashboard.difficulty') }}</span>{{ difficultyLabel(item.difficulty) }}</span><span><span class="meta-label">{{ t('dashboard.questionCount') }}</span>{{ item.total_questions }}</span><span v-if="item.overall_score != null"><span class="meta-label">{{ t('dashboard.score') }}</span>{{ item.overall_score }}/10</span></div>
        <div class="item-actions"><router-link v-if="item.status === 'in_progress'" :to="`/interview/${item.interview_id}`" class="btn-primary btn-sm">{{ t('dashboard.continue') }}<ArrowUpRight :size="14" /></router-link><router-link v-else :to="`/interview/${item.interview_id}/report`" class="btn-secondary btn-sm">{{ t('dashboard.report') }}<ArrowUpRight :size="14" /></router-link><button class="btn-danger btn-sm" type="button" @click="handleDelete(item.interview_id)"><Trash2 :size="14" />{{ t('common.delete') }}</button></div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUpRight, LoaderCircle, Plus, Sparkles, Trash2 } from '@lucide/vue'
import { getInterviews, deleteInterview } from '../api/interview'
const { t, locale } = useI18n(); const interviews = ref([]); const loading = ref(true)
function difficultyLabel(value) { return t(`common.${value}`, value) }
function statusLabel(value) { return value === 'completed' ? t('common.completed') : t('common.inProgress') }
function formatDate(value) { if (!value) return ''; return new Date(value).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
onMounted(async () => { try { const data = await getInterviews(); interviews.value = data.items || [] } catch (e) { console.error(e) } finally { loading.value = false } })
async function handleDelete(interviewId) { if (!confirm(t('dashboard.deleteConfirm'))) return; try { await deleteInterview(interviewId); interviews.value = interviews.value.filter(i => i.interview_id !== interviewId) } catch (e) { alert(`${t('dashboard.deleteFailed')}: ${e.message}`) } }
</script>

<style scoped>
.interview-list { display: grid; gap: 14px; } .interview-item { padding: 24px 26px; } .item-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; } .item-kicker { color: var(--text-faint); font-size: 11px; } .item-header h2 { margin-top: 7px; font-size: 18px; font-weight: 650; }
.item-meta { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); color: var(--text-soft); font-size: 13px; } .meta-label { margin-right: 7px; color: var(--text-faint); font-size: 11px; }
.item-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; } .empty-state h2 { font-size: 20px; } .empty-state p { margin-top: 8px; color: var(--text-soft); font-size: 14px; } .empty-action { margin-top: 24px; } .loading-state { display: flex; align-items: center; justify-content: center; gap: 10px; }
.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 520px) { .interview-item { padding: 20px; } .item-header { flex-direction: column; } .item-meta { gap: 12px; } .item-actions > * { flex: 1; } }
</style>
