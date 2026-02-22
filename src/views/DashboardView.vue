<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  FolderIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import apiClient from '../api/client'
import CaseStatusBadge from '../components/CaseStatusBadge.vue'
import DeadlineIndicator from '../components/DeadlineIndicator.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import DoughnutChart from '../components/charts/DoughnutChart.vue'
import BarChart from '../components/charts/BarChart.vue'
import LineChart from '../components/charts/LineChart.vue'
import { useOnboarding } from '../composables/useOnboarding'

const { t } = useI18n()
const { checkAndStart: checkOnboarding } = useOnboarding()

const loading = ref(true)
const dashboard = ref(null)
const period = ref('30d')

const periodOptions = computed(() => [
  { value: '7d', label: t('periods.7d') },
  { value: '30d', label: t('periods.30d') },
  { value: '90d', label: t('periods.90d') },
  { value: 'all', label: t('periods.all') },
])

async function loadDashboard() {
  try {
    loading.value = true
    const response = await apiClient.get('/dashboard', { params: { period: period.value } })
    dashboard.value = response.data.data
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
  checkOnboarding()
})
watch(period, loadDashboard)

const caseStats = computed(() => {
  if (!dashboard.value) return []
  const byStatus = dashboard.value.cases_by_status || {}
  return [
    { name: t('dashboard.totalCases'), value: dashboard.value.total_cases || 0, icon: FolderIcon, color: 'bg-blue-500' },
    { name: t('dashboard.inReview'), value: (byStatus.review || 0) + (byStatus.analyzing || 0), icon: MagnifyingGlassIcon, color: 'bg-yellow-500' },
    { name: t('dashboard.approachingDeadline'), value: dashboard.value.approaching_deadlines || 0, icon: ClockIcon, color: 'bg-red-500' },
    { name: t('dashboard.responded'), value: byStatus.responded || 0, icon: CheckCircleIcon, color: 'bg-green-500' },
  ]
})

const recentCases = computed(() => dashboard.value?.recent_cases || [])
const recentActivity = computed(() => dashboard.value?.recent_activity || [])
const casesByVisaType = computed(() => dashboard.value?.cases_by_visa_type || {})
const casesByStatus = computed(() => dashboard.value?.cases_by_status || {})
const casesOverTime = computed(() => dashboard.value?.cases_over_time || {})

const formattedStatusData = computed(() => {
  const result = {}
  for (const [key, count] of Object.entries(casesByStatus.value)) {
    result[t(`cases.statuses.${key}`, key)] = count
  }
  return result
})

const statusColors = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#6b7280', '#ef4444']

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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('dashboard.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('dashboard.subtitle') }}</p>
      </div>
      <select
        v-model="period"
        class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
      >
        <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="i in 4" :key="i" class="bg-white rounded-lg shadow p-6 flex items-center gap-4">
          <div class="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
          <div class="space-y-2 flex-1">
            <div class="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            <div class="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
          </div>
        </div>
      </div>
      <SkeletonLoader variant="table" :rows="5" :columns="4" />
    </div>

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

      <!-- Charts Row -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <!-- Cases by Status (Doughnut) -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('dashboard.casesByStatus') }}</h3>
          <DoughnutChart
            v-if="Object.keys(formattedStatusData).length > 0"
            :data="formattedStatusData"
            :colors="statusColors"
          />
          <p v-else class="text-sm text-gray-400 text-center py-8">{{ t('dashboard.noCases') }}</p>
        </div>

        <!-- Cases by Visa Type (Bar) -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('dashboard.casesByVisaType') }}</h3>
          <BarChart
            v-if="Object.keys(casesByVisaType).length > 0"
            :data="casesByVisaType"
            color="#6366f1"
          />
          <p v-else class="text-sm text-gray-400 text-center py-8">{{ t('dashboard.noCases') }}</p>
        </div>

        <!-- Cases Over Time (Line) -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('dashboard.casesOverTime') }}</h3>
          <LineChart
            v-if="Object.keys(casesOverTime).length > 0"
            :data="casesOverTime"
            color="#6366f1"
          />
          <p v-else class="text-sm text-gray-400 text-center py-8">{{ t('dashboard.noData') }}</p>
        </div>
      </div>

      <!-- Activity + Recent Cases -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <!-- Recent Activity -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">{{ t('dashboard.recentActivity') }}</h3>
          </div>
          <div v-if="recentActivity.length === 0" class="p-6 text-center text-sm text-gray-400">
            {{ t('dashboard.noActivity') }}
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

        <!-- Recent Cases -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">{{ t('dashboard.recentCases') }}</h2>
          </div>
          <div v-if="recentCases.length === 0" class="p-6 text-center text-sm text-gray-500">
            {{ t('dashboard.createFirst') }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('cases.caseNumber') }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('cases.petitioner') }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('common.status') }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('cases.deadline') }}</th>
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ rfeCase.petitioner_name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap"><CaseStatusBadge :status="rfeCase.status" /></td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <DeadlineIndicator v-if="rfeCase.rfe_deadline" :deadline="rfeCase.rfe_deadline" />
                    <span v-else class="text-sm text-gray-400">--</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
