import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('auth store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
  })

  describe('computed properties', () => {
    it('isAuthenticated is false when no token', () => {
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAuthenticated is true when token exists and 2FA not required', () => {
      store.token = 'jwt-token'
      store.requires2FA = false
      expect(store.isAuthenticated).toBe(true)
    })

    it('isAuthenticated is false when 2FA is required', () => {
      store.token = 'jwt-token'
      store.requires2FA = true
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAdmin is true when role is admin', () => {
      store.user = { role: 'admin' }
      expect(store.isAdmin).toBe(true)
    })

    it('isAdmin is false for non-admin roles', () => {
      store.user = { role: 'attorney' }
      expect(store.isAdmin).toBe(false)
    })

    it('isSuperAdmin checks is_super_admin flag', () => {
      store.user = { is_super_admin: true }
      expect(store.isSuperAdmin).toBe(true)
    })

    it('canEdit is true for admin, attorney, paralegal', () => {
      for (const role of ['admin', 'attorney', 'paralegal']) {
        store.user = { role }
        expect(store.canEdit).toBe(true)
      }
    })

    it('canEdit is false for viewer', () => {
      store.user = { role: 'viewer' }
      expect(store.canEdit).toBe(false)
    })

    it('fullName concatenates first and last name', () => {
      store.user = { first_name: 'Jane', last_name: 'Doe' }
      expect(store.fullName).toBe('Jane Doe')
    })

    it('fullName returns empty string when no user', () => {
      store.user = null
      expect(store.fullName).toBe('')
    })
  })

  describe('login()', () => {
    const mockUserData = {
      id: '42',
      attributes: {
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'admin',
        otp_required_for_login: false,
      },
    }

    it('sends credentials and stores token from Authorization header', async () => {
      apiClient.post.mockResolvedValueOnce({
        headers: { authorization: 'Bearer my-jwt-token' },
        data: { data: mockUserData },
      })

      await store.login('jane@test.com', 'password123')

      expect(apiClient.post).toHaveBeenCalledWith('/users/sign_in', {
        user: { email: 'jane@test.com', password: 'password123' },
      })
      expect(store.token).toBe('my-jwt-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'my-jwt-token')
    })

    it('stores user data in state and localStorage', async () => {
      apiClient.post.mockResolvedValueOnce({
        headers: { authorization: 'Bearer token' },
        data: { data: mockUserData },
      })

      await store.login('jane@test.com', 'pass')

      expect(store.user).toMatchObject({
        id: '42',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'admin',
      })
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_user', expect.any(String))
    })

    it('sets requires2FA when otp_required_for_login is true', async () => {
      const otpUser = {
        ...mockUserData,
        attributes: { ...mockUserData.attributes, otp_required_for_login: true },
      }
      apiClient.post.mockResolvedValueOnce({
        headers: { authorization: 'Bearer token' },
        data: { data: otpUser },
      })

      await store.login('jane@test.com', 'pass')
      expect(store.requires2FA).toBe(true)
      expect(store.isAuthenticated).toBe(false)
    })

    it('propagates API errors', async () => {
      const error = new Error('Unauthorized')
      error.response = { status: 401, data: { error: 'Invalid credentials' } }
      apiClient.post.mockRejectedValueOnce(error)

      await expect(store.login('bad@test.com', 'wrong')).rejects.toThrow()
    })
  })

  describe('confirm2FA()', () => {
    it('sets requires2FA to false', () => {
      store.token = 'jwt'
      store.requires2FA = true
      store.confirm2FA()
      expect(store.requires2FA).toBe(false)
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('logout()', () => {
    it('calls DELETE /users/sign_out and clears state', async () => {
      store.token = 'jwt'
      store.user = { first_name: 'Jane' }
      apiClient.delete.mockResolvedValueOnce({})

      await store.logout()

      expect(apiClient.delete).toHaveBeenCalledWith('/users/sign_out')
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user')
    })

    it('clears state even if API call fails', async () => {
      store.token = 'jwt'
      store.user = { first_name: 'Jane' }
      apiClient.delete.mockRejectedValueOnce(new Error('Network error'))

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })
  })

  describe('updateUser()', () => {
    it('merges new data into existing user', () => {
      store.user = { id: '1', first_name: 'Jane', last_name: 'Doe' }
      store.updateUser({ last_name: 'Smith' })
      expect(store.user.last_name).toBe('Smith')
      expect(store.user.first_name).toBe('Jane')
    })

    it('persists merged user to localStorage', () => {
      store.user = { id: '1', first_name: 'Jane' }
      store.updateUser({ first_name: 'Janet' })
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_user', expect.stringContaining('Janet'))
    })

    it('does nothing when user is null', () => {
      store.user = null
      store.updateUser({ first_name: 'Ghost' })
      expect(store.user).toBeNull()
    })
  })
})
