import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useSlackStore = defineStore('slack', () => {
  const integrations = ref([])
  const loading = ref(false)

  async function fetchIntegrations() {
    loading.value = true
    try {
      const response = await apiClient.get('/slack_integrations')
      integrations.value = response.data.data
    } finally {
      loading.value = false
    }
  }

  async function createIntegration(data) {
    const response = await apiClient.post('/slack_integrations', { slack_integration: data })
    integrations.value.unshift(response.data.data)
    return response.data.data
  }

  async function updateIntegration(id, data) {
    const response = await apiClient.patch(`/slack_integrations/${id}`, { slack_integration: data })
    const idx = integrations.value.findIndex(i => i.id === id)
    if (idx !== -1) integrations.value[idx] = response.data.data
    return response.data.data
  }

  async function deleteIntegration(id) {
    await apiClient.delete(`/slack_integrations/${id}`)
    integrations.value = integrations.value.filter(i => i.id !== id)
  }

  async function testIntegration(id) {
    const response = await apiClient.post(`/slack_integrations/${id}/test_notification`)
    return response.data.data
  }

  function $reset() {
    integrations.value = []
    loading.value = false
  }

  return { integrations, loading, fetchIntegrations, createIntegration, updateIntegration, deleteIntegration, testIntegration, $reset }
})
