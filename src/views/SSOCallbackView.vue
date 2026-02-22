<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notify = useNotificationStore()
const error = ref('')

onMounted(() => {
  const params = route.query

  if (params.error) {
    error.value = params.error
    return
  }

  if (params.token) {
    // Store auth data from SSO callback
    const token = params.token
    localStorage.setItem('auth_token', token)
    authStore.token = token

    const userData = {
      id: params.user_id,
      email: params.email,
      first_name: params.first_name,
      last_name: params.last_name,
      role: params.role,
      tenant_id: params.tenant_id,
      is_super_admin: params.is_super_admin === 'true',
    }
    authStore.updateUser(userData)

    notify.success('Welcome back!')
    router.replace(userData.is_super_admin ? '/platform' : '/')
  } else {
    error.value = 'Authentication failed. No token received.'
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div v-if="error" class="bg-white py-8 px-6 shadow-lg rounded-xl sm:px-10">
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
        <router-link
          to="/login"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to login
        </router-link>
      </div>
      <div v-else class="text-sm text-gray-500">
        <svg class="animate-spin mx-auto h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Completing sign in...
      </div>
    </div>
  </div>
</template>
