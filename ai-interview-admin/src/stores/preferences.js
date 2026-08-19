import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
function systemTheme() { return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }
export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref(localStorage.getItem('jianshi-theme') || systemTheme()); const locale = ref(localStorage.getItem('jianshi-locale') || (navigator.language.startsWith('zh') ? 'zh' : 'en'))
  watch(theme, value => { document.documentElement.dataset.theme = value; document.documentElement.style.colorScheme = value; localStorage.setItem('jianshi-theme', value) }, { immediate: true }); watch(locale, value => localStorage.setItem('jianshi-locale', value), { immediate: true })
  function toggleTheme() { theme.value = theme.value === 'light' ? 'dark' : 'light' }; function toggleLocale() { locale.value = locale.value === 'zh' ? 'en' : 'zh' }
  return { theme, locale, toggleTheme, toggleLocale }
})
