<script setup>
import { onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import {
  BuildingOfficeIcon,
  UsersIcon,
  FolderIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const store = useAdminStore()

onMounted(() => {
  store.fetchDashboard()
})

function planColor(plan) {
  const colors = { trial: 'bg-gray-100 text-gray-800', basic: 'bg-blue-100 text-blue-800', professional: 'bg-purple-100 text-purple-800', enterprise: 'bg-amber-100 text-amber-800' }
  return colors[plan] || 'bg-gray-100 text-gray-800'
}

function statusColor(status) {
  const colors = { active: 'bg-green-100 text-green-800', suspended: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-600' }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Overview of the entire RFE Ready platform.</p>
    </div>

    <LoadingSpinner v-if="store.dashboardLoading" />

    <template v-else-if="store.dashboard">
      <!-- Stats cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6 flex items-center gap-4">
          <div class="rounded-lg p-3 bg-blue-500 shrink-0">
            <BuildingOfficeIcon class="h-6 w-6 text-white" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ store.dashboard.total_tenants }}</p>
            <p class="text-sm text-gray-500">Total Tenants</p>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 flex items-center gap-4">
          <div class="rounded-lg p-3 bg-green-500 shrink-0">
            <UsersIcon class="h-6 w-6 text-white" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ store.dashboard.total_users }}</p>
            <p class="text-sm text-gray-500">Total Users</p>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 flex items-center gap-4">
          <div class="rounded-lg p-3 bg-purple-500 shrink-0">
            <FolderIcon class="h-6 w-6 text-white" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ store.dashboard.total_cases }}</p>
            <p class="text-sm text-gray-500">Total Cases</p>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 flex items-center gap-4">
          <div class="rounded-lg p-3 bg-orange-500 shrink-0">
            <ArrowTrendingUpIcon class="h-6 w-6 text-white" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ store.dashboard.growth?.tenants_this_month || 0 }}</p>
            <p class="text-sm text-gray-500">New This Month</p>
          </div>
        </div>
      </div>

      <!-- Breakdowns -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Tenants by Plan</h3>
          <div v-if="Object.keys(store.dashboard.tenants_by_plan || {}).length === 0" class="text-sm text-gray-400">No tenants yet.</div>
          <div v-else class="space-y-3">
            <div v-for="(count, plan) in store.dashboard.tenants_by_plan" :key="plan" class="flex items-center justify-between">
              <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', planColor(plan)]">{{ plan }}</span>
              <span class="text-sm font-semibold text-gray-900">{{ count }}</span>
            </div>
          </div>
        </div>
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Tenants by Status</h3>
          <div v-if="Object.keys(store.dashboard.tenants_by_status || {}).length === 0" class="text-sm text-gray-400">No tenants yet.</div>
          <div v-else class="space-y-3">
            <div v-for="(count, status) in store.dashboard.tenants_by_status" :key="status" class="flex items-center justify-between">
              <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusColor(status)]">{{ status }}</span>
              <span class="text-sm font-semibold text-gray-900">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent tenants -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Recently Created Tenants</h2>
          <router-link to="/platform/tenants" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </router-link>
        </div>
        <div v-if="(store.dashboard.recent_tenants || []).length === 0" class="p-6 text-center text-sm text-gray-400">
          No tenants yet.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="tenant in store.dashboard.recent_tenants" :key="tenant.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <router-link :to="`/platform/tenants/${tenant.id}`" class="text-indigo-600 hover:text-indigo-500 hover:underline">
                    {{ tenant.name }}
                  </router-link>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', planColor(tenant.plan)]">{{ tenant.plan }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusColor(tenant.status)]">{{ tenant.status }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ new Date(tenant.created_at).toLocaleDateString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
