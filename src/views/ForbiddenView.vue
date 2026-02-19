<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goHome() {
  if (authStore.isSuperAdmin) {
    router.push('/platform')
  } else if (authStore.isAuthenticated) {
    router.push('/')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
    <div class="text-center">
      <p class="text-6xl font-bold text-red-600">403</p>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-gray-900">Access denied</h1>
      <p class="mt-4 text-base text-gray-500 max-w-md">
        You don't have permission to access this page. Contact your administrator if you believe this is an error.
      </p>
      <div class="mt-8">
        <button
          @click="goHome"
          class="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
      <div class="mt-4">
        <button @click="router.back()" class="text-sm font-medium text-gray-500 hover:text-gray-700">
          Go back
        </button>
      </div>
    </div>
  </div>
</template>
