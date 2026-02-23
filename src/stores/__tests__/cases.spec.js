import { setActivePinia, createPinia } from 'pinia'
import { useCasesStore } from '../cases'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('cases store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCasesStore()
  })

  afterEach(() => {
    store.stopPolling()
  })

  describe('fetchCases()', () => {
    it('fetches cases and sets state', async () => {
      const mockCases = [{ id: '1', case_number: 'RFE-001' }]
      const mockMeta = { current_page: 1, total_pages: 3 }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockCases, meta: mockMeta } })

      await store.fetchCases(1)

      expect(apiClient.get).toHaveBeenCalledWith('/cases', { params: { page: 1 } })
      expect(store.cases).toEqual(mockCases)
      expect(store.pagination).toEqual(mockMeta)
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchCases()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: [], meta: {} } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network'))
      await store.fetchCases().catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('createCase()', () => {
    it('posts case data and returns the created case', async () => {
      const newCase = { id: '5', case_number: 'RFE-005' }
      apiClient.post.mockResolvedValueOnce({ data: { data: newCase } })

      const result = await store.createCase({ petitioner_name: 'Acme' })

      expect(apiClient.post).toHaveBeenCalledWith('/cases', { rfe_case: { petitioner_name: 'Acme' } })
      expect(result).toEqual(newCase)
    })
  })

  describe('updateCase()', () => {
    it('patches case data and updates currentCase', async () => {
      const updated = { id: '5', case_number: 'RFE-005', status: 'review' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateCase('5', { status: 'review' })

      expect(apiClient.patch).toHaveBeenCalledWith('/cases/5', { rfe_case: { status: 'review' } })
      expect(store.currentCase).toEqual(updated)
      expect(result).toEqual(updated)
    })
  })

  describe('deleteCase()', () => {
    it('deletes case and removes from list', async () => {
      store.cases = [
        { id: '1', case_number: 'RFE-001' },
        { id: '2', case_number: 'RFE-002' },
      ]
      apiClient.delete.mockResolvedValueOnce({})

      await store.deleteCase('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/cases/1')
      expect(store.cases).toHaveLength(1)
      expect(store.cases[0].id).toBe('2')
    })
  })

  describe('startAnalysis()', () => {
    it('posts to start_analysis and updates currentCase', async () => {
      const updated = { id: '3', status: 'analyzing' }
      apiClient.post.mockResolvedValueOnce({ data: { data: updated } })

      await store.startAnalysis('3')

      expect(apiClient.post).toHaveBeenCalledWith('/cases/3/start_analysis')
      expect(store.currentCase).toEqual(updated)
    })
  })

  describe('bulkUpdateStatus()', () => {
    it('posts bulk update and returns result', async () => {
      const result = { success: 2, failed: 0 }
      apiClient.post.mockResolvedValueOnce({ data: { data: result } })

      const returned = await store.bulkUpdateStatus(['1', '2'], 'archive')

      expect(apiClient.post).toHaveBeenCalledWith('/cases/bulk_update_status', {
        ids: ['1', '2'],
        action_name: 'archive',
      })
      expect(returned).toEqual(result)
    })
  })

  describe('uploadDocument()', () => {
    it('posts FormData and prepends to documents list', async () => {
      const mockDoc = { id: '10', filename: 'evidence.pdf' }
      apiClient.post.mockResolvedValueOnce({ data: { data: mockDoc } })

      store.documents = [{ id: '1', filename: 'existing.pdf' }]
      const file = new File(['content'], 'evidence.pdf')
      const result = await store.uploadDocument('3', file, 'supporting_evidence')

      expect(apiClient.post).toHaveBeenCalledWith('/cases/3/rfe_documents', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(result).toEqual(mockDoc)
      expect(store.documents[0]).toEqual(mockDoc)
      expect(store.documents).toHaveLength(2)
    })
  })

  describe('polling', () => {
    it('startPolling calls fetchAnalysisStatus at intervals', async () => {
      vi.useFakeTimers()
      apiClient.get.mockResolvedValue({ data: { data: { status: 'analyzing', sections_count: 0 } } })

      store.startPolling('3')
      expect(apiClient.get).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(3000)
      expect(apiClient.get).toHaveBeenCalledWith('/cases/3/analysis_status')
    })

    it('stopPolling clears the interval', async () => {
      vi.useFakeTimers()
      apiClient.get.mockResolvedValue({ data: { data: { status: 'analyzing' } } })

      store.startPolling('3')
      store.stopPolling()

      await vi.advanceTimersByTimeAsync(10000)
      expect(apiClient.get).not.toHaveBeenCalled()
    })
  })
})
