<template>
  <div class="preference-controls">
    <button class="icon-button" type="button" :title="t('common.theme')" :aria-label="t('common.theme')" @click="preferences.toggleTheme()">
      <Sun v-if="preferences.theme === 'dark'" :size="18" /><Moon v-else :size="18" />
    </button>
    <button class="language-button" type="button" :title="t('common.language')" :aria-label="t('common.language')" @click="toggleLocale">
      <Languages :size="17" /><span>{{ preferences.locale === 'zh' ? 'EN' : '中' }}</span>
    </button>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { Moon, Sun, Languages } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { usePreferencesStore } from '../stores/preferences'
const preferences = usePreferencesStore()
const { t, locale } = useI18n()
watch(() => preferences.locale, value => { locale.value = value }, { immediate: true })
function toggleLocale() { preferences.toggleLocale() }
</script>
