<template>
  <div class="container api-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">{{ t('apiSettings.eyebrow') }}</p>
        <h1 class="page-title">{{ t('apiSettings.title') }}</h1>
        <p class="page-subtitle">{{ t('apiSettings.subtitle') }}</p>
      </div>
      <button class="btn-primary" type="button" @click="openCreate"><Plus :size="16" />{{ t('apiSettings.add') }}</button>
    </div>

    <div v-if="route.query.required" class="notice notice-warn"><CircleAlert :size="17" />{{ t('apiSettings.required') }}</div>
    <div v-if="pageError" class="notice notice-error"><CircleAlert :size="17" />{{ pageError }}</div>

    <div v-if="loading" class="card loading-state">{{ t('common.loading') }}</div>
    <div v-else-if="!providers.length && !editing" class="card empty-state">
      <div class="empty-icon"><KeyRound :size="22" /></div>
      <h2>{{ t('apiSettings.empty') }}</h2>
      <p>{{ t('apiSettings.emptyHint') }}</p>
      <button class="btn-primary empty-action" type="button" @click="openCreate"><Plus :size="16" />{{ t('apiSettings.add') }}</button>
    </div>

    <div v-else class="settings-layout">
      <section class="provider-list">
        <article v-for="provider in providers" :key="provider.id" class="card provider-card" :class="{ active: provider.is_active }">
          <div class="provider-card-head">
            <div class="provider-logo"><KeyRound :size="17" /></div>
            <div class="provider-title"><h2>{{ provider.name }}</h2><p>{{ provider.provider }} · {{ provider.default_model }}</p></div>
            <span v-if="provider.is_active" class="tag tag-green">{{ t('apiSettings.active') }}</span>
          </div>
          <p v-if="provider.note" class="provider-note">{{ provider.note }}</p>
          <div class="provider-meta"><span>{{ provider.api_key_masked }}</span><span :class="provider.is_validated ? 'tag-green' : 'tag-red'">{{ provider.is_validated ? t('apiSettings.validated') : t('apiSettings.unvalidated') }}</span></div>
          <div class="provider-actions">
            <button class="btn-secondary btn-sm" type="button" @click="editProvider(provider)"><Pencil :size="14" />{{ t('apiSettings.edit') }}</button>
            <button v-if="!provider.is_active" class="btn-primary btn-sm" type="button" :disabled="!provider.is_validated" @click="activate(provider)"><Check :size="14" />{{ t('apiSettings.activate') }}</button>
            <button class="btn-danger btn-sm" type="button" @click="removeProvider(provider)"><Trash2 :size="14" />{{ t('apiSettings.remove') }}</button>
          </div>
        </article>
      </section>

      <section v-if="editing" class="card editor-card">
        <div class="editor-head"><div><p class="eyebrow">{{ editing.id ? t('apiSettings.edit') : t('apiSettings.add') }}</p><h2>{{ form.name || t('apiSettings.title') }}</h2></div><button class="icon-button" type="button" :title="t('common.cancel')" @click="closeEditor"><X :size="17" /></button></div>
        <form @submit.prevent="saveProvider">
          <div class="form-row">
            <div class="form-group"><label>{{ t('apiSettings.provider') }}</label><select v-model="form.provider" :disabled="Boolean(form.id)" @change="applyPreset"><option v-for="preset in presets" :key="preset.key" :value="preset.key">{{ preset.label }}</option></select></div>
            <div class="form-group"><label>{{ t('apiSettings.identifier') }}</label><input v-model="form.identifier" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" :placeholder="t('apiSettings.identifierHint')" /></div>
          </div>
          <div class="form-row"><div class="form-group"><label>{{ t('apiSettings.name') }}</label><input v-model="form.name" required /></div><div class="form-group"><label>{{ t('apiSettings.note') }}</label><input v-model="form.note" :placeholder="t('apiSettings.notePlaceholder')" /></div></div>
          <div class="form-row"><div class="form-group"><label>{{ t('apiSettings.website') }}</label><input v-model="form.website_url" type="url" /></div><div class="form-group"><label>{{ t('apiSettings.protocol') }}</label><input :value="selectedPreset?.protocol || ''" disabled /></div></div>
          <div class="form-group"><label>{{ t('apiSettings.endpoint') }}</label><input v-model="form.base_url" type="url" required /><small>{{ t('apiSettings.endpointHint') }}</small></div>
          <div class="form-group"><label>{{ t('apiSettings.apiKey') }}</label><div class="input-with-action"><input v-model="form.api_key" :type="showKey ? 'text' : 'password'" :required="!form.id" autocomplete="new-password" :placeholder="form.id ? t('apiSettings.apiKeyHint') : ''" /><button class="icon-button" type="button" :title="showKey ? t('apiSettings.hideKey') : t('apiSettings.showKey')" @click="showKey = !showKey"><EyeOff v-if="showKey" :size="16" /><Eye v-else :size="16" /></button></div><small>{{ t('apiSettings.apiKeyHint') }}</small></div>
          <div class="form-group"><div class="field-line"><label>{{ t('apiSettings.models') }}</label><button class="btn-secondary btn-sm" type="button" :disabled="discovering || !form.api_key" @click="discoverModels"><RefreshCw :size="14" :class="{ spin: discovering }" />{{ discovering ? t('apiSettings.discovering') : t('apiSettings.discover') }}</button></div><div class="model-entry"><input v-model="modelInput" :placeholder="t('apiSettings.modelPlaceholder')" @keydown.enter.prevent="addModel" /><button class="btn-secondary btn-sm" type="button" @click="addModel"><Plus :size="14" /></button></div><div class="model-tags"><button v-for="model in form.models" :key="model" class="model-tag" type="button" @click="removeModel(model)">{{ model }} <X :size="12" /></button></div></div>
          <div class="form-row"><div class="form-group"><label>{{ t('apiSettings.defaultModel') }}</label><select v-model="form.default_model" required><option value="" disabled>{{ t('apiSettings.modelRequired') }}</option><option v-for="model in form.models" :key="model" :value="model">{{ model }}</option></select></div><div class="form-group"><label>{{ t('apiSettings.apiVersion') }}</label><input v-model="form.api_version" /></div></div>
          <p v-if="editorError" class="error editor-error">{{ editorError }}</p><p v-if="editorSuccess" class="success-msg">{{ editorSuccess }}</p>
          <div class="editor-actions"><button class="btn-primary" type="submit" :disabled="saving"><Save :size="16" />{{ saving ? t('apiSettings.saving') : t('apiSettings.save') }}</button><button v-if="form.id" class="btn-secondary" type="button" :disabled="testing" @click="testProvider"><PlugZap :size="16" />{{ testing ? t('apiSettings.testing') : t('apiSettings.test') }}</button></div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Check, CircleAlert, Eye, EyeOff, KeyRound, Pencil, PlugZap, Plus, RefreshCw, Save, Trash2, X } from '@lucide/vue'
