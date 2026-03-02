import { setActivePinia, createPinia } from 'pinia'
import { useTemplatesStore } from '../templates'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('templates store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTemplatesStore()
  })

  describe('initial state', () => {
    it('has empty templates, null currentTemplate, and loading false', () => {
      expect(store.templates).toEqual([])
      expect(store.currentTemplate).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchTemplates()', () => {
    it('fetches templates and sets state', async () => {
      const mockTemplates = [
        { id: '1', name: 'H-1B RFE Template', category: 'employment' },
        { id: '2', name: 'I-140 RFE Template', category: 'immigration' },
      ]
      apiClient.get.mockResolvedValueOnce({ data: { data: mockTemplates } })

      await store.fetchTemplates()

      expect(apiClient.get).toHaveBeenCalledWith('/case_templates')
      expect(store.templates).toEqual(mockTemplates)
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchTemplates()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: [] } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))
      await store.fetchTemplates().catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchTemplate()', () => {
    it('fetches single template and sets currentTemplate', async () => {
      const mockTemplate = { id: '1', name: 'H-1B RFE Template', body: 'Template content...' }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockTemplate } })

      const result = await store.fetchTemplate('1')

      expect(apiClient.get).toHaveBeenCalledWith('/case_templates/1')
      expect(store.currentTemplate).toEqual(mockTemplate)
      expect(result).toEqual(mockTemplate)
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchTemplate('1')
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: { id: '1' } } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Not found'))
      await store.fetchTemplate('999').catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('createTemplate()', () => {
    it('creates template and prepends to list', async () => {
      store.templates = [{ id: '1', name: 'Existing Template' }]
      const created = { id: '2', name: 'New Template', category: 'employment' }
      apiClient.post.mockResolvedValueOnce({ data: { data: created } })

      const result = await store.createTemplate({ name: 'New Template', category: 'employment' })

      expect(apiClient.post).toHaveBeenCalledWith('/case_templates', {
        case_template: { name: 'New Template', category: 'employment' },
      })
      expect(result).toEqual(created)
      expect(store.templates[0]).toEqual(created)
      expect(store.templates).toHaveLength(2)
    })

    it('propagates errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Validation failed'))

      await expect(store.createTemplate({ name: '' })).rejects.toThrow('Validation failed')
    })
  })

  describe('updateTemplate()', () => {
    it('updates template in list', async () => {
      store.templates = [
        { id: '1', name: 'Old Name', category: 'employment' },
        { id: '2', name: 'Other Template', category: 'immigration' },
      ]
      const updated = { id: '1', name: 'New Name', category: 'employment' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateTemplate('1', { name: 'New Name' })

      expect(apiClient.patch).toHaveBeenCalledWith('/case_templates/1', {
        case_template: { name: 'New Name' },
      })
      expect(result).toEqual(updated)
      expect(store.templates[0]).toEqual(updated)
      expect(store.templates[1]).toEqual({ id: '2', name: 'Other Template', category: 'immigration' })
    })

    it('does not modify list if id not found', async () => {
      store.templates = [{ id: '1', name: 'Existing' }]
      const updated = { id: '999', name: 'Ghost' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      await store.updateTemplate('999', { name: 'Ghost' })

      expect(store.templates).toEqual([{ id: '1', name: 'Existing' }])
    })

    it('propagates errors', async () => {
      apiClient.patch.mockRejectedValueOnce(new Error('Not found'))

      await expect(store.updateTemplate('1', {})).rejects.toThrow('Not found')
    })
  })

  describe('deleteTemplate()', () => {
    it('removes template from list', async () => {
      store.templates = [
        { id: '1', name: 'First Template' },
        { id: '2', name: 'Second Template' },
      ]
      apiClient.delete.mockResolvedValueOnce({})

      await store.deleteTemplate('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/case_templates/1')
      expect(store.templates).toEqual([{ id: '2', name: 'Second Template' }])
    })

    it('propagates errors', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Server error'))

      await expect(store.deleteTemplate('1')).rejects.toThrow('Server error')
    })
  })

  describe('$reset()', () => {
    it('resets state to initial values', async () => {
      const mockTemplates = [{ id: '1', name: 'Template' }]
      apiClient.get.mockResolvedValueOnce({ data: { data: mockTemplates } })
      await store.fetchTemplates()

      apiClient.get.mockResolvedValueOnce({ data: { data: { id: '1', name: 'Template', body: 'content' } } })
      await store.fetchTemplate('1')

      expect(store.templates).toEqual(mockTemplates)
      expect(store.currentTemplate).not.toBeNull()

      store.$reset()

      expect(store.templates).toEqual([])
      expect(store.currentTemplate).toBeNull()
      expect(store.loading).toBe(false)
    })
  })
})
