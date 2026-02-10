<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCasesStore } from '../stores/cases'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
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
  CloudArrowUpIcon,
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
  { key: 'documents', label: 'Documents', icon: DocumentArrowUpIcon },
  { key: 'analysis', label: 'RFE Analysis', icon: MagnifyingGlassIcon },
  { key: 'checklist', label: 'Checklist', icon: ClipboardDocumentCheckIcon },
  { key: 'drafts', label: 'Drafts', icon: PencilSquareIcon },
  { key: 'exhibits', label: 'Exhibits', icon: PhotoIcon },
  { key: 'export', label: 'Export', icon: ArrowDownTrayIcon },
]

// Load documents when switching to documents tab
watch(activeTab, (tab) => {
  if (tab === 'documents') loadDocuments()
})

// Documents
const uploading = ref(false)
const dragOver = ref(false)
const selectedDocType = ref('supporting_evidence')
const fileInput = ref(null)

const docTypeLabels = {
  rfe_notice: 'RFE Notice',
  supporting_evidence: 'Supporting Evidence',
  exhibit: 'Exhibit',
}

async function loadDocuments() {
  try {
    await casesStore.fetchDocuments(props.id)
  } catch (err) {
    notify.error('Failed to load documents.')
  }
}

async function handleFileUpload(files) {
  if (!files?.length) return
  uploading.value = true
  try {
    for (const file of files) {
      await casesStore.uploadDocument(props.id, file, selectedDocType.value)
    }
    notify.success(`${files.length} document${files.length > 1 ? 's' : ''} uploaded.`)
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to upload document.')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function onFileSelect(event) {
  handleFileUpload(event.target.files)
}

function onDrop(event) {
  dragOver.value = false
  handleFileUpload(event.dataTransfer.files)
}

async function handleDeleteDoc(docId) {
  try {
    await casesStore.deleteDocument(props.id, docId)
    notify.success('Document deleted.')
  } catch (err) {
    notify.error('Failed to delete document.')
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

          <!-- Documents tab -->
          <div v-else-if="activeTab === 'documents'">
            <!-- Upload area -->
            <div class="mb-6">
              <div class="flex items-center gap-4 mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Upload Documents</h3>
                <select
                  v-model="selectedDocType"
                  class="rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="rfe_notice">RFE Notice</option>
                  <option value="supporting_evidence">Supporting Evidence</option>
                  <option value="exhibit">Exhibit</option>
                </select>
              </div>

              <div
                @dragover.prevent="dragOver = true"
                @dragleave="dragOver = false"
                @drop.prevent="onDrop"
                :class="[
                  'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400',
                ]"
              >
                <CloudArrowUpIcon class="mx-auto h-10 w-10 text-gray-400" />
                <p class="mt-2 text-sm text-gray-600">
                  <button
                    type="button"
                    @click="fileInput?.click()"
                    class="font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Choose files
                  </button>
                  or drag and drop
                </p>
                <p class="mt-1 text-xs text-gray-500">PDF, DOCX, images up to 25MB</p>
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.tiff"
                  class="hidden"
                  @change="onFileSelect"
                />
                <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div class="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </div>
                </div>
              </div>
            </div>

            <!-- Documents list -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-3">
                Documents ({{ casesStore.documents.length }})
              </h3>

              <div v-if="casesStore.documents.length === 0" class="text-center py-8 text-sm text-gray-500">
                No documents uploaded yet.
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="doc in casesStore.documents"
                  :key="doc.id"
                  class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <DocumentTextIcon class="h-5 w-5 text-gray-500" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ doc.filename }}</p>
                      <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {{ docTypeLabels[doc.document_type] || doc.document_type }}
                        </span>
                        <span>{{ formatFileSize(doc.file_size) }}</span>
                        <span v-if="doc.uploaded_by_name">by {{ doc.uploaded_by_name }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 ml-4">
                    <a
                      v-if="doc.file_url"
                      :href="doc.file_url"
                      target="_blank"
                      class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Download
                    </a>
                    <button
                      @click="handleDeleteDoc(doc.id)"
                      class="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
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
