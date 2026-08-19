<template>
  <div class="container content-narrow">
    <div v-if="loading" class="card loading-state"><LoaderCircle class="spin" :size="24" /><span>{{ t('report.loading') }}</span></div>
    <template v-else-if="report">
      <div class="page-header"><div><p class="eyebrow">{{ t('report.eyebrow') }}</p><h1 class="page-title">{{ t('report.title') }}</h1><p class="page-subtitle">{{ t('report.subtitle') }}</p></div></div>
      <section class="card score-card"><div class="score-circle"><span>{{ data.overall_score }}</span><small>/10</small></div><div><p class="eyebrow">{{ t('report.overall') }}</p><p v-if="report.hire_recommendation" class="hire-rec">{{ report.hire_recommendation }}</p></div></section>
      <section class="card report-section" v-if="report.summary"><div class="section-heading"><FileText :size="18" /><h2>{{ t('report.summary') }}</h2></div><p class="long-copy">{{ report.summary }}</p></section>
      <div class="two-col"><section class="card report-section" v-if="report.strengths?.length"><div class="section-heading"><TrendingUp :size="18" /><h2>{{ t('report.strengths') }}</h2></div><ul><li v-for="(item, index) in report.strengths" :key="index">{{ item }}</li></ul></section><section class="card report-section" v-if="report.weaknesses?.length"><div class="section-heading"><CircleAlert :size="18" /><h2>{{ t('report.weaknesses') }}</h2></div><ul><li v-for="(item, index) in report.weaknesses" :key="index">{{ item }}</li></ul></section></div>
      <section class="card report-section" v-if="report.suggestions?.length"><div class="section-heading"><Lightbulb :size="18" /><h2>{{ t('report.suggestions') }}</h2></div><ul><li v-for="(item, index) in report.suggestions" :key="index">{{ item }}</li></ul></section>
      <section class="card report-section" v-if="report.question_scores?.length"><div class="section-heading"><BarChart3 :size="18" /><h2>{{ t('report.questionScores') }}</h2></div><div v-for="(question, index) in report.question_scores" :key="index" class="q-score-item"><div class="q-score-header"><span>Q{{ index + 1 }}</span><p>{{ question.question }}</p><strong :style="{ color: scoreColor(question.score) }">{{ question.score }}</strong></div><div class="q-bar"><div class="q-bar-fill" :style="{ width: `${question.score * 10}%`, background: scoreColor(question.score) }"></div></div></div></section>
      <div class="report-actions"><router-link to="/resume/upload" class="btn-primary">{{ t('report.again') }}<ArrowUpRight :size="16" /></router-link><router-link to="/dashboard" class="btn-secondary">{{ t('report.home') }}</router-link></div>
    </template>
    <div v-else class="card empty-state"><div class="empty-icon"><CircleAlert :size="22" /></div><p>{{ t('report.failed') }}</p><router-link to="/dashboard" class="btn-secondary empty-action">{{ t('report.home') }}</router-link></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ArrowUpRight, BarChart3, CircleAlert, FileText, Lightbulb, LoaderCircle, TrendingUp } from '@lucide/vue'
import { getReport } from '../api/interview'
const { t } = useI18n(); const route = useRoute(); const data = ref(null); const report = ref(null); const loading = ref(true)
function scoreColor(score) { return score >= 7 ? 'var(--success)' : score >= 5 ? 'var(--warning)' : 'var(--danger)' }
let stopped = false
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
onUnmounted(() => { stopped = true })
onMounted(async () => { try { for (let attempt = 0; attempt < 120 && !stopped; attempt++) { const response = await getReport(route.params.id); data.value = response; if (response.report_status !== 'generating' && response.report) { report.value = response.report; return } await sleep(1000) } } catch (e) { console.error(e) } finally { loading.value = false } })
</script>

<style scoped>
.score-card { display: flex; align-items: center; gap: 24px; } .score-circle { width: 104px; height: 104px; flex: 0 0 auto; display: flex; align-items: baseline; justify-content: center; border-radius: 50%; color: var(--primary-text); background: var(--primary); } .score-circle span { margin-top: 30px; font-size: 36px; font-weight: 700; } .score-circle small { margin-left: 2px; font-size: 13px; opacity: .65; } .hire-rec { margin-top: 9px; color: var(--text-soft); font-size: 14px; line-height: 1.6; }
.report-section { margin-top: 16px; } .section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; } .section-heading svg { color: var(--text-soft); } .section-heading h2 { font-size: 17px; font-weight: 650; } .long-copy, .report-section li { color: var(--text-soft); font-size: 14px; line-height: 1.8; } .report-section ul { padding-left: 18px; } .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } .q-score-item { margin-top: 19px; } .q-score-header { display: flex; align-items: center; gap: 12px; } .q-score-header > span { color: var(--text-faint); font-size: 11px; font-weight: 700; } .q-score-header p { flex: 1; overflow: hidden; color: var(--text-soft); font-size: 13px; white-space: nowrap; text-overflow: ellipsis; } .q-score-header strong { font-size: 15px; } .q-bar { height: 5px; margin-top: 8px; overflow: hidden; border-radius: 99px; background: var(--bg-hover); } .q-bar-fill { height: 100%; border-radius: inherit; transition: width .5s ease; } .report-actions { display: flex; justify-content: center; gap: 10px; margin: 28px 0 20px; }
.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 600px) { .score-card { align-items: flex-start; } .score-circle { width: 82px; height: 82px; } .score-circle span { margin-top: 23px; font-size: 28px; } .two-col { grid-template-columns: 1fr; } .report-actions { flex-direction: column; } .report-actions > * { width: 100%; } }
</style>
