import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useWebhooksStore = defineStore('webhooks', () => {
  const webhooks = ref([])
  const loading = ref(false)

  async function fetchWebhooks() {
    loading.value = true
    try {
      const response = await apiClient.get('/webhooks')
      webhooks.value = response.data.data
    } finally {
      loading.value = false
    }
  }

  async function createWebhook(data) {
    const response = await apiClient.post('/webhooks', { webhook: data })
    webhooks.value.unshift(response.data.data)
    return response.data.data
  }

  async function updateWebhook(id, data) {
    const response = await apiClient.patch(`/webhooks/${id}`, { webhook: data })
    const idx = webhooks.value.findIndex(w => w.id === id)
    if (idx !== -1) webhooks.value[idx] = response.data.data
    return response.data.data
  }

  async function deleteWebhook(id) {
    await apiClient.delete(`/webhooks/${id}`)
    webhooks.value = webhooks.value.filter(w => w.id !== id)
  }

  async function testWebhook(id) {
    const response = await apiClient.post(`/webhooks/${id}/test_delivery`)
    return response.data.data
  }

  function $reset() {
    webhooks.value = []
    loading.value = false
  }

  return { webhooks, loading, fetchWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook, $reset }
})
