<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import profileApi from '../api/profile'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import PasswordStrength from '../components/PasswordStrength.vue'

const authStore = useAuthStore()
const notify = useNotificationStore()

const loading = ref(true)
const profile = ref(null)

// Profile form
const profileForm = ref({ first_name: '', last_name: '', bar_number: '' })
const savingProfile = ref(false)

// Password form
const passwordForm = ref({ current_password: '', password: '', password_confirmation: '' })
const savingPassword = ref(false)
const passwordErrors = ref({})

async function loadProfile() {
  loading.value = true
  try {
    const response = await profileApi.getProfile()
    profile.value = response.data.data
    profileForm.value = {
      first_name: profile.value.first_name || '',
      last_name: profile.value.last_name || '',
      bar_number: profile.value.bar_number || '',
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)

async function handleSaveProfile() {
  savingProfile.value = true
  try {
    const response = await profileApi.updateProfile(profileForm.value)
    profile.value = response.data.data
    // Update local auth store
    authStore.updateUser({
      first_name: profile.value.first_name,
      last_name: profile.value.last_name,
      bar_number: profile.value.bar_number,
    })
    notify.success('Profile updated successfully.')
  } catch (err) {
    const msg = err.response?.data?.details?.join(', ') || err.response?.data?.error || 'Failed to update profile.'
    notify.error(msg)
  } finally {
    savingProfile.value = false
  }
}

async function handleChangePassword() {
  passwordErrors.value = {}

  if (!passwordForm.value.current_password) {
    passwordErrors.value.current_password = 'Required'
    return
  }
  if (!passwordForm.value.password || passwordForm.value.password.length < 6) {
    passwordErrors.value.password = 'Must be at least 6 characters'
    return
  }
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
    passwordErrors.value.password_confirmation = 'Passwords do not match'
    return
  }

  savingPassword.value = true
  try {
    await profileApi.changePassword(passwordForm.value)
    notify.success('Password changed successfully.')
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (err) {
    const msg = err.response?.data?.error || 'Failed to change password.'
    notify.error(msg)
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
      <p class="mt-1 text-sm text-gray-500">Manage your personal information and password.</p>
    </div>

    <SkeletonLoader v-if="loading" variant="detail" />

    <template v-else-if="profile">
      <div class="space-y-6 max-w-2xl">
        <!-- Account Info (read-only) -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Account</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm text-gray-500">Email</dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">{{ profile.email }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Role</dt>
              <dd class="mt-1">
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-indigo-100 text-indigo-800">
                  {{ profile.role }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Personal Info -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Personal Information</h2>
          <form @submit.prevent="handleSaveProfile" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  v-model="profileForm.first_name"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  v-model="profileForm.last_name"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div v-if="profile.role === 'attorney'">
              <label class="block text-sm font-medium text-gray-700">Bar Number</label>
              <input
                v-model="profileForm.bar_number"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div class="flex justify-end pt-2">
              <button
                type="submit"
                :disabled="savingProfile"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ savingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Change Password -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Change Password</h2>
          <form @submit.prevent="handleChangePassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                v-model="passwordForm.current_password"
                type="password"
                autocomplete="current-password"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p v-if="passwordErrors.current_password" class="mt-1 text-sm text-red-600">{{ passwordErrors.current_password }}</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  v-model="passwordForm.password"
                  type="password"
                  autocomplete="new-password"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <PasswordStrength :password="passwordForm.password" />
                <p v-if="passwordErrors.password" class="mt-1 text-sm text-red-600">{{ passwordErrors.password }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  v-model="passwordForm.password_confirmation"
                  type="password"
                  autocomplete="new-password"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p v-if="passwordErrors.password_confirmation" class="mt-1 text-sm text-red-600">{{ passwordErrors.password_confirmation }}</p>
              </div>
            </div>
            <div class="flex justify-end pt-2">
              <button
                type="submit"
                :disabled="savingPassword"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ savingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>
