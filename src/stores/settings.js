import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useSettingsStore = defineStore('settings', () => {
  const tenant = ref(null)
  const loading = ref(false)

  async function fetchTenant() {
    loading.value = true
    try {
      const response = await apiClient.get('/tenant')
      tenant.value = response.data.data
      return response.data.data
    } finally {
      loading.value = false
    }
  }

  async function updateTenant(data) {
    const response = await apiClient.patch('/tenant', { tenant: data })
    tenant.value = response.data.data
    return response.data.data
  }

  return {
    tenant,
    loading,
    fetchTenant,
    updateTenant,
  }
})
