import { setActivePinia, createPinia } from 'pinia'
import { useUsersStore } from '../users'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('users store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useUsersStore()
  })

  describe('fetchUsers()', () => {
    it('fetches users and sets state', async () => {
      const mockUsers = [
        { id: '1', first_name: 'Alice', role: 'attorney' },
        { id: '2', first_name: 'Bob', role: 'paralegal' },
      ]
      const mockMeta = { current_page: 1, total_pages: 2 }
      apiClient.get.mockResolvedValueOnce({ data: { data: mockUsers, meta: mockMeta } })

      await store.fetchUsers(1)

      expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { page: 1 } })
      expect(store.users).toEqual(mockUsers)
      expect(store.pagination).toEqual(mockMeta)
    })

    it('defaults to page 1', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })

      await store.fetchUsers()

      expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { page: 1 } })
    })

    it('sets loading true during fetch and false after', async () => {
      let resolvePromise
      apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchUsers()
      expect(store.loading).toBe(true)

      resolvePromise({ data: { data: [], meta: {} } })
      await fetchPromise
      expect(store.loading).toBe(false)
    })

    it('sets loading false even on error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network'))
      await store.fetchUsers().catch(() => {})
      expect(store.loading).toBe(false)
    })
  })

  describe('createUser()', () => {
    it('posts user data, refreshes list, and returns the created user', async () => {
      const newUser = { id: '3', first_name: 'Carol', role: 'paralegal' }
      apiClient.post.mockResolvedValueOnce({ data: { data: newUser } })
      // fetchUsers call after create
      apiClient.get.mockResolvedValueOnce({ data: { data: [newUser], meta: {} } })

      const result = await store.createUser({ first_name: 'Carol', role: 'paralegal' })

      expect(apiClient.post).toHaveBeenCalledWith('/users', {
        user: { first_name: 'Carol', role: 'paralegal' },
      })
      expect(result).toEqual(newUser)
      // Verify it refreshed the list
      expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { page: 1 } })
    })

    it('propagates errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Validation failed'))

      await expect(store.createUser({ first_name: '' })).rejects.toThrow('Validation failed')
    })
  })

  describe('updateUser()', () => {
    it('patches user data and updates user in list', async () => {
      store.users = [
        { id: '1', first_name: 'Alice', role: 'attorney' },
        { id: '2', first_name: 'Bob', role: 'paralegal' },
      ]
      const updated = { id: '1', first_name: 'Alice', role: 'admin' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateUser('1', { role: 'admin' })

      expect(apiClient.patch).toHaveBeenCalledWith('/users/1', { user: { role: 'admin' } })
      expect(result).toEqual(updated)
      expect(store.users[0]).toEqual(updated)
      // Other users unchanged
      expect(store.users[1].id).toBe('2')
    })

    it('handles user not found in list gracefully', async () => {
      store.users = [{ id: '2', first_name: 'Bob' }]
      const updated = { id: '99', first_name: 'Unknown', role: 'viewer' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateUser('99', { role: 'viewer' })

      expect(result).toEqual(updated)
      // List unchanged since id not found
      expect(store.users).toHaveLength(1)
      expect(store.users[0].id).toBe('2')
    })
  })

  describe('deactivateUser()', () => {
    it('calls updateUser with inactive status', async () => {
      store.users = [{ id: '1', first_name: 'Alice', status: 'active' }]
      const deactivated = { id: '1', first_name: 'Alice', status: 'inactive' }
      apiClient.patch.mockResolvedValueOnce({ data: { data: deactivated } })

      const result = await store.deactivateUser('1')

      expect(apiClient.patch).toHaveBeenCalledWith('/users/1', { user: { status: 'inactive' } })
      expect(result).toEqual(deactivated)
      expect(store.users[0].status).toBe('inactive')
    })
  })

  describe('resendInvitation()', () => {
    it('posts resend invitation and returns response data', async () => {
      const responseData = { message: 'Invitation sent' }
      apiClient.post.mockResolvedValueOnce({ data: responseData })

      const result = await store.resendInvitation('5')

      expect(apiClient.post).toHaveBeenCalledWith('/users/5/resend_invitation')
      expect(result).toEqual(responseData)
    })

    it('propagates errors on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('User not found'))

      await expect(store.resendInvitation('999')).rejects.toThrow('User not found')
    })
  })

  describe('bulkUpdateStatus()', () => {
    it('posts bulk update and returns result', async () => {
      const result = { success: 3, failed: 0 }
      apiClient.post.mockResolvedValueOnce({ data: { data: result } })

      const returned = await store.bulkUpdateStatus(['1', '2', '3'], 'inactive')

      expect(apiClient.post).toHaveBeenCalledWith('/users/bulk_update_status', {
        ids: ['1', '2', '3'],
        status: 'inactive',
      })
      expect(returned).toEqual(result)
    })

    it('propagates errors on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Forbidden'))

      await expect(store.bulkUpdateStatus(['1'], 'inactive')).rejects.toThrow('Forbidden')
    })
  })
})
