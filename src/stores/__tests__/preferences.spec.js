import { setActivePinia, createPinia } from 'pinia'
import { usePreferencesStore } from '../preferences'
import { useAuthStore } from '../auth'

vi.mock('../../api/profile')
import profileApi from '../../api/profile'

// Mock the api/client module so auth store doesn't hit real axios
vi.mock('../../api/client')

describe('preferences store', () => {
  let store
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    store = usePreferencesStore()
  })

  describe('computed getters', () => {
    it('returns default timezone from Intl when user has no preferences', () => {
      authStore.user = {}
      const expected = Intl.DateTimeFormat().resolvedOptions().timeZone
      expect(store.timezone).toBe(expected)
    })

    it('returns user timezone when set', () => {
      authStore.user = { preferences: { timezone: 'America/New_York' } }
      expect(store.timezone).toBe('America/New_York')
    })

    it('returns default dashboardLayout as expanded', () => {
      authStore.user = {}
      expect(store.dashboardLayout).toBe('expanded')
    })

    it('returns user dashboardLayout when set', () => {
      authStore.user = { preferences: { dashboard_layout: 'compact' } }
      expect(store.dashboardLayout).toBe('compact')
    })

    it('defaults notifyCaseAssigned to true', () => {
      authStore.user = {}
      expect(store.notifyCaseAssigned).toBe(true)
    })

    it('returns false when notifyCaseAssigned explicitly set to false', () => {
      authStore.user = { preferences: { notify_case_assigned: false } }
      expect(store.notifyCaseAssigned).toBe(false)
    })

    it('defaults notifyDeadlineApproaching to true', () => {
      authStore.user = {}
      expect(store.notifyDeadlineApproaching).toBe(true)
    })

    it('returns false when notifyDeadlineApproaching explicitly set to false', () => {
      authStore.user = { preferences: { notify_deadline_approaching: false } }
      expect(store.notifyDeadlineApproaching).toBe(false)
    })

    it('defaults notifyDraftReady to true', () => {
      authStore.user = {}
      expect(store.notifyDraftReady).toBe(true)
    })

    it('returns false when notifyDraftReady explicitly set to false', () => {
      authStore.user = { preferences: { notify_draft_ready: false } }
      expect(store.notifyDraftReady).toBe(false)
    })

    it('returns empty object for prefs when user is null', () => {
      authStore.user = null
      expect(store.prefs).toEqual({})
    })
  })

  describe('updatePreferences()', () => {
    it('calls profileApi.updateProfile and updates auth store', async () => {
      authStore.user = { id: '1', preferences: { timezone: 'UTC' } }
      const updatedPrefs = { timezone: 'America/Chicago', dashboard_layout: 'compact' }
      profileApi.updateProfile.mockResolvedValueOnce({
        data: { data: { preferences: updatedPrefs } },
      })

      const result = await store.updatePreferences({ timezone: 'America/Chicago' })

      expect(profileApi.updateProfile).toHaveBeenCalledWith({
        preferences: { timezone: 'America/Chicago' },
      })
      expect(result).toBe(true)
      // Auth store should be updated with new preferences
      expect(authStore.user.preferences).toEqual(updatedPrefs)
    })

    it('sets saving true during update and false after', async () => {
      authStore.user = { id: '1', preferences: {} }
      let resolvePromise
      profileApi.updateProfile.mockReturnValueOnce(
        new Promise((resolve) => (resolvePromise = resolve))
      )

      const updatePromise = store.updatePreferences({ timezone: 'UTC' })
      expect(store.saving).toBe(true)

      resolvePromise({ data: { data: { preferences: { timezone: 'UTC' } } } })
      await updatePromise
      expect(store.saving).toBe(false)
    })

    it('sets saving false even on error', async () => {
      authStore.user = { id: '1', preferences: {} }
      profileApi.updateProfile.mockRejectedValueOnce(new Error('Server error'))

      await store.updatePreferences({ timezone: 'UTC' }).catch(() => {})
      expect(store.saving).toBe(false)
    })
  })
})
