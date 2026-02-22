import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import profileApi from '../api/profile'

export const usePreferencesStore = defineStore('preferences', () => {
  const authStore = useAuthStore()

  const prefs = computed(() => authStore.user?.preferences || {})

  const timezone = computed(() => prefs.value.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const dashboardLayout = computed(() => prefs.value.dashboard_layout || 'expanded')
  const notifyCaseAssigned = computed(() => prefs.value.notify_case_assigned !== false)
  const notifyDeadlineApproaching = computed(() => prefs.value.notify_deadline_approaching !== false)
  const notifyDraftReady = computed(() => prefs.value.notify_draft_ready !== false)

  const saving = ref(false)

  async function updatePreferences(partial) {
    saving.value = true
    try {
      const response = await profileApi.updateProfile({ preferences: partial })
      const userData = response.data.data
      authStore.updateUser({ preferences: userData.preferences })
      return true
    } finally {
      saving.value = false
    }
  }

  return {
    prefs,
    timezone,
    dashboardLayout,
    notifyCaseAssigned,
    notifyDeadlineApproaching,
    notifyDraftReady,
    saving,
    updatePreferences,
  }
})
