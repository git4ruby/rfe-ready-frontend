import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const loading = ref(false)
  const pagination = ref({})

  async function fetchUsers(page = 1) {
    loading.value = true
    try {
      const response = await apiClient.get('/users', { params: { page } })
      users.value = response.data.data
      pagination.value = response.data.meta
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData) {
    const response = await apiClient.post('/users', { user: userData })
    // Refresh the list to pick up the new user with full serialization
    await fetchUsers()
    return response.data.data
  }

  async function updateUser(id, userData) {
    const response = await apiClient.patch(`/users/${id}`, { user: userData })
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx !== -1) users.value[idx] = response.data.data
    return response.data.data
  }

  async function deactivateUser(id) {
    return await updateUser(id, { status: 'inactive' })
  }

  async function resendInvitation(id) {
    const response = await apiClient.post(`/users/${id}/resend_invitation`)
    return response.data
  }

  return {
    users,
    loading,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    resendInvitation,
  }
})
