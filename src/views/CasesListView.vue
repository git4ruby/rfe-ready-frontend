<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCasesStore } from '../stores/cases'
import { useNotificationStore } from '../stores/notification'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/vue/24/outline'
import CaseStatusBadge from '../components/CaseStatusBadge.vue'
import DeadlineIndicator from '../components/DeadlineIndicator.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'

const casesStore = useCasesStore()
const notify = useNotificationStore()

const searchQuery = ref('')
const currentPage = ref(1)

onMounted(async () => {
  try {
    await casesStore.fetchCases(currentPage.value)
  } catch (err) {
    notify.error('Failed to load cases. Please try again.')
  }
})

async function goToPage(page) {
  currentPage.value = page
  try {
    await casesStore.fetchCases(page)
  } catch (err) {
    notify.error('Failed to load cases.')
  }
}

const filteredCases = ref([])

watch(
  [() => casesStore.cases, searchQuery],
  ([cases, query]) => {
    if (!query.trim()) {
      filteredCases.value = cases
      return
    }
    const q = query.toLowerCase()
    filteredCases.value = cases.filter(
      (c) =>
        (c.attributes?.case_number || '').toLowerCase().includes(q) ||
        (c.attributes?.petitioner_name || '').toLowerCase().includes(q) ||
        (c.attributes?.beneficiary_name || '').toLowerCase().includes(q)
    )
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Cases</h1>
        <p class="mt-1 text-sm text-gray-500">Manage all RFE cases.</p>
      </div>
      <router-link
        to="/cases/new"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        <PlusIcon class="h-5 w-5" />
        New Case
      </router-link>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search cases..."
          class="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="casesStore.loading" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="!casesStore.loading && casesStore.cases.length === 0"
      title="No cases yet"
      description="Get started by creating your first RFE case."
    >
      <template #action>
        <router-link
          to="/cases/new"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          New Case
        </router-link>
      </template>
    </EmptyState>

    <!-- Cases table -->
    <div v-else class="bg-white shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
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
                Beneficiary
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visa Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deadline
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="rfeCase in filteredCases"
              :key="rfeCase.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                {{ rfeCase.attributes?.case_number || rfeCase.case_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ rfeCase.attributes?.petitioner_name || rfeCase.petitioner_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ rfeCase.attributes?.beneficiary_name || rfeCase.beneficiary_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ rfeCase.attributes?.visa_type || rfeCase.visa_type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <CaseStatusBadge :status="rfeCase.attributes?.status || rfeCase.status" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <DeadlineIndicator
                  v-if="rfeCase.attributes?.rfe_deadline || rfeCase.rfe_deadline"
                  :deadline="rfeCase.attributes?.rfe_deadline || rfeCase.rfe_deadline"
                />
                <span v-else class="text-sm text-gray-400">--</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <router-link
                  :to="`/cases/${rfeCase.id}`"
                  class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  <EyeIcon class="h-4 w-4" />
                  View
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="casesStore.pagination?.total_pages > 1"
        class="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200"
      >
        <div class="text-sm text-gray-500">
          Page {{ casesStore.pagination.current_page }} of {{ casesStore.pagination.total_pages }}
          ({{ casesStore.pagination.total_count }} total)
        </div>
        <div class="flex gap-2">
          <button
            :disabled="casesStore.pagination.current_page <= 1"
            @click="goToPage(casesStore.pagination.current_page - 1)"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            :disabled="casesStore.pagination.current_page >= casesStore.pagination.total_pages"
            @click="goToPage(casesStore.pagination.current_page + 1)"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
