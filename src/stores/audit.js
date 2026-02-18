import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useAuditStore = defineStore('audit', () => {
  const logs = ref([])
  const pagination = ref(null)
  const loading = ref(false)

  async function fetchLogs({ page = 1, action_type = null, auditable_type = null, user_id = null } = {}) {
    loading.value = true
    try {
      const params = { page }
      if (action_type) params.action_type = action_type
      if (auditable_type) params.auditable_type = auditable_type
      if (user_id) params.user_id = user_id

      const response = await apiClient.get('/audit_logs', { params })
      logs.value = response.data.data
      pagination.value = response.data.meta
      return response.data
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    pagination,
    loading,
    fetchLogs,
  }
})
