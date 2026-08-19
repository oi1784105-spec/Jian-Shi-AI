import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAiProviderStatus } from '../api/aiProvider'

export const useAiProviderStore = defineStore('aiProvider', () => {
  const configured = ref(false)
  const activeProvider = ref(null)
  const loading = ref(false)

  async function refresh() {
    loading.value = true
    try {
      const data = await getAiProviderStatus()
      configured.value = Boolean(data?.configured)
      activeProvider.value = data?.active_provider || null
    } finally {
      loading.value = false
    }
  }

  function setStatus(data) {
    configured.value = Boolean(data?.configured)
    activeProvider.value = data?.active_provider || null
  }

  return { configured, activeProvider, loading, refresh, setStatus }
})
