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

  async function bulkUpdateStatus(ids, actionName) {
    const response = await apiClient.post('/cases/bulk_update_status', { ids, action_name: actionName })
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

  // Activity timeline
  const activityLogs = ref([])

  async function fetchActivity(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/activity`)
    activityLogs.value = response.data.data
  }

  const exporting = ref(false)
  const exportProgress = ref(null) // null | 'preparing' | 'generating' | 'downloading'

  async function exportCase(id, format = 'pdf') {
    exporting.value = true
    exportProgress.value = 'preparing'
    try {
      exportProgress.value = 'generating'
      const response = await apiClient.post(
        `/cases/${id}/export`,
        { format_type: format },
        { responseType: 'blob' }
      )

      exportProgress.value = 'downloading'

      // Extract filename from Content-Disposition header or generate one
      const disposition = response.headers['content-disposition']
      let filename = `RFE_Response.${format}`
      if (disposition) {
        const match = disposition.match(/filename="?([^";\n]+)"?/)
        if (match) filename = match[1]
      }

      // Create blob download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Refresh case to get updated exported_at
      await fetchCase(id)
    } finally {
      exporting.value = false
      exportProgress.value = null
    }
  }

  // Documents
  const documents = ref([])

  async function fetchDocuments(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/rfe_documents`)
    documents.value = response.data.data
  }

  async function uploadDocument(caseId, file, documentType = 'supporting_evidence') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    const response = await apiClient.post(`/cases/${caseId}/rfe_documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    documents.value.unshift(response.data.data)
    return response.data.data
  }

  async function deleteDocument(caseId, documentId) {
    await apiClient.delete(`/cases/${caseId}/rfe_documents/${documentId}`)
    documents.value = documents.value.filter((d) => d.id !== documentId)
  }

  // Analysis polling
  const analysisStatus = ref(null)
  let pollTimer = null

  async function fetchAnalysisStatus(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/analysis_status`)
    analysisStatus.value = response.data.data
    return response.data.data
  }

  function startPolling(caseId) {
    stopPolling()
    pollTimer = setInterval(async () => {
      try {
        const status = await fetchAnalysisStatus(caseId)
        if (status.status !== 'analyzing') {
          stopPolling()
          // Refresh case data and sections
          await fetchCase(caseId)
          if (status.status === 'review' || status.sections_count > 0) {
            await fetchRfeSections(caseId)
          }
        }
      } catch {
        stopPolling()
      }
    }, 3000)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
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

  async function generateAllDrafts(caseId) {
    const response = await apiClient.post(`/cases/${caseId}/draft_responses/generate_all`)
    return response.data.data
  }

  async function updateDraft(caseId, draftId, content) {
    const response = await apiClient.patch(
      `/cases/${caseId}/draft_responses/${draftId}`,
      { draft_response: { edited_content: content } }
    )
    const idx = drafts.value.findIndex((d) => d.id === draftId)
    if (idx !== -1) drafts.value[idx] = response.data.data
  }

  async function approveDraft(caseId, draftId, feedback) {
    const response = await apiClient.patch(
      `/cases/${caseId}/draft_responses/${draftId}/approve`,
      { attorney_feedback: feedback }
    )
    const idx = drafts.value.findIndex((d) => d.id === draftId)
    if (idx !== -1) drafts.value[idx] = response.data.data
  }

  async function regenerateDraft(caseId, draftId) {
    const response = await apiClient.post(
      `/cases/${caseId}/draft_responses/${draftId}/regenerate`
    )
    return response.data.data
  }

  async function fetchExhibits(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/exhibits`)
    exhibits.value = response.data.data
  }

  async function createExhibit(caseId, exhibitData) {
    const response = await apiClient.post(`/cases/${caseId}/exhibits`, { exhibit: exhibitData })
    exhibits.value.push(response.data.data)
    return response.data.data
  }

  async function updateExhibit(caseId, exhibitId, exhibitData) {
    const response = await apiClient.patch(`/cases/${caseId}/exhibits/${exhibitId}`, { exhibit: exhibitData })
    const idx = exhibits.value.findIndex((e) => e.id === exhibitId)
    if (idx !== -1) exhibits.value[idx] = response.data.data
  }

  async function deleteExhibit(caseId, exhibitId) {
    await apiClient.delete(`/cases/${caseId}/exhibits/${exhibitId}`)
    exhibits.value = exhibits.value.filter((e) => e.id !== exhibitId)
  }

  async function reorderExhibits(caseId, ids) {
    const response = await apiClient.patch(`/cases/${caseId}/exhibits/reorder`, { ids })
    exhibits.value = response.data.data
  }

  return {
    cases,
    currentCase,
    documents,
    rfeSections,
    checklists,
    drafts,
    exhibits,
    loading,
    exporting,
    exportProgress,
    activityLogs,
    fetchActivity,
    pagination,
    analysisStatus,
    fetchCases,
    fetchCase,
    createCase,
    updateCase,
    bulkUpdateStatus,
    deleteCase,
    startAnalysis,
    assignAttorney,
    markReviewed,
    markResponded,
    archiveCase,
    reopenCase,
    exportCase,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    fetchAnalysisStatus,
    startPolling,
    stopPolling,
    fetchRfeSections,
    fetchChecklists,
    toggleChecklist,
    fetchDrafts,
    generateAllDrafts,
    updateDraft,
    approveDraft,
    regenerateDraft,
    fetchExhibits,
    createExhibit,
    updateExhibit,
    deleteExhibit,
    reorderExhibits,
  }
})
