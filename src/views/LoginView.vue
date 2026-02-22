<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import twoFactorApi from '../api/twoFactor'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const notify = useNotificationStore()

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const ssoGoogleUrl = apiBase.replace('/api/v1', '') + '/auth/google_oauth2'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

// 2FA
const show2FA = ref(false)
const otpCode = ref('')
const verifying2FA = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    if (authStore.requires2FA) {
      show2FA.value = true
    } else {
      notify.success(t('auth.welcomeBack'))
      router.push(authStore.isSuperAdmin ? '/platform' : '/')
    }
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      t('auth.invalidCredentials')
    errorMessage.value = msg
  } finally {
    loading.value = false
  }
}

async function handle2FASubmit() {
  errorMessage.value = ''
  verifying2FA.value = true
  try {
    await twoFactorApi.validate(otpCode.value)
    authStore.confirm2FA()
    notify.success(t('auth.welcomeBack'))
    router.push(authStore.isSuperAdmin ? '/platform' : '/')
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Invalid code. Please try again.'
  } finally {
    verifying2FA.value = false
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

        <!-- 2FA Verification Step -->
        <template v-if="show2FA">
          <div class="text-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900">{{ t('auth.twoFactorTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ t('auth.twoFactorDescription') }}</p>
          </div>
          <form @submit.prevent="handle2FASubmit" class="space-y-6">
            <div>
              <label for="otp" class="block text-sm font-medium text-gray-700">{{ t('auth.verificationCode') }}</label>
              <input
                id="otp"
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                required
                maxlength="8"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-center text-lg tracking-widest sm:text-sm"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              :disabled="verifying2FA"
              class="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ verifying2FA ? t('auth.verifying') : t('auth.verify') }}
            </button>
          </form>
        </template>

        <!-- Normal Login Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              {{ t('auth.email') }}
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
              {{ t('auth.password') }}
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

          <div class="flex items-center justify-end">
            <router-link to="/forgot-password" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              {{ t('auth.forgotPassword') }}
            </router-link>
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
              {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
            </button>
          </div>

          <!-- SSO Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-white px-4 text-gray-400">Or continue with</span>
            </div>
          </div>

          <!-- SSO Buttons -->
          <div>
            <a
              :href="ssoGoogleUrl"
              class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
