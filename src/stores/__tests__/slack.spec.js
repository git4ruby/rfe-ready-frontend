import { setActivePinia, createPinia } from 'pinia'
import { useSlackStore } from '../slack'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('slack store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSlackStore()
  })

  describe('initial state', () => {
    it('has empty integrations and loading false', () => {
      expect(store.integrations).toEqual([])
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchIntegrations()', () => {
    it('fetches integrations and sets state', async () => {
      const mockIntegrations = [
        { id: '1', channel_name: '#rfe-alerts', active: true },
        { id: '2', channel_name: '#general', active: false },
      ]
      apiClient.get.mockResolvedValueOnce({ data: { data: mockIntegrations } })

      await store.fetchIntegrations()

      expect(apiClient.get).toHaveBeenCalledWith('/slack_integrations')
      expect(store.integrations).toEqual(mockIntegrations)
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchIntegrations()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: [] } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))
      await store.fetchIntegrations().catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('createIntegration()', () => {
    it('creates integration and prepends to list', async () => {
      store.integrations = [{ id: '1', channel_name: '#existing' }]
      const newIntegration = { id: '2', channel_name: '#new-channel', active: true }
      apiClient.post.mockResolvedValueOnce({ data: { data: newIntegration } })

      const result = await store.createIntegration({ channel_name: '#new-channel' })

      expect(apiClient.post).toHaveBeenCalledWith('/slack_integrations', {
        slack_integration: { channel_name: '#new-channel' },
      })
      expect(result).toEqual(newIntegration)
      expect(store.integrations[0]).toEqual(newIntegration)
      expect(store.integrations).toHaveLength(2)
    })

    it('propagates errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Validation failed'))

      await expect(store.createIntegration({ channel_name: '' })).rejects.toThrow('Validation failed')
    })
  })

  describe('updateIntegration()', () => {
    it('updates integration in list', async () => {
      store.integrations = [
        { id: '1', channel_name: '#old-name', active: true },
        { id: '2', channel_name: '#other', active: false },
      ]
      const updated = { id: '1', channel_name: '#new-name', active: true }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateIntegration('1', { channel_name: '#new-name' })

      expect(apiClient.patch).toHaveBeenCalledWith('/slack_integrations/1', {
        slack_integration: { channel_name: '#new-name' },
      })
      expect(result).toEqual(updated)
      expect(store.integrations[0]).toEqual(updated)
      expect(store.integrations[1]).toEqual({ id: '2', channel_name: '#other', active: false })
    })

    it('does not modify list if id not found', async () => {
      store.integrations = [{ id: '1', channel_name: '#existing' }]
      const updated = { id: '999', channel_name: '#ghost' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      await store.updateIntegration('999', { channel_name: '#ghost' })

      expect(store.integrations).toEqual([{ id: '1', channel_name: '#existing' }])
    })

    it('propagates errors', async () => {
      apiClient.patch.mockRejectedValueOnce(new Error('Not found'))

      await expect(store.updateIntegration('1', {})).rejects.toThrow('Not found')
    })
  })

  describe('deleteIntegration()', () => {
    it('removes integration from list', async () => {
      store.integrations = [
        { id: '1', channel_name: '#first' },
        { id: '2', channel_name: '#second' },
      ]
      apiClient.delete.mockResolvedValueOnce({})

      await store.deleteIntegration('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/slack_integrations/1')
      expect(store.integrations).toEqual([{ id: '2', channel_name: '#second' }])
    })

    it('propagates errors', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Server error'))

      await expect(store.deleteIntegration('1')).rejects.toThrow('Server error')
    })
  })

  describe('testIntegration()', () => {
    it('sends test notification and returns result', async () => {
      const mockResult = { success: true, message: 'Notification sent' }
      apiClient.post.mockResolvedValueOnce({ data: { data: mockResult } })

      const result = await store.testIntegration('1')

      expect(apiClient.post).toHaveBeenCalledWith('/slack_integrations/1/test_notification')
      expect(result).toEqual(mockResult)
    })

    it('propagates errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Channel not found'))

      await expect(store.testIntegration('1')).rejects.toThrow('Channel not found')
    })
  })

  describe('$reset()', () => {
    it('resets state to initial values', async () => {
      const mockIntegrations = [{ id: '1', channel_name: '#test' }]
      apiClient.get.mockResolvedValueOnce({ data: { data: mockIntegrations } })
      await store.fetchIntegrations()

      expect(store.integrations).toEqual(mockIntegrations)

      store.$reset()

      expect(store.integrations).toEqual([])
      expect(store.loading).toBe(false)
    })
  })
})
