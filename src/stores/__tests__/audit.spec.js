import { setActivePinia, createPinia } from 'pinia'
import { useAuditStore } from '../audit'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('audit store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuditStore()
  })

  describe('initial state', () => {
    it('has empty logs, null pagination, and loading false', () => {
      expect(store.logs).toEqual([])
      expect(store.pagination).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchLogs()', () => {
    it('fetches logs and sets state', async () => {
      const mockLogs = [
        { id: '1', action_type: 'case.created', user_name: 'Alice' },
        { id: '2', action_type: 'case.updated', user_name: 'Bob' },
      ]
      const mockMeta = { current_page: 1, total_pages: 5 }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockLogs, meta: mockMeta } })

      await store.fetchLogs()

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs', { params: { page: 1 } })
      expect(store.logs).toEqual(mockLogs)
      expect(store.pagination).toEqual(mockMeta)
    })

    it('passes page parameter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })

      await store.fetchLogs({ page: 3 })

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs', { params: { page: 3 } })
    })

    it('passes action_type filter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })

      await store.fetchLogs({ action_type: 'case.created' })

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs', {
        params: { page: 1, action_type: 'case.created' },
      })
    })

    it('passes auditable_type filter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })

      await store.fetchLogs({ auditable_type: 'RfeCase' })

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs', {
        params: { page: 1, auditable_type: 'RfeCase' },
      })
    })

    it('passes user_id filter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })

      await store.fetchLogs({ user_id: '42' })

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs', {
        params: { page: 1, user_id: '42' },
      })
    })

    it('passes all filters together', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })

      await store.fetchLogs({
        page: 2,
        action_type: 'case.updated',
        auditable_type: 'RfeCase',
        user_id: '7',
      })

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs', {
        params: { page: 2, action_type: 'case.updated', auditable_type: 'RfeCase', user_id: '7' },
      })
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchLogs()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: [], meta: {} } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Server error'))
      await store.fetchLogs().catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('exportLogs()', () => {
    let createElementSpy
    let revokeObjectURLSpy
    let createObjectURLSpy
    let mockAnchor

    beforeEach(() => {
      mockAnchor = { href: '', download: '', click: vi.fn() }
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    })

    afterEach(() => {
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })

    it('exports CSV with correct params and triggers download', async () => {
      apiClient.get.mockResolvedValueOnce({ data: 'csv,data,here' })

      await store.exportLogs({}, 'csv')

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs/export', {
        params: { format_type: 'csv' },
        responseType: 'blob',
      })
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockAnchor.href).toBe('blob:mock-url')
      expect(mockAnchor.download).toMatch(/^audit-log-\d{4}-\d{2}-\d{2}\.csv$/)
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
    })

    it('exports PDF with correct extension', async () => {
      apiClient.get.mockResolvedValueOnce({ data: 'pdf-binary-data' })

      await store.exportLogs({}, 'pdf')

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs/export', {
        params: { format_type: 'pdf' },
        responseType: 'blob',
      })
      expect(mockAnchor.download).toMatch(/^audit-log-\d{4}-\d{2}-\d{2}\.pdf$/)
      expect(mockAnchor.click).toHaveBeenCalled()
    })

    it('passes filters to export', async () => {
      apiClient.get.mockResolvedValueOnce({ data: 'csv,data' })

      await store.exportLogs({ action_type: 'case.created', auditable_type: 'RfeCase' }, 'csv')

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs/export', {
        params: { format_type: 'csv', action_type: 'case.created', auditable_type: 'RfeCase' },
        responseType: 'blob',
      })
    })

    it('defaults format to csv', async () => {
      apiClient.get.mockResolvedValueOnce({ data: 'csv,data' })

      await store.exportLogs()

      expect(apiClient.get).toHaveBeenCalledWith('/audit_logs/export', {
        params: { format_type: 'csv' },
        responseType: 'blob',
      })
      expect(mockAnchor.download).toMatch(/\.csv$/)
    })
  })
})
