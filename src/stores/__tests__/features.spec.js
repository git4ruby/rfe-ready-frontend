import { setActivePinia, createPinia } from 'pinia'
import { useFeaturesStore } from '../features'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('features store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useFeaturesStore()
  })

  describe('initial state', () => {
    it('has empty flags and loaded false', () => {
      expect(store.flags).toEqual({})
      expect(store.loaded).toBe(false)
    })
  })

  describe('fetchFlags()', () => {
    it('fetches feature flags and sets state', async () => {
      const mockFlags = { ai_analysis: true, bulk_export: false, advanced_search: true }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockFlags } })

      await store.fetchFlags()

      expect(apiClient.get).toHaveBeenCalledWith('/feature_flags')
      expect(store.flags).toEqual(mockFlags)
      expect(store.loaded).toBe(true)
    })

    it('defaults to empty object when response data is null', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: null } })

      await store.fetchFlags()

      expect(store.flags).toEqual({})
      expect(store.loaded).toBe(true)
    })

    it('silently fails on error without throwing', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))

      // Should not throw
      await store.fetchFlags()

      expect(store.flags).toEqual({})
      expect(store.loaded).toBe(false)
    })

    it('does not change loaded on error', async () => {
      // First load successfully
      apiClient.get.mockResolvedValueOnce({ data: { data: { feature_a: true } } })
      await store.fetchFlags()
      expect(store.loaded).toBe(true)

      // Now fail - loaded should remain true (flags may be stale)
      apiClient.get.mockRejectedValueOnce(new Error('fail'))
      await store.fetchFlags()
      expect(store.loaded).toBe(true)
      // flags unchanged from last successful fetch
      expect(store.flags).toEqual({ feature_a: true })
    })
  })

  describe('isEnabled()', () => {
    it('returns true for enabled flags', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { data: { ai_analysis: true, bulk_export: false } },
      })
      await store.fetchFlags()

      expect(store.isEnabled('ai_analysis')).toBe(true)
    })

    it('returns false for disabled flags', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { data: { ai_analysis: true, bulk_export: false } },
      })
      await store.fetchFlags()

      expect(store.isEnabled('bulk_export')).toBe(false)
    })

    it('returns false for unknown flags', () => {
      expect(store.isEnabled('nonexistent_flag')).toBe(false)
    })

    it('returns false when flags are empty', () => {
      expect(store.isEnabled('anything')).toBe(false)
    })
  })

  describe('reset()', () => {
    it('clears flags and sets loaded to false', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: { feature_a: true } } })
      await store.fetchFlags()

      expect(store.flags).toEqual({ feature_a: true })
      expect(store.loaded).toBe(true)

      store.reset()

      expect(store.flags).toEqual({})
      expect(store.loaded).toBe(false)
    })
  })
})
