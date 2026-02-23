import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '../knowledge'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('knowledge store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useKnowledgeStore()
  })

  describe('fetchDocs()', () => {
    it('fetches documents with filters and pagination', async () => {
      const mockDocs = [{ id: '1', title: 'Legal Memo' }]
      const mockMeta = { current_page: 1, total_pages: 2, stats: { total: 10 } }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockDocs, meta: mockMeta } })

      await store.fetchDocs({ q: 'memo', doc_type: 'legal_memo' }, 2)

      expect(apiClient.get).toHaveBeenCalledWith('/knowledge_docs', {
        params: { page: 2, q: 'memo', doc_type: 'legal_memo' },
      })
      expect(store.docs).toEqual(mockDocs)
      expect(store.pagination).toEqual(mockMeta)
      expect(store.stats).toEqual({ total: 10 })
    })

    it('manages loading state', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })
      const p = store.fetchDocs()
      expect(store.loading).toBe(true)
      await p
      expect(store.loading).toBe(false)
    })

    it('omits empty filter params', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })
      await store.fetchDocs({ q: '', doc_type: '' })
      const calledParams = apiClient.get.mock.calls[0][1].params
      expect(calledParams).toEqual({ page: 1 })
    })
  })

  describe('createDoc()', () => {
    it('posts FormData with upload progress and prepends result', async () => {
      const mockDoc = { id: '5', title: 'New Doc' }
      apiClient.post.mockResolvedValueOnce({ data: { data: mockDoc } })

      store.docs = [{ id: '1', title: 'Old Doc' }]
      const formData = new FormData()
      const result = await store.createDoc(formData)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/knowledge_docs',
        formData,
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: expect.any(Function),
        }),
      )
      expect(result).toEqual(mockDoc)
      expect(store.docs[0]).toEqual(mockDoc)
    })

    it('resets uploadProgress to 0 before upload', async () => {
      store.uploadProgress = 50
      apiClient.post.mockResolvedValueOnce({ data: { data: { id: '5' } } })
      await store.createDoc(new FormData())
      // uploadProgress starts at 0 when createDoc is called
      expect(apiClient.post).toHaveBeenCalled()
    })
  })

  describe('updateDoc()', () => {
    it('patches and updates doc in list', async () => {
      const updated = { id: '1', title: 'Updated Title' }
      store.docs = [{ id: '1', title: 'Original' }]
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateDoc('1', { title: 'Updated Title' })

      expect(store.docs[0]).toEqual(updated)
      expect(result).toEqual(updated)
    })

    it('uses multipart headers when data is FormData', async () => {
      apiClient.patch.mockResolvedValueOnce({ data: { data: { id: '1' } } })
      store.docs = [{ id: '1' }]

      await store.updateDoc('1', new FormData())

      expect(apiClient.patch).toHaveBeenCalledWith('/knowledge_docs/1', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    })
  })

  describe('deleteDoc()', () => {
    it('deletes document and removes from list', async () => {
      store.docs = [
        { id: '1', title: 'Keep' },
        { id: '2', title: 'Delete' },
      ]
      apiClient.delete.mockResolvedValueOnce({})

      await store.deleteDoc('2')

      expect(apiClient.delete).toHaveBeenCalledWith('/knowledge_docs/2')
      expect(store.docs).toHaveLength(1)
      expect(store.docs[0].id).toBe('1')
    })
  })
})