import { activateAiProvider, createAiProvider, deleteAiProvider, discoverAiProviderModels, getAiProviderPresets, listAiProviders, testAiProvider, updateAiProvider } from '../api/aiProvider'
import { useAiProviderStore } from '../stores/aiProvider'

const { t } = useI18n(); const route = useRoute(); const providerStore = useAiProviderStore()
const providers = ref([]); const presets = ref([]); const loading = ref(true); const pageError = ref(''); const editing = ref(null); const modelInput = ref(''); const showKey = ref(false); const saving = ref(false); const testing = ref(false); const discovering = ref(false); const editorError = ref(''); const editorSuccess = ref('')
const emptyForm = () => ({ id: null, identifier: '', provider: 'deepseek', name: '', note: '', website_url: '', base_url: '', api_key: '', models: [], default_model: '', api_version: '' })
const form = reactive(emptyForm())
const selectedPreset = computed(() => presets.value.find(item => item.key === form.provider))

async function load() { loading.value = true; pageError.value = ''; try { [providers.value, presets.value] = await Promise.all([listAiProviders(), getAiProviderPresets()]) } catch (e) { pageError.value = e.message } finally { loading.value = false } }
function openCreate() { Object.assign(form, emptyForm()); editing.value = true; showKey.value = false; editorError.value = ''; editorSuccess.value = ''; applyPreset() }
function editProvider(provider) { Object.assign(form, { ...provider, api_key: '', models: [...(provider.models || [])] }); editing.value = true; showKey.value = false; editorError.value = ''; editorSuccess.value = '' }
function closeEditor() { editing.value = null; editorError.value = ''; editorSuccess.value = '' }
function applyPreset() { const p = selectedPreset.value; if (!p) return; form.website_url = p.website_url || ''; form.base_url = p.default_base_url || ''; if (!form.name || !form.id) form.name = p.label; if (!form.identifier || !form.id) form.identifier = form.provider.replace(/[^a-z0-9]+/g, '-'); if (!form.models.length) form.models = [...(p.default_models || [])]; if (!form.default_model) form.default_model = form.models[0] || '' }
function addModel() { const value = modelInput.value.trim(); if (value && !form.models.includes(value)) form.models.push(value); if (!form.default_model) form.default_model = value; modelInput.value = '' }
function removeModel(model) { form.models = form.models.filter(item => item !== model); if (form.default_model === model) form.default_model = form.models[0] || '' }
async function saveProvider() { editorError.value = ''; editorSuccess.value = ''; if (!form.models.length) { editorError.value = t('apiSettings.noModels'); return } saving.value = true; try { const payload = { ...form }; delete payload.id; if (form.id && !payload.api_key) delete payload.api_key; const saved = form.id ? await updateAiProvider(form.id, payload) : await createAiProvider(payload); await load(); Object.assign(form, { ...saved, api_key: '', models: [...(saved.models || [])] }); form.id = saved.id; editing.value = true; editorSuccess.value = t('apiSettings.saved') } catch (e) { editorError.value = e.message } finally { saving.value = false } }
async function testProvider() { testing.value = true; editorError.value = ''; editorSuccess.value = ''; try { const result = await testAiProvider(form.id); Object.assign(form, { ...result, api_key: '', models: [...(result.models || [])] }); providers.value = await listAiProviders(); editorSuccess.value = t('apiSettings.tested') } catch (e) { editorError.value = e.message } finally { testing.value = false } }
async function activate(provider) { try { const result = await activateAiProvider(provider.id); providers.value = await listAiProviders(); providerStore.setStatus({ configured: true, active_provider: result }) } catch (e) { pageError.value = e.message } }
async function discoverModels() { discovering.value = true; editorError.value = ''; try { const data = await discoverAiProviderModels({ provider: form.provider, base_url: form.base_url, api_key: form.api_key, api_version: form.api_version || null }); for (const model of data.models || []) if (!form.models.includes(model)) form.models.push(model); if (!form.default_model) form.default_model = form.models[0] || '' } catch (e) { editorError.value = e.message } finally { discovering.value = false } }
async function removeProvider(provider) { if (!window.confirm(t('apiSettings.deleteConfirm'))) return; try { await deleteAiProvider(provider.id); await load(); providerStore.refresh() } catch (e) { pageError.value = e.message } }
onMounted(load)
</script>

