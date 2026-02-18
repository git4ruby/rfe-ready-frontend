<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  FolderIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import apiClient from '../api/client'
import CaseStatusBadge from '../components/CaseStatusBadge.vue'
import DeadlineIndicator from '../components/DeadlineIndicator.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const loading = ref(true)
const dashboard = ref(null)

onMounted(async () => {
  try {
    const response = await apiClient.get('/dashboard')
    dashboard.value = response.data.data
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  } finally {
    loading.value = false
  }
})

const caseStats = computed(() => {
  if (!dashboard.value) return []
  const byStatus = dashboard.value.cases_by_status || {}
  return [
    { name: 'Total Cases', value: dashboard.value.total_cases || 0, icon: FolderIcon, color: 'bg-blue-500' },
    { name: 'In Review', value: (byStatus.review || 0) + (byStatus.analyzing || 0), icon: MagnifyingGlassIcon, color: 'bg-yellow-500' },
    { name: 'Approaching Deadline', value: dashboard.value.approaching_deadlines || 0, icon: ClockIcon, color: 'bg-red-500' },
    { name: 'Responded', value: byStatus.responded || 0, icon: CheckCircleIcon, color: 'bg-green-500' },
  ]
})

const recentCases = computed(() => dashboard.value?.recent_cases || [])
const recentActivity = computed(() => dashboard.value?.recent_activity || [])
const casesByVisaType = computed(() => dashboard.value?.cases_by_visa_type || {})

function actionLabel(action) {
  const labels = { create: 'Created', update: 'Updated', destroy: 'Deleted' }
  return labels[action] || action
}

function actionColor(action) {
  const colors = { create: 'text-green-700 bg-green-100', update: 'text-blue-700 bg-blue-100', destroy: 'text-red-700 bg-red-100' }
  return colors[action] || 'text-gray-700 bg-gray-100'
}

function typeLabel(type) {
  const labels = { RfeCase: 'Case', KnowledgeDoc: 'Knowledge Doc', User: 'User', DraftResponse: 'Draft' }
  return labels[type] || type
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Overview of your RFE cases and activity.</p>
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Case Stats -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div
          v-for="stat in caseStats"
          :key="stat.name"
          class="bg-white rounded-lg shadow p-6 flex items-center gap-4"
        >
          <div :class="['rounded-lg p-3 shrink-0', stat.color]">
            <component :is="stat.icon" class="h-6 w-6 text-white" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
            <p class="text-sm text-gray-500">{{ stat.name }}</p>
          </div>
        </div>
      </div>

      <!-- Two-column layout: Cases by Visa Type + Activity -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <!-- Cases by Visa Type -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Cases by Visa Type</h3>
          <div v-if="Object.keys(casesByVisaType).length === 0" class="text-sm text-gray-400">No cases yet.</div>
          <div v-else class="space-y-3">
            <div v-for="(count, visa) in casesByVisaType" :key="visa" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">{{ visa }}</span>
              <div class="flex items-center gap-3">
                <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-indigo-500 rounded-full"
                    :style="{ width: `${Math.min((count / (dashboard?.total_cases || 1)) * 100, 100)}%` }"
                  />
                </div>
                <span class="text-sm font-semibold text-gray-900 w-8 text-right">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Recent Activity</h3>
          </div>
          <div v-if="recentActivity.length === 0" class="p-6 text-center text-sm text-gray-400">
            No recent activity.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="log in recentActivity"
              :key="log.id"
              class="px-6 py-3.5 flex items-start gap-3"
            >
              <span
                :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5', actionColor(log.action)]"
              >
                {{ actionLabel(log.action) }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">
                  <span class="font-medium">{{ log.user_name || 'System' }}</span>
                  {{ log.action === 'destroy' ? 'deleted' : log.action === 'create' ? 'created' : 'updated' }}
                  {{ typeLabel(log.auditable_type).toLowerCase() }}
                  <span v-if="log.auditable_name" class="font-medium">{{ log.auditable_name }}</span>
                </p>
                <p class="text-xs text-gray-400 mt-0.5">{{ timeAgo(log.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Cases -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Cases</h2>
        </div>
        <div v-if="recentCases.length === 0" class="p-6 text-center text-sm text-gray-500">
          No cases yet. Create your first case to get started.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case #
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Petitioner
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="rfeCase in recentCases"
                :key="rfeCase.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <router-link :to="`/cases/${rfeCase.id}`" class="text-indigo-600 hover:text-indigo-500 hover:underline">
                    {{ rfeCase.case_number }}
                  </router-link>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ rfeCase.petitioner_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <CaseStatusBadge :status="rfeCase.status" />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <DeadlineIndicator
                    v-if="rfeCase.rfe_deadline"
                    :deadline="rfeCase.rfe_deadline"
                  />
                  <span v-else class="text-sm text-gray-400">--</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
