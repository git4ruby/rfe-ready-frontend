import { setActivePinia, createPinia } from 'pinia'
import { useWebhooksStore } from '../webhooks'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('webhooks store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useWebhooksStore()
  })

  describe('initial state', () => {
    it('has empty webhooks and loading false', () => {
      expect(store.webhooks).toEqual([])
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchWebhooks()', () => {
    it('fetches webhooks and sets state', async () => {
      const mockWebhooks = [
        { id: '1', url: 'https://example.com/hook1', active: true },
        { id: '2', url: 'https://example.com/hook2', active: false },
      ]
      apiClient.get.mockResolvedValueOnce({ data: { data: mockWebhooks } })

      await store.fetchWebhooks()

      expect(apiClient.get).toHaveBeenCalledWith('/webhooks')
      expect(store.webhooks).toEqual(mockWebhooks)
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchWebhooks()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: [] } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))
      await store.fetchWebhooks().catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('createWebhook()', () => {
    it('creates webhook and prepends to list', async () => {
      store.webhooks = [{ id: '1', url: 'https://example.com/existing' }]
      const newWebhook = { id: '2', url: 'https://example.com/new', active: true }
      apiClient.post.mockResolvedValueOnce({ data: { data: newWebhook } })

      const result = await store.createWebhook({ url: 'https://example.com/new' })

      expect(apiClient.post).toHaveBeenCalledWith('/webhooks', {
        webhook: { url: 'https://example.com/new' },
      })
      expect(result).toEqual(newWebhook)
      expect(store.webhooks[0]).toEqual(newWebhook)
      expect(store.webhooks).toHaveLength(2)
    })

    it('propagates errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Validation failed'))

      await expect(store.createWebhook({ url: '' })).rejects.toThrow('Validation failed')
    })
  })

  describe('updateWebhook()', () => {
    it('updates webhook in list', async () => {
      store.webhooks = [
        { id: '1', url: 'https://example.com/old', active: true },
        { id: '2', url: 'https://example.com/other', active: false },
      ]
      const updated = { id: '1', url: 'https://example.com/updated', active: true }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateWebhook('1', { url: 'https://example.com/updated' })

      expect(apiClient.patch).toHaveBeenCalledWith('/webhooks/1', {
        webhook: { url: 'https://example.com/updated' },
      })
      expect(result).toEqual(updated)
      expect(store.webhooks[0]).toEqual(updated)
      expect(store.webhooks[1]).toEqual({ id: '2', url: 'https://example.com/other', active: false })
    })

    it('does not modify list if id not found', async () => {
      store.webhooks = [{ id: '1', url: 'https://example.com/existing' }]
      const updated = { id: '999', url: 'https://example.com/ghost' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      await store.updateWebhook('999', { url: 'https://example.com/ghost' })

      expect(store.webhooks).toEqual([{ id: '1', url: 'https://example.com/existing' }])
    })

    it('propagates errors', async () => {
      apiClient.patch.mockRejectedValueOnce(new Error('Not found'))

      await expect(store.updateWebhook('1', {})).rejects.toThrow('Not found')
    })
  })

  describe('deleteWebhook()', () => {
    it('removes webhook from list', async () => {
      store.webhooks = [
        { id: '1', url: 'https://example.com/first' },
        { id: '2', url: 'https://example.com/second' },
      ]
      apiClient.delete.mockResolvedValueOnce({})

      await store.deleteWebhook('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/webhooks/1')
      expect(store.webhooks).toEqual([{ id: '2', url: 'https://example.com/second' }])
    })

    it('propagates errors', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Server error'))

      await expect(store.deleteWebhook('1')).rejects.toThrow('Server error')
    })
  })

  describe('testWebhook()', () => {
    it('sends test delivery and returns result', async () => {
      const mockResult = { success: true, status_code: 200 }
      apiClient.post.mockResolvedValueOnce({ data: { data: mockResult } })

      const result = await store.testWebhook('1')

      expect(apiClient.post).toHaveBeenCalledWith('/webhooks/1/test_delivery')
      expect(result).toEqual(mockResult)
    })

    it('propagates errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Endpoint unreachable'))

      await expect(store.testWebhook('1')).rejects.toThrow('Endpoint unreachable')
    })
  })

  describe('$reset()', () => {
    it('resets state to initial values', async () => {
      const mockWebhooks = [{ id: '1', url: 'https://example.com/hook' }]
      apiClient.get.mockResolvedValueOnce({ data: { data: mockWebhooks } })
      await store.fetchWebhooks()

      expect(store.webhooks).toEqual(mockWebhooks)

      store.$reset()

      expect(store.webhooks).toEqual([])
      expect(store.loading).toBe(false)
    })
  })
})
