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

const stats = computed(() => {
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
      <!-- Stats cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div
          v-for="stat in stats"
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
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                  <router-link :to="`/cases/${rfeCase.id}`">
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
