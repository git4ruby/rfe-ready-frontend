<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const notification = useNotificationStore()

const form = ref({
  name: '',
  data_retention_days: 30,
})
const saving = ref(false)

const planColors = {
  trial: 'bg-yellow-100 text-yellow-800',
  basic: 'bg-gray-100 text-gray-800',
  professional: 'bg-indigo-100 text-indigo-800',
  enterprise: 'bg-purple-100 text-purple-800',
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

function loadForm() {
  if (settingsStore.tenant) {
    form.value.name = settingsStore.tenant.name || ''
    form.value.data_retention_days = settingsStore.tenant.data_retention_days || 30
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await settingsStore.updateTenant({
      name: form.value.name,
      data_retention_days: form.value.data_retention_days,
    })
    notification.success('Settings saved successfully.')
  } catch (err) {
    notification.error(err.response?.data?.error || 'Failed to save settings.')
  } finally {
    saving.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async () => {
  await settingsStore.fetchTenant()
  loadForm()
})
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="mt-1 text-sm text-gray-500">Manage your organization settings.</p>
    </div>

    <LoadingSpinner v-if="settingsStore.loading && !settingsStore.tenant" />

    <div v-else-if="settingsStore.tenant" class="space-y-6">
      <!-- Organization Settings (editable) -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Organization</h3>
          <p class="mt-1 text-sm text-gray-500">Update your organization details.</p>
        </div>
        <div class="p-6 space-y-5">
          <div>
            <label for="org-name" class="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              id="org-name"
              v-model="form.name"
              type="text"
              :disabled="!authStore.isAdmin"
              class="mt-1 block w-full sm:max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label for="retention" class="block text-sm font-medium text-gray-700">
              Data Retention (days)
            </label>
            <input
              id="retention"
              v-model.number="form.data_retention_days"
              type="number"
              min="1"
              max="3650"
              :disabled="!authStore.isAdmin"
              class="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p class="mt-1 text-xs text-gray-500">
              How long case data is retained before automatic cleanup.
            </p>
          </div>

          <div v-if="authStore.isAdmin" class="pt-2">
            <button
              @click="saveSettings"
              :disabled="saving"
              class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              <svg
                v-if="saving"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Plan & Account Info (read-only) -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Plan & Account</h3>
          <p class="mt-1 text-sm text-gray-500">Your current subscription and account details.</p>
        </div>
        <div class="p-6">
          <dl class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt class="text-sm font-medium text-gray-500">Plan</dt>
              <dd class="text-sm sm:col-span-2">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="planColors[settingsStore.tenant.plan] || 'bg-gray-100 text-gray-800'"
                >
                  {{ settingsStore.tenant.plan }}
                </span>
              </dd>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt class="text-sm font-medium text-gray-500">Status</dt>
              <dd class="text-sm sm:col-span-2">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="statusColors[settingsStore.tenant.status] || 'bg-gray-100 text-gray-800'"
                >
                  {{ settingsStore.tenant.status }}
                </span>
              </dd>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt class="text-sm font-medium text-gray-500">Slug</dt>
              <dd class="text-sm text-gray-900 sm:col-span-2 font-mono">
                {{ settingsStore.tenant.slug }}
              </dd>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt class="text-sm font-medium text-gray-500">Member Since</dt>
              <dd class="text-sm text-gray-900 sm:col-span-2">
                {{ formatDate(settingsStore.tenant.created_at) }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
