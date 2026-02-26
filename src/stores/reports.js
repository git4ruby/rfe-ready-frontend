import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useReportsStore = defineStore('reports', () => {
  const reportData = ref(null)
  const loading = ref(false)

  async function fetchDashboard(period = '30d') {
    loading.value = true
    try {
      const response = await apiClient.get('/reports/dashboard', { params: { period } })
      reportData.value = response.data.data
    } finally {
      loading.value = false
    }
  }

  function $reset() {
    reportData.value = null
    loading.value = false
  }

  return {
    reportData,
    loading,
    fetchDashboard,
    $reset,
  }
})
