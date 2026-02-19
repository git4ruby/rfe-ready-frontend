<script setup>
import { ref, watch } from 'vue'
import { useAuditStore } from '../stores/audit'
import { useNotificationStore } from '../stores/notification'
import { useQueryFilters } from '../composables/useQueryFilters'
import {
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import PaginationBar from '../components/PaginationBar.vue'
import EmptyState from '../components/EmptyState.vue'

const store = useAuditStore()
const notify = useNotificationStore()

const expandedRow = ref(null)

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'destroy', label: 'Destroy' },
]

const typeOptions = [
  { value: '', label: 'All Resources' },
  { value: 'RfeCase', label: 'Case' },
  { value: 'KnowledgeDoc', label: 'Knowledge Doc' },
  { value: 'User', label: 'User' },
  { value: 'DraftResponse', label: 'Draft Response' },
]

async function loadLogs(page = 1) {
  try {
    await store.fetchLogs({
      page,
      action_type: filters.value.action_type || null,
      auditable_type: filters.value.auditable_type || null,
    })
  } catch {
    notify.error('Failed to load audit logs.')
  }
}

const { filters, currentPage, updateFilters, goToPage } = useQueryFilters(
  { action_type: '', auditable_type: '' },
  { onLoad: loadLogs }
)

watch([() => filters.value.action_type, () => filters.value.auditable_type], () => {
  goToPage(1)
})

function toggleExpand(id) {
  expandedRow.value = expandedRow.value === id ? null : id
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function actionClasses(action) {
  const classes = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    destroy: 'bg-red-100 text-red-700',
  }
  return classes[action] || 'bg-gray-100 text-gray-700'
}

function typeLabel(type) {
  const labels = {
    RfeCase: 'Case',
    KnowledgeDoc: 'Knowledge Doc',
    User: 'User',
    DraftResponse: 'Draft Response',
  }
  return labels[type] || type
}

function hasChanges(log) {
  return log.changes_data && Object.keys(log.changes_data).length > 0
}

function formatFieldName(field) {
  return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Audit Log</h1>
      <p class="mt-1 text-sm text-gray-500">Track all changes made across the system.</p>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg p-4 mb-4">
      <div class="flex items-center gap-4 flex-wrap">
        <FunnelIcon class="h-5 w-5 text-gray-400 shrink-0" />
        <select
          v-model="filters.action_type"
          class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
        >
          <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select
          v-model="filters.auditable_type"
          class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
        >
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading skeleton -->
    <SkeletonLoader v-if="store.loading" variant="table" :rows="8" :columns="5" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="!store.loading && store.logs.length === 0"
      title="No audit logs yet"
      description="Activity will appear here as changes are made in the system."
      :icon="ClipboardDocumentListIcon"
    />

    <!-- Audit log table -->
    <div v-else class="bg-white shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-10 px-4 py-3"></th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date / Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="log in store.logs" :key="log.id">
              <tr
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'cursor-pointer': hasChanges(log) }"
                @click="hasChanges(log) && toggleExpand(log.id)"
              >
                <td class="px-4 py-4 text-center">
                  <button
                    v-if="hasChanges(log)"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronDownIcon
                      v-if="expandedRow !== log.id"
                      class="h-4 w-4"
                    />
                    <ChevronUpIcon v-else class="h-4 w-4" />
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDateTime(log.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ log.user_name || 'System' }}
                  </div>
                  <div v-if="log.user_email" class="text-xs text-gray-500">
                    {{ log.user_email }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    :class="actionClasses(log.action)"
                  >
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ typeLabel(log.auditable_type) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ log.auditable_name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ log.ip_address || '--' }}
                </td>
              </tr>

              <!-- Expanded changes row -->
              <tr v-if="expandedRow === log.id && hasChanges(log)">
                <td colspan="6" class="px-6 py-4 bg-gray-50">
                  <div class="text-xs font-medium text-gray-500 uppercase mb-2">Changes</div>
                  <div class="space-y-2">
                    <div
                      v-for="(values, field) in log.changes_data"
                      :key="field"
                      class="flex items-start gap-3 text-sm"
                    >
                      <span class="font-medium text-gray-700 min-w-[140px]">
                        {{ formatFieldName(field) }}
                      </span>
                      <span class="text-red-600 line-through">{{ values[0] ?? '(empty)' }}</span>
                      <span class="text-gray-400">&rarr;</span>
                      <span class="text-green-700">{{ values[1] ?? '(empty)' }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <PaginationBar
        :current-page="store.pagination?.current_page || 1"
        :total-pages="store.pagination?.total_pages || 1"
        :total-count="store.pagination?.total_count"
        @page-change="goToPage"
      />
    </div>
  </div>
</template>
