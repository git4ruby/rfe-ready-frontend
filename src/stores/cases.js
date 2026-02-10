import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useCasesStore = defineStore('cases', () => {
  const cases = ref([])
  const currentCase = ref(null)
  const rfeSections = ref([])
  const checklists = ref([])
  const drafts = ref([])
  const exhibits = ref([])
  const loading = ref(false)
  const pagination = ref({})

  async function fetchCases(page = 1) {
    loading.value = true
    try {
      const response = await apiClient.get('/cases', { params: { page } })
      cases.value = response.data.data
      pagination.value = response.data.meta
    } finally {
      loading.value = false
    }
  }

  async function fetchCase(id) {
    loading.value = true
    try {
      const response = await apiClient.get(`/cases/${id}`)
      currentCase.value = response.data.data
    } finally {
      loading.value = false
    }
  }

  async function createCase(caseData) {
    const response = await apiClient.post('/cases', { rfe_case: caseData })
    return response.data.data
  }

  async function updateCase(id, caseData) {
    const response = await apiClient.patch(`/cases/${id}`, { rfe_case: caseData })
    currentCase.value = response.data.data
    return response.data.data
  }

  async function deleteCase(id) {
    await apiClient.delete(`/cases/${id}`)
    cases.value = cases.value.filter((c) => c.id !== id)
  }

  async function startAnalysis(id) {
    const response = await apiClient.post(`/cases/${id}/start_analysis`)
    currentCase.value = response.data.data
  }

  async function assignAttorney(id, attorneyId) {
    const response = await apiClient.patch(`/cases/${id}/assign_attorney`, {
      attorney_id: attorneyId,
    })
    currentCase.value = response.data.data
  }

  async function markReviewed(id) {
    const response = await apiClient.patch(`/cases/${id}/mark_reviewed`)
    currentCase.value = response.data.data
  }

  async function markResponded(id) {
    const response = await apiClient.patch(`/cases/${id}/mark_responded`)
    currentCase.value = response.data.data
  }

  async function archiveCase(id) {
    const response = await apiClient.post(`/cases/${id}/archive`)
    currentCase.value = response.data.data
  }

  async function reopenCase(id) {
    const response = await apiClient.post(`/cases/${id}/reopen`)
    currentCase.value = response.data.data
  }

  async function exportCase(id, format = 'docx') {
    const response = await apiClient.post(`/cases/${id}/export`, { format })
    return response.data
  }

  // Nested resources
  async function fetchRfeSections(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/rfe_sections`)
    rfeSections.value = response.data.data
  }

  async function fetchChecklists(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/evidence_checklists`)
    checklists.value = response.data.data
  }

  async function toggleChecklist(caseId, checklistId) {
    const response = await apiClient.patch(
      `/cases/${caseId}/evidence_checklists/${checklistId}/toggle_collected`
    )
    const idx = checklists.value.findIndex((c) => c.id === checklistId)
    if (idx !== -1) checklists.value[idx] = response.data.data
  }

  async function fetchDrafts(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/draft_responses`)
    drafts.value = response.data.data
  }

  async function updateDraft(caseId, draftId, content) {
    const response = await apiClient.patch(
      `/cases/${caseId}/draft_responses/${draftId}`,
      { draft_response: { edited_content: content } }
    )
    const idx = drafts.value.findIndex((d) => d.id === draftId)
    if (idx !== -1) drafts.value[idx] = response.data.data
  }

  async function fetchExhibits(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/exhibits`)
    exhibits.value = response.data.data
  }

  return {
    cases,
    currentCase,
    rfeSections,
    checklists,
    drafts,
    exhibits,
    loading,
    pagination,
    fetchCases,
    fetchCase,
    createCase,
    updateCase,
    deleteCase,
    startAnalysis,
    assignAttorney,
    markReviewed,
    markResponded,
    archiveCase,
    reopenCase,
    exportCase,
    fetchRfeSections,
    fetchChecklists,
    toggleChecklist,
    fetchDrafts,
    updateDraft,
    fetchExhibits,
  }
})
