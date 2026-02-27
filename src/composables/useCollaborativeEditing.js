import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiClient from '../api/client'

export function useCollaborativeEditing(draftResponseId) {
  const auth = useAuthStore()
  const activeUsers = ref([])
  const isLocked = ref(false)
  const lockedBy = ref(null)
  const lockLoading = ref(false)

  async function acquireLock(caseId) {
    lockLoading.value = true
    try {
      await apiClient.post(`/cases/${caseId}/draft_responses/${draftResponseId}/lock`)
      isLocked.value = true
      lockedBy.value = auth.user
      return true
    } catch (err) {
      if (err.response?.status === 409) {
        lockedBy.value = err.response.data.locked_by
        return false
      }
      throw err
    } finally {
      lockLoading.value = false
    }
  }

  async function releaseLock(caseId) {
    try {
      await apiClient.post(`/cases/${caseId}/draft_responses/${draftResponseId}/unlock`)
      isLocked.value = false
      lockedBy.value = null
    } catch {
      // Silently fail
    }
  }

  function $reset() {
    activeUsers.value = []
    isLocked.value = false
    lockedBy.value = null
    lockLoading.value = false
  }

  return { activeUsers, isLocked, lockedBy, lockLoading, acquireLock, releaseLock, $reset }
}
