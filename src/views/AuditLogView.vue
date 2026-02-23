<script setup>
import { ref, watch, computed } from 'vue'
import { useAuditStore } from '../stores/audit'
import { useNotificationStore } from '../stores/notification'
import { useQueryFilters } from '../composables/useQueryFilters'
import {
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import PaginationBar from '../components/PaginationBar.vue'
import EmptyState from '../components/EmptyState.vue'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useAuditStore()
const notify = useNotificationStore()

const expandedRow = ref(null)

const actionOptions = computed(() => [
  { value: '', label: t('auditLog.allActions') },
  { value: 'create', label: t('auditLog.actionCreate') },
  { value: 'update', label: t('auditLog.actionUpdate') },
  { value: 'destroy', label: t('auditLog.actionDestroy') },
])

const typeOptions = computed(() => [
  { value: '', label: t('auditLog.allResources') },
  { value: 'RfeCase', label: t('auditLog.resourceCase') },
  { value: 'KnowledgeDoc', label: t('auditLog.resourceKnowledgeDoc') },
  { value: 'User', label: t('auditLog.resourceUser') },
  { value: 'DraftResponse', label: t('auditLog.resourceDraftResponse') },
])

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
    RfeCase: t('auditLog.resourceCase'),
    KnowledgeDoc: t('auditLog.resourceKnowledgeDoc'),
    User: t('auditLog.resourceUser'),
    DraftResponse: t('auditLog.resourceDraftResponse'),
  }
  return labels[type] || type
}

function hasChanges(log) {
  return log.changes_data && Object.keys(log.changes_data).length > 0
}

function formatFieldName(field) {
  return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const showExportMenu = ref(false)
const exporting = ref(false)

async function handleExport(formatType) {
  showExportMenu.value = false
  exporting.value = true
  try {
    await store.exportLogs({
      action_type: filters.value.action_type,
      auditable_type: filters.value.auditable_type,
    }, formatType)
    notify.success(`Audit log exported as ${formatType.toUpperCase()}.`)
  } catch {
    notify.error('Failed to export audit log.')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('auditLog.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('auditLog.subtitle') }}</p>
      </div>
      <div class="relative">
        <button
          @click="showExportMenu = !showExportMenu"
          :disabled="exporting"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ArrowDownTrayIcon class="h-5 w-5" />
          {{ exporting ? t('auditLog.exporting') : t('common.export') }}
          <ChevronDownIcon class="h-4 w-4" />
        </button>
        <div
          v-if="showExportMenu"
          class="absolute right-0 mt-1 w-40 rounded-lg bg-white shadow-lg ring-1 ring-gray-200 z-10"
        >
          <button
            @click="handleExport('csv')"
            class="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
          >
            {{ t('auditLog.exportCsv') }}
          </button>
          <button
            @click="handleExport('pdf')"
            class="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
          >
            {{ t('auditLog.exportPdf') }}
          </button>
        </div>
      </div>
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
      :title="t('auditLog.noLogs')"
      :description="t('auditLog.noLogsDescription')"
      :icon="ClipboardDocumentListIcon"
    />

    <!-- Audit log -->
    <div v-else>
      <!-- Mobile card layout -->
      <div class="md:hidden space-y-3">
        <div
          v-for="log in store.logs"
          :key="'m-' + log.id"
          class="bg-white shadow rounded-lg p-4"
          :class="{ 'cursor-pointer': hasChanges(log) }"
          @click="hasChanges(log) && toggleExpand(log.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ log.user_name || t('auditLog.system') }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatDateTime(log.created_at) }}</p>
            </div>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize shrink-0"
              :class="actionClasses(log.action)"
            >
              {{ log.action }}
            </span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <span class="text-sm text-gray-700">{{ typeLabel(log.auditable_type) }}</span>
            <span class="text-xs text-gray-500">&mdash; {{ log.auditable_name }}</span>
          </div>
          <!-- Expanded changes -->
          <div v-if="expandedRow === log.id && hasChanges(log)" class="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            <div
              v-for="(values, field) in log.changes_data"
              :key="field"
              class="text-xs"
            >
              <span class="font-medium text-gray-600">{{ formatFieldName(field) }}:</span>
              <span class="text-red-600 line-through ml-1">{{ values[0] ?? t('auditLog.empty') }}</span>
              <span class="text-gray-400 mx-1">&rarr;</span>
              <span class="text-green-700">{{ values[1] ?? t('auditLog.empty') }}</span>
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
                <th class="w-10 px-4 py-3"></th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('auditLog.dateTime') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('auditLog.user') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('auditLog.action') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('auditLog.resource') }}
                </th>
                <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('auditLog.ipAddress') }}
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
                      {{ log.user_name || t('auditLog.system') }}
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
                  <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ log.ip_address || '--' }}
                  </td>
                </tr>

                <!-- Expanded changes row -->
                <tr v-if="expandedRow === log.id && hasChanges(log)">
                  <td colspan="6" class="px-6 py-4 bg-gray-50">
                    <div class="text-xs font-medium text-gray-500 uppercase mb-2">{{ t('auditLog.changes') }}</div>
                    <div class="space-y-2">
                      <div
                        v-for="(values, field) in log.changes_data"
                        :key="field"
                        class="flex items-start gap-3 text-sm"
                      >
                        <span class="font-medium text-gray-700 min-w-[140px]">
                          {{ formatFieldName(field) }}
                        </span>
                        <span class="text-red-600 line-through">{{ values[0] ?? t('auditLog.empty') }}</span>
                        <span class="text-gray-400">&rarr;</span>
                        <span class="text-green-700">{{ values[1] ?? t('auditLog.empty') }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar
        :current-page="store.pagination?.current_page || 1"
        :total-pages="store.pagination?.total_pages || 1"
        :total-count="store.pagination?.total_count"
        @page-change="goToPage"
        class="mt-3 md:mt-0"
      />
    </div>
  </div>
</template>
