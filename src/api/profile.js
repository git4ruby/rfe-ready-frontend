import apiClient from './client'

const profileApi = {
  getProfile() {
    return apiClient.get('/profile')
  },

  updateProfile(data) {
    return apiClient.patch('/profile', { profile: data })
  },

  changePassword(data) {
    return apiClient.patch('/profile/change_password', data)
  },
}

export default profileApi
