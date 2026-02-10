import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))
  const token = ref(localStorage.getItem('auth_token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isAttorney = computed(() => ['admin', 'attorney'].includes(user.value?.role))
  const canEdit = computed(() => ['admin', 'attorney', 'paralegal'].includes(user.value?.role))
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`
  })

  async function login(email, password) {
    const response = await apiClient.post('/users/sign_in', {
      user: { email, password },
    })

    // JWT token comes in Authorization header
    const authHeader = response.headers.authorization
    if (authHeader) {
      const jwtToken = authHeader.replace('Bearer ', '')
      token.value = jwtToken
      localStorage.setItem('auth_token', jwtToken)
    }

    user.value = response.data.data.attributes
    localStorage.setItem('auth_user', JSON.stringify(user.value))

    return response.data
  }

  async function logout() {
    try {
      await apiClient.delete('/users/sign_out')
    } catch (e) {
      // Ignore errors on logout
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isAttorney,
    canEdit,
    fullName,
    login,
    logout,
  }
})
