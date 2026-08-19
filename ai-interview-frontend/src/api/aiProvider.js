import api from './request'

export const getAiProviderPresets = () => api.get('/ai-providers/presets')
export const getAiProviderStatus = () => api.get('/ai-providers/status')
export const listAiProviders = () => api.get('/ai-providers')
export const createAiProvider = data => api.post('/ai-providers', data)
export const updateAiProvider = (id, data) => api.put(`/ai-providers/${id}`, data)
export const deleteAiProvider = id => api.delete(`/ai-providers/${id}`)
export const testAiProvider = id => api.post(`/ai-providers/${id}/test`)
export const activateAiProvider = id => api.post(`/ai-providers/${id}/activate`)
export const discoverAiProviderModels = data => api.post('/ai-providers/discover-models', data)
export const refreshAiProviderModels = id => api.get(`/ai-providers/${id}/models`)
