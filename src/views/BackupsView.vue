<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDownTrayIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'
import apiClient from '../api/client'
import { useNotificationStore } from '../stores/notification'

const { t } = useI18n()
const notify = useNotificationStore()
const backups = ref([])
const loading = ref(true)
const creating = ref(false)

async function loadBackups() {
  loading.value = true
  try {
    const response = await apiClient.get('/backups')
    backups.value = response.data.data
  } catch {
    notify.error('Failed to load backups.')
  } finally {
    loading.value = false
  }
}

onMounted(loadBackups)

async function createBackup() {
  creating.value = true
  try {
    const response = await apiClient.post('/backups')
    backups.value.unshift(response.data.data)
    notify.success('Backup started. It will be ready shortly.')
    // Poll for completion
    pollBackup(response.data.data.id)
  } catch {
    notify.error('Failed to create backup.')
  } finally {
    creating.value = false
  }
}

async function pollBackup(id) {
  const interval = setInterval(async () => {
    try {
      const response = await apiClient.get('/backups')
      backups.value = response.data.data
      const backup = backups.value.find(b => b.id === id)
      if (backup && (backup.status === 'completed' || backup.status === 'failed')) {
        clearInterval(interval)
        if (backup.status === 'completed') {
          notify.success('Backup completed successfully!')
        } else {
          notify.error('Backup failed: ' + (backup.error_message || 'Unknown error'))
        }
      }
    } catch {
      clearInterval(interval)
    }
  }, 3000)
}

async function deleteBackup(id) {
  if (!confirm('Are you sure you want to delete this backup?')) return
  try {
    await apiClient.delete(`/backups/${id}`)
    backups.value = backups.value.filter(b => b.id !== id)
    notify.success('Backup deleted.')
  } catch {
    notify.error('Failed to delete backup.')
  }
}

async function downloadBackup(id) {
  try {
    const response = await apiClient.get(`/backups/${id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch {
    notify.error('Failed to download backup.')
  }
}

function statusBadge(status) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleString()
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('backups.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('backups.subtitle') }}</p>
      </div>
      <button
        @click="createBackup"
        :disabled="creating"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        <PlusIcon class="h-4 w-4" />
        {{ creating ? t('backups.creating') : t('backups.createBackup') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="bg-white rounded-lg shadow p-6">
        <div class="animate-pulse flex items-center gap-4">
          <div class="h-4 bg-gray-200 rounded w-1/4" />
          <div class="h-4 bg-gray-200 rounded w-1/6" />
          <div class="h-4 bg-gray-200 rounded w-1/6" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="backups.length === 0" class="bg-white shadow rounded-lg p-12 text-center">
      <p class="text-sm text-gray-500">{{ t('backups.noBackups') }}</p>
    </div>

    <!-- Backups Table -->
    <div v-else class="bg-white shadow rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('backups.created') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('common.status') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('backups.size') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('backups.createdBy') }}</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="backup in backups" :key="backup.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(backup.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusBadge(backup.status)]">
                {{ backup.status === 'in_progress' ? t('backups.inProgress') : backup.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ backup.file_size_human || '--' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ backup.user_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="backup.status === 'completed'"
                  @click="downloadBackup(backup.id)"
                  class="text-indigo-600 hover:text-indigo-500 transition-colors"
                  title="Download"
                >
                  <ArrowDownTrayIcon class="h-5 w-5" />
                </button>
                <button
                  @click="deleteBackup(backup.id)"
                  class="text-red-500 hover:text-red-700 transition-colors"
                  title="Delete"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
