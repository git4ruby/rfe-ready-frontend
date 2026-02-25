import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '../search'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('search store', () => {
  let store

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    store = useSearchStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('has empty query, empty results, and loading false', () => {
      expect(store.query).toBe('')
      expect(store.results).toEqual({ cases: [], knowledge_docs: [], users: [] })
      expect(store.loading).toBe(false)
    })
  })

  describe('search()', () => {
    it('clears results and stays not loading for queries shorter than 2 chars', async () => {
      store.search('a')
      expect(store.query).toBe('a')
      expect(store.results).toEqual({ cases: [], knowledge_docs: [], users: [] })
      expect(store.loading).toBe(false)
    })

    it('clears results for empty query', async () => {
      store.search('')
      expect(store.query).toBe('')
      expect(store.results).toEqual({ cases: [], knowledge_docs: [], users: [] })
      expect(store.loading).toBe(false)
    })

    it('sets loading true immediately for valid queries', () => {
      store.search('test query')
      expect(store.loading).toBe(true)
    })

    it('debounces the API call by 300ms', async () => {
      const mockResults = {
        cases: [{ id: '1', case_number: 'RFE-001' }],
        knowledge_docs: [],
        users: [],
      }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockResults } })

      store.search('test query')

      // API should not be called yet
      expect(apiClient.get).not.toHaveBeenCalled()

      // Advance past debounce
      await vi.advanceTimersByTimeAsync(300)

      expect(apiClient.get).toHaveBeenCalledWith('/search', { params: { q: 'test query' } })
      expect(store.results).toEqual(mockResults)
      expect(store.loading).toBe(false)
    })

    it('cancels previous debounce when search is called again', async () => {
      const mockResults = {
        cases: [{ id: '2' }],
        knowledge_docs: [],
        users: [],
      }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockResults } })

      store.search('first')
      // Before the debounce fires, search again
      await vi.advanceTimersByTimeAsync(100)
      store.search('second')

      await vi.advanceTimersByTimeAsync(300)

      // Only the second search should have gone through
      expect(apiClient.get).toHaveBeenCalledTimes(1)
      expect(apiClient.get).toHaveBeenCalledWith('/search', { params: { q: 'second' } })
    })

    it('clears results on API error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Server error'))

      store.search('fail test')
      await vi.advanceTimersByTimeAsync(300)

      expect(store.results).toEqual({ cases: [], knowledge_docs: [], users: [] })
      expect(store.loading).toBe(false)
    })

    it('sets loading false after successful response', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { data: { cases: [], knowledge_docs: [], users: [] } },
      })

      store.search('test')
      expect(store.loading).toBe(true)

      await vi.advanceTimersByTimeAsync(300)

      expect(store.loading).toBe(false)
    })
  })

  describe('clear()', () => {
    it('resets query, results, and loading', () => {
      store.search('something')
      store.clear()

      expect(store.query).toBe('')
      expect(store.results).toEqual({ cases: [], knowledge_docs: [], users: [] })
      expect(store.loading).toBe(false)
    })
  })
})
