<script setup>
import { ref } from 'vue'
import {
  FolderIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import CaseStatusBadge from '../components/CaseStatusBadge.vue'

const stats = ref([
  { name: 'Total Cases', value: 24, icon: FolderIcon, color: 'bg-blue-500' },
  { name: 'In Review', value: 8, icon: MagnifyingGlassIcon, color: 'bg-yellow-500' },
  { name: 'Approaching Deadline', value: 3, icon: ClockIcon, color: 'bg-red-500' },
  { name: 'Responded', value: 13, icon: CheckCircleIcon, color: 'bg-green-500' },
])

const recentCases = ref([
  {
    id: 1,
    case_number: 'RFE-2026-001',
    petitioner_name: 'Acme Corp',
    status: 'review',
    deadline: '2026-03-15',
  },
  {
    id: 2,
    case_number: 'RFE-2026-002',
    petitioner_name: 'TechStart Inc',
    status: 'analyzing',
    deadline: '2026-02-28',
  },
  {
    id: 3,
    case_number: 'RFE-2026-003',
    petitioner_name: 'Global Solutions LLC',
    status: 'draft',
    deadline: '2026-04-01',
  },
  {
    id: 4,
    case_number: 'RFE-2026-004',
    petitioner_name: 'Innovate Labs',
    status: 'responded',
    deadline: '2026-01-20',
  },
  {
    id: 5,
    case_number: 'RFE-2026-005',
    petitioner_name: 'DataFlow Systems',
    status: 'review',
    deadline: '2026-03-05',
  },
])
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Overview of your RFE cases and activity.</p>
    </div>

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
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Case #
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Petitioner
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ rfeCase.deadline }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
