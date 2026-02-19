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

// Response interceptor — handle auth and server errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      const notificationStore = useNotificationStore()
      notificationStore.show('Your session has expired. Please sign in again.', 'info', 8000)
      router.push('/login')
    } else if (status === 403) {
      router.push('/forbidden')
    }
    return Promise.reject(error)
  }
)

export default apiClient