<style scoped>
.api-page { max-width: 1120px; }
.notice { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 13px 16px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; }
.notice-warn { color: var(--warning); background: var(--warning-bg); }.notice-error { color: var(--danger); background: var(--danger-bg); }
.settings-layout { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(420px, 1.2fr); align-items: start; gap: 20px; }
.provider-list { display: grid; gap: 14px; }.provider-card { padding: 20px; }.provider-card.active { border-color: var(--success); }.provider-card-head { display: flex; align-items: center; gap: 12px; }.provider-logo { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 10px; color: var(--primary-text); background: var(--primary); }.provider-title { min-width: 0; flex: 1; }.provider-title h2 { font-size: 15px; }.provider-title p, .provider-note { margin-top: 4px; color: var(--text-faint); font-size: 11px; }.provider-note { margin-top: 14px; line-height: 1.5; }.provider-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 16px; color: var(--text-soft); font-size: 12px; }.provider-meta > span:last-child { padding: 4px 8px; border-radius: 999px; background: var(--bg-soft); }.provider-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }.editor-card { padding: 24px; }.editor-head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 24px; }.editor-head h2 { margin-top: 5px; font-size: 21px; }.input-with-action, .model-entry, .field-line { display: flex; align-items: center; gap: 8px; }.input-with-action input, .model-entry input { flex: 1; }.input-with-action .icon-button { flex: 0 0 38px; }.form-group small { display: block; margin-top: 7px; color: var(--text-faint); font-size: 11px; line-height: 1.45; }.field-line { justify-content: space-between; margin-bottom: 8px; }.field-line label { margin-bottom: 0; }.model-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }.model-tag { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border: 1px solid var(--border); border-radius: 999px; color: var(--text-soft); background: var(--bg-soft); font-size: 11px; }.editor-error { margin: 8px 0; }.editor-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }.empty-action { margin-top: 20px; }.spin { animation: spin 1s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 860px) { .settings-layout { grid-template-columns: 1fr; } }
</style>
