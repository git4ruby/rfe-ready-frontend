import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useFeaturesStore = defineStore('features', () => {
  const flags = ref({})
  const loaded = ref(false)

  async function fetchFlags() {
    try {
      const response = await apiClient.get('/feature_flags')
      flags.value = response.data.data || {}
      loaded.value = true
    } catch {
      // Silently fail — features default to disabled
    }
  }

  function isEnabled(name) {
    return !!flags.value[name]
  }

  function reset() {
    flags.value = {}
    loaded.value = false
  }

  return { flags, loaded, fetchFlags, isEnabled, reset }
})
