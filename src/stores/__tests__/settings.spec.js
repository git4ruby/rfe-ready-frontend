import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settings'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('settings store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSettingsStore()
  })

  describe('initial state', () => {
    it('has null tenant and loading false', () => {
      expect(store.tenant).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchTenant()', () => {
    it('fetches tenant and sets state', async () => {
      const mockTenant = { id: '1', name: 'Acme Law', plan: 'professional' }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockTenant } })

      const result = await store.fetchTenant()

      expect(apiClient.get).toHaveBeenCalledWith('/tenant')
      expect(store.tenant).toEqual(mockTenant)
      expect(result).toEqual(mockTenant)
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchTenant()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: { id: '1' } } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))
      await store.fetchTenant().catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('updateTenant()', () => {
    it('patches tenant data and updates state', async () => {
      store.tenant = { id: '1', name: 'Old Name', plan: 'basic' }
      const updated = { id: '1', name: 'New Name', plan: 'basic' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateTenant({ name: 'New Name' })

      expect(apiClient.patch).toHaveBeenCalledWith('/tenant', { tenant: { name: 'New Name' } })
      expect(store.tenant).toEqual(updated)
      expect(result).toEqual(updated)
    })

    it('propagates errors', async () => {
      apiClient.patch.mockRejectedValueOnce(new Error('Validation failed'))

      await expect(store.updateTenant({ name: '' })).rejects.toThrow('Validation failed')
    })
  })
})
