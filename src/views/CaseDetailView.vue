<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCasesStore } from '../stores/cases'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  CheckIcon,
  PaperAirplaneIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import CaseStatusBadge from '../components/CaseStatusBadge.vue'
import DeadlineIndicator from '../components/DeadlineIndicator.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const router = useRouter()
const casesStore = useCasesStore()
const authStore = useAuthStore()
const notify = useNotificationStore()

const activeTab = ref('overview')
const actionLoading = ref(null)
const showDeleteConfirm = ref(false)

const tabs = [
  { key: 'overview', label: 'Overview', icon: DocumentTextIcon },
  { key: 'analysis', label: 'RFE Analysis', icon: MagnifyingGlassIcon },
  { key: 'checklist', label: 'Checklist', icon: ClipboardDocumentCheckIcon },
  { key: 'drafts', label: 'Drafts', icon: PencilSquareIcon },
  { key: 'exhibits', label: 'Exhibits', icon: PhotoIcon },
  { key: 'export', label: 'Export', icon: ArrowDownTrayIcon },
]

onMounted(async () => {
  try {
    await casesStore.fetchCase(props.id)
  } catch (err) {
    notify.error('Failed to load case details.')
  }
})

const caseData = computed(() => casesStore.currentCase)

const attorneyName = computed(() => {
  const attorney = caseData.value?.assigned_attorney
  if (!attorney) return 'Not assigned'
  return `${attorney.first_name} ${attorney.last_name}`
})

// Status-based action visibility
const canStartAnalysis = computed(() =>
  caseData.value?.status === 'draft' && authStore.canEdit
)
const canMarkReviewed = computed(() =>
  caseData.value?.status === 'analyzing' && authStore.isAttorney
)
const canMarkResponded = computed(() =>
  caseData.value?.status === 'review' && authStore.isAttorney
)
const canArchive = computed(() =>
  ['draft', 'review', 'responded'].includes(caseData.value?.status) && authStore.canEdit
)
const canReopen = computed(() =>
  caseData.value?.status === 'archived' && authStore.isAdmin
)
const canDelete = computed(() => authStore.isAdmin)

async function performAction(actionName, storeFn) {
  actionLoading.value = actionName
  try {
    await storeFn(props.id)
    notify.success(`Case ${actionName.replace('_', ' ')} successful.`)
  } catch (err) {
    notify.error(err.response?.data?.error || `Failed to ${actionName.replace('_', ' ')}.`)
  } finally {
    actionLoading.value = null
  }
}

