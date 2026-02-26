<script setup>
import { onMounted, ref, computed } from 'vue'
import { useReportsStore } from '../stores/reports'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const store = useReportsStore()
const { t } = useI18n()
const period = ref('30d')

onMounted(() => {
  store.fetchDashboard(period.value)
})

function changePeriod(p) {
  period.value = p
  store.fetchDashboard(p)
}

const periods = ['7d', '30d', '90d', 'all']

// Status colors
const statusColors = {
  draft: 'bg-gray-400',
  analyzing: 'bg-blue-400',
  review: 'bg-yellow-400',
  responded: 'bg-green-400',
  archived: 'bg-purple-400',
}

function maxCount(obj) {
  const vals = Object.values(obj || {})
  return Math.max(...vals, 1)
}

const reportData = computed(() => store.reportData)

const totalCases = computed(() => reportData.value?.total_cases ?? 0)
const completionRate = computed(() => reportData.value?.completion_rate ?? 0)
const avgResponseTime = computed(() => reportData.value?.avg_response_time ?? 0)
const evidenceRate = computed(() => reportData.value?.evidence_collection_rate ?? 0)

const casesByStatus = computed(() => reportData.value?.cases_by_status ?? {})
const casesByVisa = computed(() => reportData.value?.cases_by_visa_type ?? {})
const attorneyPerformance = computed(() => reportData.value?.attorney_performance ?? [])
const casesOverTime = computed(() => reportData.value?.cases_over_time ?? {})
const draftStats = computed(() => reportData.value?.draft_approval_stats ?? { approved: 0, total: 0 })

const draftApprovalPercent = computed(() => {
  if (!draftStats.value.total) return 0
  return Math.round((draftStats.value.approved / draftStats.value.total) * 100)
})

const casesOverTimeMax = computed(() => {
  const vals = Object.values(casesOverTime.value)
  return Math.max(...vals, 1)
})

