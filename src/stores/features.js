import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useFeaturesStore = defineStore('features', () => {
  const flags = ref({})
  const loaded = ref(false)
  const managedFlags = ref([])
  const managedLoading = ref(false)

  async function fetchFlags() {
    try {
      const response = await apiClient.get('/feature_flags')
      flags.value = response.data.data || {}
      loaded.value = true
    } catch {
      // Silently fail — features default to disabled
    }
  }

  async function fetchManagedFlags() {
    managedLoading.value = true
    try {
      const response = await apiClient.get('/feature_flags/manage')
      managedFlags.value = response.data.data || []
    } finally {
      managedLoading.value = false
    }
  }

  async function createFlag(data) {
    const response = await apiClient.post('/feature_flags', { feature_flag: data })
    managedFlags.value.push(response.data.data)
    return response.data.data
  }

  async function updateFlag(id, data) {
    const response = await apiClient.patch(`/feature_flags/${id}`, { feature_flag: data })
    const idx = managedFlags.value.findIndex((f) => f.id === id)
    if (idx !== -1) managedFlags.value[idx] = response.data.data
    return response.data.data
  }

  async function deleteFlag(id) {
    await apiClient.delete(`/feature_flags/${id}`)
    managedFlags.value = managedFlags.value.filter((f) => f.id !== id)
  }

  function isEnabled(name) {
    return !!flags.value[name]
  }

  function reset() {
    flags.value = {}
    loaded.value = false
    managedFlags.value = []
  }

  return {
    flags,
    loaded,
    managedFlags,
    managedLoading,
    fetchFlags,
    fetchManagedFlags,
    createFlag,
    updateFlag,
    deleteFlag,
    isEnabled,
    reset,
  }
})
