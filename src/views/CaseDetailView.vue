<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
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
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  Bars3Icon,
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

// Load data when switching tabs
watch(activeTab, (tab) => {
  if (tab === 'documents') loadDocuments()
  if (tab === 'analysis') loadAnalysis()
  if (tab === 'checklist') loadChecklist()
  if (tab === 'drafts') loadDrafts()
  if (tab === 'exhibits') loadExhibits()
  if (tab === 'export') loadExportData()
})

// Analysis
const expandedSections = ref({})

function toggleSectionExpand(sectionId) {
  expandedSections.value[sectionId] = !expandedSections.value[sectionId]
}

async function loadAnalysis() {
  try {
    await casesStore.fetchRfeSections(props.id)
    if (caseData.value?.status === 'analyzing') {
      casesStore.startPolling(props.id)
    }
  } catch (err) {
    notify.error('Failed to load analysis data.')
  }
}

const sectionTypeBadge = {
  specialty_occupation: { label: 'Specialty Occupation', color: 'bg-blue-100 text-blue-700' },
  beneficiary_qualifications: { label: 'Beneficiary Qualifications', color: 'bg-purple-100 text-purple-700' },
  employer_employee: { label: 'Employer-Employee', color: 'bg-amber-100 text-amber-700' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-700' },
}

function confidenceColor(score) {
  if (score >= 0.8) return 'bg-green-500'
  if (score >= 0.5) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Drafts
const draftsLoading = ref(false)
const generatingDrafts = ref(false)
const editingDraftId = ref(null)
const editContent = ref('')
const savingDraft = ref(false)

async function loadDrafts() {
  draftsLoading.value = true
  try {
    await casesStore.fetchDrafts(props.id)
  } catch (err) {
    notify.error('Failed to load drafts.')
  } finally {
    draftsLoading.value = false
  }
}

async function handleGenerateDrafts() {
  generatingDrafts.value = true
  try {
    await casesStore.generateAllDrafts(props.id)
    notify.success('Draft generation started. Refreshing in a few seconds...')
    // Poll for drafts to appear
    setTimeout(async () => {
      await casesStore.fetchDrafts(props.id)
      generatingDrafts.value = false
    }, 15000)
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to generate drafts.')
    generatingDrafts.value = false
  }
}

function startEditing(draft) {
  editingDraftId.value = draft.id
  editContent.value = draft.edited_content || draft.ai_generated_content || ''
}

function cancelEditing() {
  editingDraftId.value = null
  editContent.value = ''
}

async function saveDraft(draftId) {
  savingDraft.value = true
  try {
    await casesStore.updateDraft(props.id, draftId, editContent.value)
    editingDraftId.value = null
    notify.success('Draft saved.')
  } catch (err) {
    notify.error('Failed to save draft.')
  } finally {
    savingDraft.value = false
  }
}

async function handleApproveDraft(draftId) {
  try {
    await casesStore.approveDraft(props.id, draftId)
    notify.success('Draft approved.')
  } catch (err) {
    notify.error('Failed to approve draft.')
  }
}

async function handleRegenerateDraft(draftId) {
  try {
    await casesStore.regenerateDraft(props.id, draftId)
    notify.success('Regeneration started. Refresh in a few seconds.')
    setTimeout(() => casesStore.fetchDrafts(props.id), 15000)
  } catch (err) {
    notify.error('Failed to regenerate draft.')
  }
}

const draftStatusBadge = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  editing: { label: 'Editing', color: 'bg-blue-100 text-blue-700' },
  reviewed: { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
}

// Exhibits
const exhibitsLoading = ref(false)
const showExhibitForm = ref(false)
const editingExhibitId = ref(null)
const exhibitForm = ref({ label: '', title: '', description: '', page_range: '', rfe_document_id: '' })

async function loadExhibits() {
  exhibitsLoading.value = true
  try {
    await Promise.all([
      casesStore.fetchExhibits(props.id),
      casesStore.fetchDocuments(props.id),
    ])
  } catch (err) {
    notify.error('Failed to load exhibits.')
  } finally {
    exhibitsLoading.value = false
  }
}

function nextExhibitLabel() {
  const count = casesStore.exhibits.length
  // Generate labels like A, B, C... then AA, AB...
  if (count < 26) return String.fromCharCode(65 + count)
  return String.fromCharCode(64 + Math.floor(count / 26)) + String.fromCharCode(65 + (count % 26))
}

function openExhibitForm(exhibit = null) {
  if (exhibit) {
    editingExhibitId.value = exhibit.id
    exhibitForm.value = {
      label: exhibit.label,
      title: exhibit.title || '',
      description: exhibit.description || '',
      page_range: exhibit.page_range || '',
      rfe_document_id: exhibit.rfe_document_id || '',
    }
  } else {
    editingExhibitId.value = null
    exhibitForm.value = {
      label: nextExhibitLabel(),
      title: '',
      description: '',
      page_range: '',
      rfe_document_id: '',
    }
  }
  showExhibitForm.value = true
}

async function saveExhibit() {
  try {
    const data = {
      ...exhibitForm.value,
      position: editingExhibitId.value ? undefined : casesStore.exhibits.length,
      rfe_document_id: exhibitForm.value.rfe_document_id || null,
    }
    if (editingExhibitId.value) {
      await casesStore.updateExhibit(props.id, editingExhibitId.value, data)
      notify.success('Exhibit updated.')
    } else {
      await casesStore.createExhibit(props.id, data)
      notify.success('Exhibit added.')
    }
    showExhibitForm.value = false
  } catch (err) {
    notify.error(err.response?.data?.details?.[0] || err.response?.data?.error || 'Failed to save exhibit.')
  }
}

async function handleDeleteExhibit(exhibitId) {
  try {
    await casesStore.deleteExhibit(props.id, exhibitId)
    notify.success('Exhibit removed.')
  } catch (err) {
    notify.error('Failed to delete exhibit.')
  }
}

async function moveExhibit(index, direction) {
  const exhibits = [...casesStore.exhibits]
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= exhibits.length) return
  ;[exhibits[index], exhibits[newIndex]] = [exhibits[newIndex], exhibits[index]]
  const ids = exhibits.map((e) => e.id)
  try {
    await casesStore.reorderExhibits(props.id, ids)
  } catch (err) {
    notify.error('Failed to reorder exhibits.')
  }
}

// Export
const exportFormat = ref('pdf')

const approvedDraftsCount = computed(() => {
  return casesStore.drafts.filter((d) => d.status === 'approved').length
})

async function loadExportData() {
  try {
    await Promise.all([
      casesStore.fetchRfeSections(props.id),
      casesStore.fetchDrafts(props.id),
      casesStore.fetchExhibits(props.id),
    ])
  } catch (err) {
    notify.error('Failed to load export data.')
  }
}

async function handleExport() {
  try {
    await casesStore.exportCase(props.id, exportFormat.value)
    notify.success(`${exportFormat.value.toUpperCase()} exported successfully.`)
  } catch (err) {
    notify.error(err.response?.data?.error || 'Export failed. Please try again.')
  }
}

// Checklist
const checklistLoading = ref(false)

async function loadChecklist() {
  checklistLoading.value = true
  try {
    // Load both sections (for grouping) and checklists
    await Promise.all([
      casesStore.fetchRfeSections(props.id),
      casesStore.fetchChecklists(props.id),
    ])
  } catch (err) {
    notify.error('Failed to load checklist.')
  } finally {
    checklistLoading.value = false
  }
}

const checklistsBySection = computed(() => {
  const grouped = {}
  for (const section of casesStore.rfeSections) {
    grouped[section.id] = {
      section,
      items: casesStore.checklists.filter((c) => c.rfe_section_id === section.id),
    }
  }
  return grouped
})

const checklistProgress = computed(() => {
  const total = casesStore.checklists.length
  if (total === 0) return { collected: 0, total: 0, percent: 0 }
  const collected = casesStore.checklists.filter((c) => c.is_collected).length
  return { collected, total, percent: Math.round((collected / total) * 100) }
})

async function handleToggle(checklistId) {
  try {
    await casesStore.toggleChecklist(props.id, checklistId)
  } catch (err) {
    notify.error('Failed to update checklist item.')
  }
}

const priorityBadge = {
  required: { label: 'Required', color: 'bg-red-100 text-red-700' },
  recommended: { label: 'Recommended', color: 'bg-yellow-100 text-yellow-700' },
  optional: { label: 'Optional', color: 'bg-gray-100 text-gray-600' },
}

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
    // Auto-start polling if case is in analyzing state
    if (casesStore.currentCase?.status === 'analyzing') {
      casesStore.startPolling(props.id)
    }
  } catch (err) {
    notify.error('Failed to load case details.')
  }
})