async function handleDelete() {
  actionLoading.value = 'delete'
  try {
    await casesStore.deleteCase(props.id)
    notify.success('Case deleted.')
    router.push('/cases')
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to delete case.')
  } finally {
    actionLoading.value = null
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <LoadingSpinner v-if="casesStore.loading && !caseData" />

    <template v-else-if="caseData">
      <!-- Back link -->
      <div class="mb-4">
        <router-link
          to="/cases"
          class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon class="h-4 w-4" />
          Back to Cases
        </router-link>
      </div>

      <!-- Case header -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">
                {{ caseData.case_number }}
              </h1>
              <CaseStatusBadge :status="caseData.status" />
            </div>
            <p class="mt-1 text-sm text-gray-500">
              {{ caseData.petitioner_name }}
              <span v-if="caseData.beneficiary_name"> &mdash; {{ caseData.beneficiary_name }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <DeadlineIndicator
              v-if="caseData.rfe_deadline"
              :deadline="caseData.rfe_deadline"
            />

            <!-- Workflow actions -->
            <button
              v-if="canStartAnalysis"
              @click="performAction('start_analysis', casesStore.startAnalysis)"
              :disabled="actionLoading"
              class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              <PlayIcon class="h-4 w-4" />
              Start Analysis
            </button>

            <button
              v-if="canMarkReviewed"
              @click="performAction('mark_reviewed', casesStore.markReviewed)"
              :disabled="actionLoading"
              class="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              <CheckIcon class="h-4 w-4" />
              Complete Review
            </button>

            <button
              v-if="canMarkResponded"
              @click="performAction('mark_responded', casesStore.markResponded)"
              :disabled="actionLoading"
              class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              <PaperAirplaneIcon class="h-4 w-4" />
              Mark Responded
            </button>

            <button
              v-if="canReopen"
              @click="performAction('reopen', casesStore.reopenCase)"
              :disabled="actionLoading"
              class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon class="h-4 w-4" />
              Reopen
            </button>

            <button
              v-if="canArchive"
              @click="performAction('archive', casesStore.archiveCase)"
              :disabled="actionLoading"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ArchiveBoxIcon class="h-4 w-4" />
              Archive
            </button>

            <button
              v-if="canDelete"
              @click="showDeleteConfirm = true"
              :disabled="actionLoading"
              class="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <TrashIcon class="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
          <h3 class="text-lg font-semibold text-gray-900">Delete Case</h3>
          <p class="mt-2 text-sm text-gray-500">
            Are you sure you want to delete <strong>{{ caseData.case_number }}</strong>? This action cannot be undone.
          </p>
          <div class="mt-4 flex justify-end gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              :disabled="actionLoading === 'delete'"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {{ actionLoading === 'delete' ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs navigation -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex overflow-x-auto" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              :class="[
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab content -->
        <div class="p-6">
          <!-- Overview tab -->
          <div v-if="activeTab === 'overview'">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- Case Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Case Information
                </h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Case Number</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">{{ caseData.case_number }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">USCIS Receipt Number</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">
                      {{ caseData.uscis_receipt_number || '--' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Visa Type</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">{{ caseData.visa_type }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Status</dt>
                    <dd class="mt-1">
                      <CaseStatusBadge :status="caseData.status" />
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- People -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  People
                </h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Petitioner</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">{{ caseData.petitioner_name }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Beneficiary</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">{{ caseData.beneficiary_name }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Attorney</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">{{ attorneyName }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Attorney Reviewed</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">
                      {{ caseData.attorney_reviewed ? 'Yes' : 'No' }}
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Dates -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Important Dates
                </h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">RFE Received Date</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">
                      {{ caseData.rfe_received_date || '--' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">RFE Deadline</dt>
                    <dd class="mt-1 flex items-center gap-2">
                      <span class="text-sm text-gray-900">{{ caseData.rfe_deadline || '--' }}</span>
                      <DeadlineIndicator
                        v-if="caseData.rfe_deadline"
                        :deadline="caseData.rfe_deadline"
                      />
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Created At</dt>
                    <dd class="mt-0.5 text-sm text-gray-900">
                      {{ caseData.created_at ? new Date(caseData.created_at).toLocaleDateString() : '--' }}
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Notes -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Notes
                </h3>
                <p class="text-sm text-gray-700 whitespace-pre-wrap">
                  {{ caseData.notes || 'No notes added.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Analysis tab -->
          <div v-else-if="activeTab === 'analysis'">
            <div class="text-center py-12">
              <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">RFE Analysis</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Upload the RFE notice to get AI-powered analysis of the issues raised by USCIS.
              </p>
            </div>
          </div>

          <!-- Checklist tab -->
          <div v-else-if="activeTab === 'checklist'">
            <div class="text-center py-12">
              <ClipboardDocumentCheckIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">Evidence Checklist</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Track the evidence needed for each RFE issue.
              </p>
            </div>
          </div>

          <!-- Drafts tab -->
          <div v-else-if="activeTab === 'drafts'">
            <div class="text-center py-12">
              <PencilSquareIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">Draft Responses</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                AI-generated draft responses for each RFE issue.
              </p>
            </div>
          </div>

          <!-- Exhibits tab -->
          <div v-else-if="activeTab === 'exhibits'">
            <div class="text-center py-12">
              <PhotoIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">Exhibits</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Manage supporting exhibits and documents.
              </p>
            </div>
          </div>

          <!-- Export tab -->
          <div v-else-if="activeTab === 'export'">
            <div class="text-center py-12">
              <ArrowDownTrayIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">Export</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Export the complete RFE response package as DOCX or PDF.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else-if="!casesStore.loading" class="text-center py-12">
      <h2 class="text-lg font-semibold text-gray-900">Case not found</h2>
      <p class="mt-2 text-sm text-gray-500">
        The case you are looking for does not exist or you do not have permission to view it.
      </p>
      <router-link
        to="/cases"
        class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        <ArrowLeftIcon class="h-4 w-4" />
        Back to Cases
      </router-link>
    </div>
  </div>
</template>
