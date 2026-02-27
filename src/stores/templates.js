import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref([])
  const currentTemplate = ref(null)
  const loading = ref(false)

  async function fetchTemplates() {
    loading.value = true
    try {
      const response = await apiClient.get('/case_templates')
      templates.value = response.data.data
    } finally {
      loading.value = false
    }
  }

  async function fetchTemplate(id) {
    loading.value = true
    try {
      const response = await apiClient.get(`/case_templates/${id}`)
      currentTemplate.value = response.data.data
      return response.data.data
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(data) {
    const response = await apiClient.post('/case_templates', { case_template: data })
    const created = response.data.data
    templates.value.unshift(created)
    return created
  }

  async function updateTemplate(id, data) {
    const response = await apiClient.patch(`/case_templates/${id}`, { case_template: data })
    const updated = response.data.data
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) templates.value[index] = updated
    return updated
  }

  async function deleteTemplate(id) {
    await apiClient.delete(`/case_templates/${id}`)
    templates.value = templates.value.filter(t => t.id !== id)
  }

  function $reset() {
    templates.value = []
    currentTemplate.value = null
    loading.value = false
  }

  return { templates, currentTemplate, loading, fetchTemplates, fetchTemplate, createTemplate, updateTemplate, deleteTemplate, $reset }
})
