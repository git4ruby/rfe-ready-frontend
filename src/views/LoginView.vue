<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'

const router = useRouter()
const authStore = useAuthStore()
const notify = useNotificationStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    notify.success('Welcome back!')
    router.push(authStore.isSuperAdmin ? '/platform' : '/')
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Invalid email or password. Please try again.'
    errorMessage.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo -->
      <div class="flex justify-center">
        <div class="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center">
          <span class="text-white font-bold text-xl">R</span>
        </div>
      </div>
      <h2 class="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900">
        RFE Ready
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        AI-Powered RFE Response Platform
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 shadow-lg rounded-xl sm:px-10">
        <!-- Error message -->
        <div
          v-if="errorMessage"
          class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4"
        >
          <p class="text-sm text-red-700">{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <!-- Submit -->
          <div>
            <button
              type="submit"
              :disabled="loading"
              class="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
