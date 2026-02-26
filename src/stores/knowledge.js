import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const docs = ref([])
  const currentDoc = ref(null)
  const loading = ref(false)
  const pagination = ref({})
  const stats = ref(null)
  const uploadProgress = ref(0)
  const searchResults = ref([])
  const searchLoading = ref(false)
  const searchQuery = ref('')

  function onUploadProgress(e) {
    uploadProgress.value = Math.round((e.loaded * 100) / (e.total || 1))
  }

  async function fetchDocs(filters = {}, page = 1) {
    loading.value = true
    try {
      const params = { page }
      if (filters.q) params.q = filters.q
      if (filters.doc_type) params.doc_type = filters.doc_type
      if (filters.visa_type) params.visa_type = filters.visa_type
      if (filters.rfe_category) params.rfe_category = filters.rfe_category
      if (filters.active_only) params.active_only = true

      const response = await apiClient.get('/knowledge_docs', { params })
      docs.value = response.data.data
      pagination.value = response.data.meta
      if (response.data.meta?.stats) stats.value = response.data.meta.stats
    } finally {
      loading.value = false
    }
  }

  async function fetchDoc(id) {
    loading.value = true
    try {
      const response = await apiClient.get(`/knowledge_docs/${id}`)
      currentDoc.value = response.data.data
      return response.data.data
    } finally {
      loading.value = false
    }
  }

  async function createDoc(formData) {
    uploadProgress.value = 0
    const response = await apiClient.post('/knowledge_docs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    docs.value.unshift(response.data.data)
    return response.data.data
  }

  async function updateDoc(id, data) {
    const isFormData = data instanceof FormData
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    const response = await apiClient.patch(`/knowledge_docs/${id}`, data, config)
    const idx = docs.value.findIndex((d) => d.id === id)
    if (idx !== -1) docs.value[idx] = response.data.data
    return response.data.data
  }

  async function bulkCreate(formData) {
    uploadProgress.value = 0
    const response = await apiClient.post('/knowledge_docs/bulk_create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    return response.data
  }

  async function deleteDoc(id) {
    await apiClient.delete(`/knowledge_docs/${id}`)
    docs.value = docs.value.filter((d) => d.id !== id)
  }

  async function semanticSearch(query, { visaType, limit } = {}) {
    searchLoading.value = true
    searchQuery.value = query
    try {
      const params = { q: query }
      if (visaType) params.visa_type = visaType
      if (limit) params.limit = limit
      const response = await apiClient.get('/knowledge/search', { params })
      searchResults.value = response.data.data.results || []
      return response.data.data
    } finally {
      searchLoading.value = false
    }
  }

  function clearSearch() {
    searchResults.value = []
    searchQuery.value = ''
  }

  return {
    docs,
    currentDoc,
    loading,
    pagination,
    stats,
    uploadProgress,
    searchResults,
    searchLoading,
    searchQuery,
    fetchDocs,
    fetchDoc,
    createDoc,
    updateDoc,
    bulkCreate,
    deleteDoc,
    semanticSearch,
    clearSearch,
  }
})
