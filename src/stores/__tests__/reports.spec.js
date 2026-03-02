import { setActivePinia, createPinia } from 'pinia'
import { useReportsStore } from '../reports'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('reports store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useReportsStore()
  })

  describe('initial state', () => {
    it('has null reportData and loading false', () => {
      expect(store.reportData).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchDashboard()', () => {
    it('fetches dashboard data with default period and sets state', async () => {
      const mockData = { total_cases: 42, open_cases: 10, avg_response_days: 5.3 }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockData } })

      await store.fetchDashboard()

      expect(apiClient.get).toHaveBeenCalledWith('/reports/dashboard', { params: { period: '30d' } })
      expect(store.reportData).toEqual(mockData)
    })

    it('passes custom period parameter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: {} } })

      await store.fetchDashboard('7d')

      expect(apiClient.get).toHaveBeenCalledWith('/reports/dashboard', { params: { period: '7d' } })
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchDashboard()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: { total_cases: 1 } } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))
      await store.fetchDashboard().catch(() => {})
      expect(store.loading).toBe(false)
    })

    it('propagates errors', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Server error'))

      await expect(store.fetchDashboard()).rejects.toThrow('Server error')
    })
  })

  describe('$reset()', () => {
    it('resets state to initial values', async () => {
      const mockData = { total_cases: 42 }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockData } })
      await store.fetchDashboard()

      expect(store.reportData).toEqual(mockData)

      store.$reset()

      expect(store.reportData).toBeNull()
      expect(store.loading).toBe(false)
    })
  })
})
