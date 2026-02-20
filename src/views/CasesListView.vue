<script setup>
import { ref, watch, computed } from 'vue'
import { useCasesStore } from '../stores/cases'
import { useNotificationStore } from '../stores/notification'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, PencilSquareIcon, ArchiveBoxIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import CaseStatusBadge from '../components/CaseStatusBadge.vue'
import DeadlineIndicator from '../components/DeadlineIndicator.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import EmptyState from '../components/EmptyState.vue'
import PaginationBar from '../components/PaginationBar.vue'
import { useQueryFilters } from '../composables/useQueryFilters'

const casesStore = useCasesStore()
const notify = useNotificationStore()

const searchQuery = ref('')

async function loadCases(page) {
  try {
    await casesStore.fetchCases(page)
  } catch {
    notify.error('Failed to load cases.')
  }
}

const { currentPage, goToPage } = useQueryFilters({}, { onLoad: loadCases })

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
        (c.case_number || '').toLowerCase().includes(q) ||
        (c.petitioner_name || '').toLowerCase().includes(q) ||
        (c.beneficiary_name || '').toLowerCase().includes(q)
    )
  },
  { immediate: true }
)

// Bulk selection
const selectedIds = ref(new Set())
const bulkLoading = ref(false)

const allSelected = computed(() =>
  filteredCases.value.length > 0 && filteredCases.value.every((c) => selectedIds.value.has(c.id))
)

function toggleSelect(id) {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedIds.value = newSet
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredCases.value.map((c) => c.id))
  }
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function handleBulkAction(actionName) {
  const ids = Array.from(selectedIds.value)
  if (ids.length === 0) return

  bulkLoading.value = true
  try {
    const result = await casesStore.bulkUpdateStatus(ids, actionName)
    const label = actionName === 'archive' ? 'archived' : 'reopened'
    notify.success(`${result.success} case(s) ${label} successfully.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`)
    clearSelection()
    await casesStore.fetchCases(currentPage.value)
  } catch (err) {
    notify.error(err.response?.data?.error || `Failed to ${actionName} cases.`)
  } finally {
    bulkLoading.value = false
  }
}

// Clear selection on page change
watch(currentPage, () => clearSelection())
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
        data-shortcut="new-case"
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
          data-shortcut="search"
          placeholder="Search cases... (press /)"
          class="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
    </div>

    <!-- Loading skeleton -->
    <SkeletonLoader v-if="casesStore.loading" variant="table" :rows="6" :columns="5" />

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

    <!-- Cases list -->
    <div v-else>
      <!-- Bulk action bar -->
      <div
        v-if="selectedIds.size > 0"
        class="flex items-center gap-3 px-4 py-3 mb-3 bg-indigo-50 border border-indigo-100 rounded-lg"
      >
        <span class="text-sm font-medium text-indigo-700">{{ selectedIds.size }} case{{ selectedIds.size > 1 ? 's' : '' }} selected</span>
        <div class="flex items-center gap-2 ml-auto">
          <button
            @click="handleBulkAction('archive')"
            :disabled="bulkLoading"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArchiveBoxIcon class="h-4 w-4" />
            Archive
          </button>
          <button
            @click="handleBulkAction('reopen')"
            :disabled="bulkLoading"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon class="h-4 w-4" />
            Reopen
          </button>
          <button
            @click="clearSelection"
            class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 ml-2"
          >
            <XMarkIcon class="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <!-- Mobile card layout -->
      <div class="md:hidden space-y-3">
        <div
          v-for="rfeCase in filteredCases"
          :key="'m-' + rfeCase.id"
          class="bg-white shadow rounded-lg p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <input
                type="checkbox"
                :checked="selectedIds.has(rfeCase.id)"
                @change="toggleSelect(rfeCase.id)"
                class="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div class="min-w-0">
                <router-link
                  :to="`/cases/${rfeCase.id}`"
                  class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {{ rfeCase.case_number }}
                </router-link>
                <p class="text-sm text-gray-900 mt-0.5">{{ rfeCase.petitioner_name }}</p>
                <p class="text-xs text-gray-500">{{ rfeCase.beneficiary_name }}</p>
              </div>
            </div>
            <CaseStatusBadge :status="rfeCase.status" />
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <DeadlineIndicator v-if="rfeCase.rfe_deadline" :deadline="rfeCase.rfe_deadline" />
            <span v-else class="text-xs text-gray-400">No deadline</span>
            <div class="flex items-center gap-3">
              <router-link :to="`/cases/${rfeCase.id}`" class="text-sm font-medium text-gray-600 hover:text-gray-500">View</router-link>
              <router-link :to="{ path: `/cases/${rfeCase.id}`, query: { edit: 'true' } }" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">Edit</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case #
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Petitioner
                </th>
                <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beneficiary
                </th>
                <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visa Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <td class="w-10 px-4 py-4" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(rfeCase.id)"
                    @change="toggleSelect(rfeCase.id)"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <router-link
                    :to="`/cases/${rfeCase.id}`"
                    class="text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
                  >
                    {{ rfeCase.case_number }}
                  </router-link>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ rfeCase.petitioner_name }}
                </td>
                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ rfeCase.beneficiary_name }}
                </td>
                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ rfeCase.visa_type }}
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
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center justify-center gap-3">
                    <router-link
                      :to="`/cases/${rfeCase.id}`"
                      class="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-500 transition-colors"
                    >
                      <EyeIcon class="h-4 w-4" />
                      View
                    </router-link>
                    <router-link
                      :to="{ path: `/cases/${rfeCase.id}`, query: { edit: 'true' } }"
                      class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      <PencilSquareIcon class="h-4 w-4" />
                      Edit
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar
        :current-page="casesStore.pagination?.current_page || 1"
        :total-pages="casesStore.pagination?.total_pages || 1"
        :total-count="casesStore.pagination?.total_count"
        @page-change="goToPage"
        class="mt-3 md:mt-0"
      />
    </div>
  </div>
</template>
