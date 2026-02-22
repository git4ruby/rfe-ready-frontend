import apiClient from './client'

const twoFactorApi = {
  setup() {
    return apiClient.post('/two_factor/setup')
  },

  verify(code) {
    return apiClient.post('/two_factor/verify', { code })
  },

  disable(password, code) {
    return apiClient.delete('/two_factor', { data: { password, code } })
  },

  validate(code) {
    return apiClient.post('/two_factor/validate', { code })
  },
}

export default twoFactorApi
