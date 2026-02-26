import axios from 'axios'
import router from '../router'
import { useNotificationStore } from '../stores/notification'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor — attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Rate limit header data (read by rateLimit store)
export const rateLimitData = { limit: 0, remaining: 0, resetAt: 0 }

// Response interceptor — handle auth, server errors, and rate limit headers
apiClient.interceptors.response.use(
  (response) => {
    const l = response.headers['x-ratelimit-limit']
    const r = response.headers['x-ratelimit-remaining']
    const reset = response.headers['x-ratelimit-reset']
    if (l) {
      rateLimitData.limit = parseInt(l, 10)
      rateLimitData.remaining = parseInt(r, 10)
      rateLimitData.resetAt = parseInt(reset, 10)
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      const notificationStore = useNotificationStore()
      notificationStore.show('Your session has expired. Please sign in again.', 'info', 8000)
      router.push('/login')
    } else if (status === 403) {
      // Check if the API requires 2FA enforcement
      const responseCode = error.response?.data?.code
      if (responseCode === '2fa_required') {
        localStorage.setItem('2fa_enforcement_required', 'true')
        router.push({ name: 'Profile', query: { setup_2fa: 'true' } })
      } else if (!error.config?.url?.startsWith('/admin')) {
        // Only redirect if not already on an admin route (super admin 403s
        // from tenant endpoints are expected and handled by the caller)
        const currentPath = router.currentRoute?.value?.path || ''
        if (!currentPath.startsWith('/platform')) {
          router.push('/forbidden')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