// Visa type bar colors
const visaBarColors = [
  'bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-cyan-500',
]
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('reports.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('reports.subtitle') }}</p>
      </div>

      <!-- Period selector -->
      <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          v-for="p in periods"
          :key="p"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            period === p
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200',
          ]"
          @click="changePeriod(p)"
        >
          {{ t(`periods.${p}`) }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <LoadingSpinner v-if="store.loading" size="lg" />

    <!-- No data state -->
    <div
      v-else-if="!reportData"
      class="bg-white rounded-lg shadow p-12 text-center"
    >
      <p class="text-gray-500 text-sm">{{ t('reports.noData') }}</p>
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <!-- Total Cases -->
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm font-medium text-gray-500">{{ t('reports.totalCases') }}</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ totalCases }}</p>
        </div>

        <!-- Completion Rate -->
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm font-medium text-gray-500">{{ t('reports.completionRate') }}</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ completionRate }}%</p>
          <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-green-500 h-2 rounded-full transition-all duration-500"
              :style="{ width: completionRate + '%' }"
            />
          </div>
        </div>

        <!-- Avg Response Time -->
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm font-medium text-gray-500">{{ t('reports.avgResponseTime') }}</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">
            {{ avgResponseTime }}
            <span class="text-base font-normal text-gray-400">{{ t('reports.days') }}</span>
          </p>
        </div>

        <!-- Evidence Collection Rate -->
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm font-medium text-gray-500">{{ t('reports.evidenceRate') }}</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ evidenceRate }}%</p>
          <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              :style="{ width: evidenceRate + '%' }"
            />
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <!-- Cases by Status -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            {{ t('reports.casesByStatus') }}
          </h3>
          <div v-if="Object.keys(casesByStatus).length > 0" class="space-y-3">
            <div
              v-for="(count, status) in casesByStatus"
              :key="status"
              class="flex items-center gap-3"
            >
              <span class="text-sm text-gray-600 w-24 shrink-0 capitalize">
                {{ t(`cases.statuses.${status}`, status) }}
              </span>
              <div class="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  :class="[statusColors[status] || 'bg-gray-400', 'h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2']"
                  :style="{ width: Math.max((count / maxCount(casesByStatus)) * 100, 8) + '%' }"
                >
                  <span class="text-xs font-medium text-white">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 text-center py-8">{{ t('reports.noData') }}</p>
        </div>

        <!-- Cases by Visa Type -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            {{ t('reports.casesByVisa') }}
          </h3>
          <div v-if="Object.keys(casesByVisa).length > 0" class="space-y-3">
            <div
              v-for="(count, visa, index) in casesByVisa"
              :key="visa"
              class="flex items-center gap-3"
            >
              <span class="text-sm text-gray-600 w-24 shrink-0 truncate" :title="visa">
                {{ visa }}
              </span>
              <div class="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  :class="[visaBarColors[index % visaBarColors.length], 'h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2']"
                  :style="{ width: Math.max((count / maxCount(casesByVisa)) * 100, 8) + '%' }"
                >
                  <span class="text-xs font-medium text-white">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 text-center py-8">{{ t('reports.noData') }}</p>
        </div>
      </div>

      <!-- Attorney Performance + Draft Stats -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <!-- Attorney Performance Table -->
        <div class="bg-white shadow rounded-lg lg:col-span-2">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              {{ t('reports.attorneyPerformance') }}
            </h3>
          </div>
          <div v-if="attorneyPerformance.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('reports.attorney') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('reports.caseCount') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('reports.avgResolution') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="attorney in attorneyPerformance"
                  :key="attorney.attorney_name"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ attorney.attorney_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ attorney.case_count }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ attorney.avg_resolution_days ?? '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="p-6 text-center text-sm text-gray-400">
            {{ t('reports.noData') }}
          </div>
        </div>

        <!-- Draft Approval Stats -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            {{ t('reports.draftStats') }}
          </h3>
          <div class="flex flex-col items-center justify-center py-4">
            <!-- SVG circular progress -->
            <svg class="w-32 h-32" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#6366f1"
                stroke-width="10"
                stroke-linecap="round"
                :stroke-dasharray="314"
                :stroke-dashoffset="314 - (314 * draftApprovalPercent) / 100"
                transform="rotate(-90 60 60)"
                class="transition-all duration-700"
              />
              <text
                x="60"
                y="56"
                text-anchor="middle"
                class="text-2xl font-bold"
                fill="#111827"
                font-size="24"
                font-weight="bold"
              >
                {{ draftApprovalPercent }}%
              </text>
              <text
                x="60"
                y="74"
                text-anchor="middle"
                fill="#6b7280"
                font-size="11"
              >
                {{ t('reports.approved') }}
              </text>
            </svg>
            <div class="mt-4 text-center space-y-1">
              <p class="text-sm text-gray-600">
                <span class="font-semibold text-gray-900">{{ draftStats.approved }}</span>
                {{ t('reports.approved') }}
              </p>
              <p class="text-sm text-gray-600">
                <span class="font-semibold text-gray-900">{{ draftStats.total }}</span>
                {{ t('reports.total') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cases Over Time -->
      <div class="bg-white shadow rounded-lg p-6 mb-8">
        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          {{ t('dashboard.casesOverTime') }}
        </h3>
        <div v-if="Object.keys(casesOverTime).length > 0" class="overflow-x-auto">
          <div class="flex items-end gap-1 min-w-max" style="height: 180px;">
            <div
              v-for="(count, date) in casesOverTime"
              :key="date"
              class="flex flex-col items-center gap-1 flex-1"
              style="min-width: 32px;"
            >
              <span class="text-xs text-gray-500 font-medium">{{ count }}</span>
              <div
                class="w-full bg-indigo-500 rounded-t transition-all duration-500"
                :style="{ height: Math.max((count / casesOverTimeMax) * 150, 4) + 'px' }"
              />
              <span class="text-[10px] text-gray-400 truncate w-full text-center" :title="date">
                {{ date.slice(-5) }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-8">{{ t('reports.noData') }}</p>
      </div>
    </template>
  </div>
</template>