onUnmounted(() => {
  casesStore.stopPolling()
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
    // Auto-switch to analysis tab and start polling
    if (actionName === 'start_analysis') {
      activeTab.value = 'analysis'
      casesStore.startPolling(props.id)
    }
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
            <!-- Analyzing state — show progress -->
            <div v-if="caseData.status === 'analyzing'" class="text-center py-12">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                <svg class="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Analyzing RFE Notice</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                AI is reading and parsing the RFE notice to identify issues. This may take a minute...
              </p>
              <p v-if="casesStore.analysisStatus" class="mt-3 text-xs text-indigo-600 font-medium uppercase tracking-wide">
                {{ casesStore.analysisStatus.progress || 'Processing' }}
              </p>
            </div>

            <!-- Failed state -->
            <div v-else-if="caseData.metadata?.analysis_progress === 'failed'" class="text-center py-12">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <ExclamationTriangleIcon class="h-8 w-8 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Analysis Failed</h3>
              <p class="mt-2 text-sm text-red-600 max-w-md mx-auto">
                {{ caseData.metadata?.analysis_error || 'An error occurred during analysis.' }}
              </p>
            </div>

            <!-- Sections loaded -->
            <div v-else-if="casesStore.rfeSections.length > 0">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  RFE Issues Identified ({{ casesStore.rfeSections.length }})
                </h3>
              </div>

              <div class="space-y-4">
                <div
                  v-for="section in casesStore.rfeSections"
                  :key="section.id"
                  class="border border-gray-200 rounded-lg bg-white overflow-hidden"
                >
                  <!-- Section header -->
                  <div
                    class="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    @click="toggleSectionExpand(section.id)"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="text-sm font-semibold text-gray-900">
                          {{ section.title }}
                        </h4>
                        <span
                          :class="[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            sectionTypeBadge[section.section_type]?.color || 'bg-gray-100 text-gray-700'
                          ]"
                        >
                          {{ sectionTypeBadge[section.section_type]?.label || section.section_type }}
                        </span>
                        <span
                          v-if="section.cfr_reference"
                          class="text-xs text-gray-500"
                        >
                          {{ section.cfr_reference }}
                        </span>
                      </div>
                      <p class="mt-1 text-sm text-gray-600 line-clamp-2">
                        {{ section.summary }}
                      </p>
                    </div>
                    <div class="flex items-center gap-3 ml-4 shrink-0">
                      <!-- Confidence score -->
                      <div class="flex items-center gap-1.5" :title="`Confidence: ${Math.round((section.confidence_score || 0) * 100)}%`">
                        <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            :class="['h-full rounded-full', confidenceColor(section.confidence_score || 0)]"
                            :style="{ width: `${(section.confidence_score || 0) * 100}%` }"
                          />
                        </div>
                        <span class="text-xs text-gray-500">{{ Math.round((section.confidence_score || 0) * 100) }}%</span>
                      </div>
                      <component
                        :is="expandedSections[section.id] ? ChevronUpIcon : ChevronDownIcon"
                        class="h-5 w-5 text-gray-400"
                      />
                    </div>
                  </div>

                  <!-- Expanded detail -->
                  <div v-if="expandedSections[section.id]" class="border-t border-gray-200 p-4 bg-gray-50">
                    <div class="space-y-4">
                      <!-- Original RFE text -->
                      <div v-if="section.original_text">
                        <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Original RFE Text
                        </h5>
                        <p class="text-sm text-gray-700 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3">
                          {{ section.original_text }}
                        </p>
                      </div>

                      <!-- AI Summary -->
                      <div v-if="section.summary">
                        <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          AI Analysis Summary
                        </h5>
                        <p class="text-sm text-gray-700">
                          {{ section.summary }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state — no analysis yet -->
            <div v-else class="text-center py-12">
              <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">RFE Analysis</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Upload an RFE notice document, then click "Start Analysis" to identify issues with AI.
              </p>
            </div>
          </div>

          <!-- Checklist tab -->
          <div v-else-if="activeTab === 'checklist'">
            <LoadingSpinner v-if="checklistLoading && casesStore.checklists.length === 0" />

            <div v-else-if="casesStore.checklists.length > 0">
              <!-- Progress bar -->
              <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">Evidence Checklist</h3>
                  <span class="text-sm font-medium text-gray-600">
                    {{ checklistProgress.collected }} / {{ checklistProgress.total }} collected
                  </span>
                </div>
                <div class="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-green-500 rounded-full transition-all duration-300"
                    :style="{ width: `${checklistProgress.percent}%` }"
                  />
                </div>
              </div>

              <!-- Grouped by section -->
              <div class="space-y-6">
                <div
                  v-for="(group, sectionId) in checklistsBySection"
                  :key="sectionId"
                >
                  <div class="flex items-center gap-2 mb-3">
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        sectionTypeBadge[group.section.section_type]?.color || 'bg-gray-100 text-gray-700'
                      ]"
                    >
                      {{ sectionTypeBadge[group.section.section_type]?.label || group.section.section_type }}
                    </span>
                    <h4 class="text-sm font-semibold text-gray-900">
                      {{ group.section.title }}
                    </h4>
                  </div>

                  <div class="space-y-2">
                    <div
                      v-for="item in group.items"
                      :key="item.id"
                      :class="[
                        'rounded-lg border p-4 transition-colors',
                        item.is_collected
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      ]"
                    >
                      <div class="flex items-start gap-3">
                        <!-- Checkbox -->
                        <button
                          @click="handleToggle(item.id)"
                          :class="[
                            'mt-0.5 shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                            item.is_collected
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-400'
                          ]"
                        >
                          <CheckIcon v-if="item.is_collected" class="h-3.5 w-3.5 text-white" />
                        </button>

                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span
                              :class="[
                                'text-sm font-medium',
                                item.is_collected ? 'text-gray-500 line-through' : 'text-gray-900'
                              ]"
                            >
                              {{ item.document_name }}
                            </span>
                            <span
                              :class="[
                                'inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium',
                                priorityBadge[item.priority]?.color || 'bg-gray-100 text-gray-600'
                              ]"
                            >
                              {{ priorityBadge[item.priority]?.label || item.priority }}
                            </span>
                          </div>
                          <p v-if="item.description" class="mt-1 text-sm text-gray-600">
                            {{ item.description }}
                          </p>
                          <p v-if="item.guidance" class="mt-1 text-xs text-gray-500 italic">
                            {{ item.guidance }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-else class="text-center py-12">
              <ClipboardDocumentCheckIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">Evidence Checklist</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Run the RFE analysis first to auto-generate the evidence checklist.
              </p>
            </div>
          </div>

          <!-- Drafts tab -->
          <div v-else-if="activeTab === 'drafts'">
            <LoadingSpinner v-if="draftsLoading && casesStore.drafts.length === 0" />

            <div v-else-if="casesStore.drafts.length > 0">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  Draft Responses ({{ casesStore.drafts.length }})
                </h3>
              </div>

              <div class="space-y-6">
                <div
                  v-for="draft in casesStore.drafts"
                  :key="draft.id"
                  class="border border-gray-200 rounded-lg bg-white overflow-hidden"
                >
                  <!-- Draft header -->
                  <div class="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-semibold text-gray-900">{{ draft.title }}</h4>
                      <span
                        :class="[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          draftStatusBadge[draft.status]?.color || 'bg-gray-100 text-gray-700'
                        ]"
                      >
                        {{ draftStatusBadge[draft.status]?.label || draft.status }}
                      </span>
                      <span class="text-xs text-gray-500">v{{ draft.version }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="draft.status !== 'approved' && editingDraftId !== draft.id"
                        @click="startEditing(draft)"
                        class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </button>
                      <button
                        v-if="draft.status !== 'approved' && authStore.isAttorney"
                        @click="handleApproveDraft(draft.id)"
                        class="text-xs font-medium text-green-600 hover:text-green-500"
                      >
                        Approve
                      </button>
                      <button
                        v-if="draft.status !== 'approved'"
                        @click="handleRegenerateDraft(draft.id)"
                        class="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>

                  <!-- Draft content -->
                  <div class="p-4">
                    <!-- Editing mode -->
                    <div v-if="editingDraftId === draft.id">
                      <textarea
                        v-model="editContent"
                        rows="16"
                        class="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                      />
                      <div class="mt-3 flex justify-end gap-2">
                        <button
                          @click="cancelEditing"
                          class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          @click="saveDraft(draft.id)"
                          :disabled="savingDraft"
                          class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {{ savingDraft ? 'Saving...' : 'Save' }}
                        </button>
                      </div>
                    </div>

                    <!-- Read mode -->
                    <div v-else>
                      <div
                        v-if="draft.status === 'approved' && draft.final_content"
                        class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3"
                      >
                        <p class="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Approved Final Content</p>
                        <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ draft.final_content }}</p>
                      </div>
                      <div v-if="draft.edited_content" class="mb-3">
                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Edited Content</p>
                        <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ draft.edited_content }}</p>
                      </div>
                      <div v-else-if="draft.ai_generated_content">
                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Generated Content</p>
                        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ draft.ai_generated_content }}</p>
                      </div>
                      <div v-if="draft.attorney_feedback" class="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p class="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Attorney Feedback</p>
                        <p class="text-sm text-gray-700">{{ draft.attorney_feedback }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state with generate button -->
            <div v-else class="text-center py-12">
              <PencilSquareIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-4 text-lg font-semibold text-gray-900">Draft Responses</h3>
              <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Generate AI-powered draft responses for each RFE issue identified in the analysis.
              </p>
              <button
                v-if="casesStore.rfeSections.length > 0"
                @click="handleGenerateDrafts"
                :disabled="generatingDrafts"
                class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <template v-if="generatingDrafts">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </template>
                <template v-else>
                  <PencilSquareIcon class="h-4 w-4" />
                  Generate Drafts
                </template>
              </button>
              <p v-else class="mt-2 text-xs text-gray-400">
                Run the RFE analysis first to generate drafts.
              </p>
            </div>
          </div>

          <!-- Exhibits tab -->
          <div v-else-if="activeTab === 'exhibits'">
            <LoadingSpinner v-if="exhibitsLoading && casesStore.exhibits.length === 0" />

            <div v-else>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  Exhibits ({{ casesStore.exhibits.length }})
                </h3>
                <button
                  @click="openExhibitForm()"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  <PlusIcon class="h-4 w-4" />
                  Add Exhibit
                </button>
              </div>

              <!-- Exhibit form modal -->
              <div v-if="showExhibitForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg mx-4 w-full">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    {{ editingExhibitId ? 'Edit Exhibit' : 'Add Exhibit' }}
                  </h3>
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Label</label>
                        <input
                          v-model="exhibitForm.label"
                          type="text"
                          placeholder="A"
                          class="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Page Range</label>
                        <input
                          v-model="exhibitForm.page_range"
                          type="text"
                          placeholder="1-5"
                          class="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        v-model="exhibitForm.title"
                        type="text"
                        placeholder="e.g. Detailed Job Description"
                        class="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        v-model="exhibitForm.description"
                        rows="2"
                        placeholder="Brief description of this exhibit"
                        class="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Linked Document</label>
                      <select
                        v-model="exhibitForm.rfe_document_id"
                        class="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">None</option>
                        <option v-for="doc in casesStore.documents" :key="doc.id" :value="doc.id">
                          {{ doc.filename }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="mt-6 flex justify-end gap-3">
                    <button
                      @click="showExhibitForm = false"
                      class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      @click="saveExhibit"
                      class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                    >
                      {{ editingExhibitId ? 'Update' : 'Add' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Exhibits list -->
              <div v-if="casesStore.exhibits.length > 0" class="space-y-2">
                <div
                  v-for="(exhibit, index) in casesStore.exhibits"
                  :key="exhibit.id"
                  class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <!-- Reorder buttons -->
                  <div class="flex flex-col gap-0.5 shrink-0">
                    <button
                      @click="moveExhibit(index, -1)"
                      :disabled="index === 0"
                      class="text-gray-400 hover:text-gray-600 disabled:opacity-25"
                      title="Move up"
                    >
                      <ChevronUpIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click="moveExhibit(index, 1)"
                      :disabled="index === casesStore.exhibits.length - 1"
                      class="text-gray-400 hover:text-gray-600 disabled:opacity-25"
                      title="Move down"
                    >
                      <ChevronDownIcon class="h-4 w-4" />
                    </button>
                  </div>

                  <!-- Label badge -->
                  <div class="shrink-0 h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <span class="text-sm font-bold text-indigo-700">{{ exhibit.label }}</span>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">
                      Exhibit {{ exhibit.label }}{{ exhibit.title ? ': ' + exhibit.title : '' }}
                    </p>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                      <span v-if="exhibit.description">{{ exhibit.description }}</span>
                      <span v-if="exhibit.page_range" class="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        pp. {{ exhibit.page_range }}
                      </span>
                      <span v-if="exhibit.document_filename" class="text-indigo-600">
                        {{ exhibit.document_filename }}
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      @click="openExhibitForm(exhibit)"
                      class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteExhibit(exhibit.id)"
                      class="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div v-else class="text-center py-12">
                <PhotoIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-4 text-lg font-semibold text-gray-900">No Exhibits Yet</h3>
                <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  Add exhibits to organize your supporting documents for the RFE response package.
                </p>
              </div>
            </div>
          </div>

          <!-- Export tab -->
          <div v-else-if="activeTab === 'export'">
            <div class="space-y-6">
              <!-- Readiness Summary -->
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Export Readiness</h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <p class="text-2xl font-bold text-indigo-600">{{ casesStore.rfeSections.length }}</p>
                    <p class="text-sm text-gray-500">Response Sections</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <p class="text-2xl font-bold" :class="approvedDraftsCount > 0 ? 'text-green-600' : 'text-amber-600'">
                      {{ approvedDraftsCount }} / {{ casesStore.drafts.length }}
                    </p>
                    <p class="text-sm text-gray-500">Drafts Approved</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <p class="text-2xl font-bold text-indigo-600">{{ casesStore.exhibits.length }}</p>
                    <p class="text-sm text-gray-500">Exhibits</p>
                  </div>
                </div>

                <!-- Warning if no approved drafts -->
                <div v-if="casesStore.drafts.length > 0 && approvedDraftsCount === 0" class="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <ExclamationTriangleIcon class="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p class="text-sm text-amber-700">
                    No drafts have been approved yet. The export will use AI-generated or edited content. Consider approving drafts before exporting.
                  </p>
                </div>

                <!-- Warning if no sections -->
                <div v-if="casesStore.rfeSections.length === 0" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <ExclamationTriangleIcon class="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p class="text-sm text-red-700">
                    No RFE sections have been analyzed yet. Run the analysis first before exporting.
                  </p>
                </div>
              </div>

              <!-- Format Selection & Download -->
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Download Response Package</h3>
                <p class="text-sm text-gray-500 mb-6">
                  Generate and download the complete RFE response including cover page, all response sections, and exhibit list.
                </p>

                <!-- Format options -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <label
                    class="relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                    :class="exportFormat === 'pdf' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'"
                  >
                    <input type="radio" v-model="exportFormat" value="pdf" class="mt-1" />
                    <div>
                      <p class="font-medium text-gray-900">PDF Document</p>
                      <p class="text-sm text-gray-500">Response letter only. Best for final submission.</p>
                    </div>
                  </label>
                  <label
                    class="relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                    :class="exportFormat === 'docx' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'"
                  >
                    <input type="radio" v-model="exportFormat" value="docx" class="mt-1" />
                    <div>
                      <p class="font-medium text-gray-900">Word Document</p>
                      <p class="text-sm text-gray-500">Editable response letter. Best for attorney review.</p>
                    </div>
                  </label>
                  <label
                    class="relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                    :class="exportFormat === 'zip' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'"
                  >
                    <input type="radio" v-model="exportFormat" value="zip" class="mt-1" />
                    <div>
                      <p class="font-medium text-gray-900">Full Package (ZIP)</p>
                      <p class="text-sm text-gray-500">Response PDF + all exhibit documents in one download.</p>
                    </div>
                  </label>
                </div>

                <!-- Download button -->
                <button
                  @click="handleExport"
                  :disabled="casesStore.exporting || casesStore.rfeSections.length === 0"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDownTrayIcon v-if="!casesStore.exporting" class="h-5 w-5" />
                  <ArrowPathIcon v-else class="h-5 w-5 animate-spin" />
                  {{ casesStore.exporting ? 'Generating...' : `Download ${exportFormat.toUpperCase()}` }}
                </button>
              </div>

              <!-- Export contents preview -->
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Package Contents</h3>
                <ul class="space-y-3 text-sm text-gray-700">
                  <li class="flex items-center gap-2">
                    <CheckIcon class="h-4 w-4 text-green-500" />
                    Cover page with case details and firm information
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="h-4 w-4 text-green-500" />
                    Table of contents
                  </li>
                  <li class="flex items-center gap-2">
                    <component :is="casesStore.rfeSections.length > 0 ? CheckIcon : ExclamationTriangleIcon"
                      :class="casesStore.rfeSections.length > 0 ? 'h-4 w-4 text-green-500' : 'h-4 w-4 text-amber-500'" />
                    {{ casesStore.rfeSections.length }} response section{{ casesStore.rfeSections.length !== 1 ? 's' : '' }} with legal arguments
                  </li>
                  <li class="flex items-center gap-2">
                    <component :is="casesStore.exhibits.length > 0 ? CheckIcon : ExclamationTriangleIcon"
                      :class="casesStore.exhibits.length > 0 ? 'h-4 w-4 text-green-500' : 'h-4 w-4 text-amber-500'" />
                    Exhibit list ({{ casesStore.exhibits.length }} exhibit{{ casesStore.exhibits.length !== 1 ? 's' : '' }})
                  </li>
                </ul>
              </div>

              <!-- Last exported -->
              <div v-if="currentCase?.exported_at" class="text-sm text-gray-500">
                Last exported: {{ new Date(currentCase.exported_at).toLocaleString() }}
              </div>
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
