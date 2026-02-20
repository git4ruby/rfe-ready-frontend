<script setup>
import { ref, watch, computed } from 'vue'
import { useKnowledgeStore } from '../stores/knowledge'
import { useNotificationStore } from '../stores/notification'
import { useQueryFilters } from '../composables/useQueryFilters'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
} from '@heroicons/vue/24/outline'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import PaginationBar from '../components/PaginationBar.vue'
import EmptyState from '../components/EmptyState.vue'

const store = useKnowledgeStore()
const notify = useNotificationStore()

// Filters via URL query params
const searchQuery = ref('')

const docTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'template', label: 'Template' },
  { value: 'sample_response', label: 'Sample Response' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'firm_knowledge', label: 'Firm Knowledge' },
]

const visaTypeOptions = [
  { value: '', label: 'All Visa Types' },
  { value: 'H-1B', label: 'H-1B' },
  { value: 'L-1', label: 'L-1' },
  { value: 'O-1', label: 'O-1' },
  { value: 'EB-1', label: 'EB-1' },
  { value: 'EB-2', label: 'EB-2' },
  { value: 'EB-3', label: 'EB-3' },
]

const rfeCategoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'specialty_occupation', label: 'Specialty Occupation' },
  { value: 'beneficiary_qualifications', label: 'Beneficiary Qualifications' },
  { value: 'employer_employee_relationship', label: 'Employer-Employee Relationship' },
  { value: 'maintenance_of_status', label: 'Maintenance of Status' },
  { value: 'itinerary', label: 'Itinerary' },
  { value: 'other', label: 'Other' },
]

// Modal state
const showModal = ref(false)
const editingDoc = ref(null)
const saving = ref(false)
const formErrors = ref({})

const form = ref({
  title: '',
  doc_type: 'regulation',
  visa_type: '',
  rfe_category: '',
  content: '',
  is_active: true,
})
const fileInput = ref(null)
const selectedFile = ref(null)

// Delete confirmation
const showDeleteConfirm = ref(false)
const deletingDoc = ref(null)
const deleting = ref(false)

// Detail view
const expandedDocId = ref(null)
const expandedDoc = ref(null)
const loadingDetail = ref(false)

// Bulk upload
const showBulkModal = ref(false)
const bulkFiles = ref([])
const bulkDocType = ref('firm_knowledge')
const bulkVisaType = ref('')
const bulkUploading = ref(false)
const bulkFileInput = ref(null)
const bulkDragOver = ref(false)

// Load docs
async function loadDocs(page = 1) {
  try {
    await store.fetchDocs(
      {
        q: searchQuery.value.trim() || undefined,
        doc_type: filters.value.doc_type || undefined,
        visa_type: filters.value.visa_type || undefined,
      },
      page
    )
  } catch {
    notify.error('Failed to load knowledge documents.')
  }
}

const { filters, currentPage, goToPage } = useQueryFilters(
  { doc_type: '', visa_type: '' },
  { onLoad: loadDocs }
)

// Debounced server-side search
let searchTimer = null
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => goToPage(1), 300)
})

// Re-fetch when filters change
watch([() => filters.value.doc_type, () => filters.value.visa_type], () => {
  goToPage(1)
})

// Bulk upload functions
function openBulkUpload() {
  bulkFiles.value = []
  bulkDocType.value = 'firm_knowledge'
  bulkVisaType.value = ''
  showBulkModal.value = true
}

function onBulkFileSelect(event) {
  const files = Array.from(event.target.files || [])
  bulkFiles.value.push(...files)
  if (bulkFileInput.value) bulkFileInput.value.value = ''
}

function onBulkDrop(event) {
  bulkDragOver.value = false
  const files = Array.from(event.dataTransfer.files || [])
  bulkFiles.value.push(...files)
}

function removeBulkFile(index) {
  bulkFiles.value.splice(index, 1)
}

async function handleBulkUpload() {
  if (bulkFiles.value.length === 0) return
  bulkUploading.value = true
  try {
    const formData = new FormData()
    bulkFiles.value.forEach((file) => formData.append('files[]', file))
    formData.append('doc_type', bulkDocType.value)
    if (bulkVisaType.value) formData.append('visa_type', bulkVisaType.value)

    const result = await store.bulkCreate(formData)
    notify.success(`${result.meta.count} document(s) uploaded successfully.`)
    showBulkModal.value = false
    loadDocs(1)
  } catch (err) {
    const msg = err.response?.data?.error || 'Failed to upload documents.'
    notify.error(msg)
  } finally {
    bulkUploading.value = false
  }
}

// Open modal for create
function openCreate() {
  editingDoc.value = null
  form.value = {
    title: '',
    doc_type: 'regulation',
    visa_type: '',
    rfe_category: '',
    content: '',
    is_active: true,
  }
  selectedFile.value = null
  formErrors.value = {}
  showModal.value = true
}

// Open modal for edit
async function openEdit(doc) {
  editingDoc.value = doc
  formErrors.value = {}
  selectedFile.value = null

  // Fetch full detail to get content
  try {
    loadingDetail.value = true
    const full = await store.fetchDoc(doc.id)
    form.value = {
      title: full.title || '',
      doc_type: full.doc_type || 'regulation',
      visa_type: full.visa_type || '',
      rfe_category: full.rfe_category || '',
      content: full.content || '',
      is_active: full.is_active ?? true,
    }
    showModal.value = true
  } catch {
    notify.error('Failed to load document details.')
  } finally {
    loadingDetail.value = false
  }
}

function onFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

function removeSelectedFile() {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function validateForm() {
  const errs = {}
  if (!form.value.title.trim()) errs.title = 'Title is required'
  if (!form.value.doc_type) errs.doc_type = 'Document type is required'
  formErrors.value = errs
  return Object.keys(errs).length === 0
}

async function handleSave() {
  if (!validateForm()) return

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('knowledge_doc[title]', form.value.title)
    formData.append('knowledge_doc[doc_type]', form.value.doc_type)
    formData.append('knowledge_doc[content]', form.value.content)
    formData.append('knowledge_doc[is_active]', form.value.is_active)
    if (form.value.visa_type) formData.append('knowledge_doc[visa_type]', form.value.visa_type)
    if (form.value.rfe_category) formData.append('knowledge_doc[rfe_category]', form.value.rfe_category)
    if (selectedFile.value) formData.append('knowledge_doc[file]', selectedFile.value)

    if (editingDoc.value) {
      await store.updateDoc(editingDoc.value.id, formData)
      notify.success('Document updated successfully.')
    } else {
      await store.createDoc(formData)
      notify.success('Document created successfully.')
    }
    showModal.value = false
  } catch (err) {
    const msg =
      err.response?.data?.errors?.join(', ') ||
      err.response?.data?.error ||
      'Failed to save document.'
    notify.error(msg)
  } finally {
    saving.value = false
  }
}

// Delete
function confirmDelete(doc) {
  deletingDoc.value = doc
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingDoc.value) return
  deleting.value = true
  try {
    const docId = deletingDoc.value.id
    await store.deleteDoc(docId)
    notify.success('Document deleted.')
    showDeleteConfirm.value = false
    deletingDoc.value = null
    // Collapse if expanded
    if (expandedDocId.value === docId) {
      expandedDocId.value = null
      expandedDoc.value = null
    }
  } catch {
    notify.error('Failed to delete document.')
  } finally {
    deleting.value = false
  }
}

// Expand/collapse detail
async function toggleExpand(doc) {
  if (expandedDocId.value === doc.id) {
    expandedDocId.value = null
    expandedDoc.value = null
    return
  }
  expandedDocId.value = doc.id
  try {
    loadingDetail.value = true
    expandedDoc.value = await store.fetchDoc(doc.id)
  } catch {
    notify.error('Failed to load document details.')
    expandedDocId.value = null
  } finally {
    loadingDetail.value = false
  }
}

// Badge helpers
function docTypeBadgeClass(docType) {
  const classes = {
    template: 'bg-blue-100 text-blue-800',
    sample_response: 'bg-green-100 text-green-800',
    regulation: 'bg-amber-100 text-amber-800',
    firm_knowledge: 'bg-purple-100 text-purple-800',
  }
  return classes[docType] || 'bg-gray-100 text-gray-800'
}

function docTypeLabel(docType) {
  const labels = {
    template: 'Template',
    sample_response: 'Sample Response',
    regulation: 'Regulation',
    firm_knowledge: 'Firm Knowledge',
  }
  return labels[docType] || docType
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Stats helpers
const knowledgeStats = computed(() => {
  if (!store.stats) return []
  return [
    { name: 'Total Documents', value: store.stats.total_docs || 0, icon: BookOpenIcon, color: 'bg-indigo-500' },
    { name: 'Embedded (AI Ready)', value: store.stats.embedded_count || 0, icon: CpuChipIcon, color: 'bg-emerald-500' },
    { name: 'Pending Embedding', value: store.stats.pending_count || 0, icon: DocumentTextIcon, color: 'bg-gray-400' },
  ]
})

const docTypeBreakdown = computed(() => store.stats?.by_doc_type || {})

function statDocTypeLabel(key) {
  const labels = { template: 'Templates', sample_response: 'Sample Responses', regulation: 'Regulations', firm_knowledge: 'Firm Knowledge' }
  return labels[key] || key
}

function statDocTypeColor(key) {
  const colors = { template: 'bg-blue-500', sample_response: 'bg-green-500', regulation: 'bg-amber-500', firm_knowledge: 'bg-purple-500' }
  return colors[key] || 'bg-gray-500'
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p class="mt-1 text-sm text-gray-500">
          Upload and manage firm-specific templates, sample responses, and regulatory documents.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="openBulkUpload"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowUpTrayIcon class="h-5 w-5" />
          Bulk Upload
        </button>
        <button
          @click="openCreate"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          Add Document
        </button>
      </div>
    </div>

    <!-- Knowledge Stats -->
    <div v-if="store.stats" class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
      <div
        v-for="stat in knowledgeStats"
        :key="stat.name"
        class="bg-white rounded-lg shadow p-4 flex items-center gap-3"
      >
        <div :class="['rounded-lg p-2 shrink-0', stat.color]">
          <component :is="stat.icon" class="h-5 w-5 text-white" />
        </div>
        <div>
          <p class="text-xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-xs text-gray-500">{{ stat.name }}</p>
        </div>
      </div>

      <!-- By Type breakdown inline -->
      <div
        v-for="(count, type) in docTypeBreakdown"
        :key="type"
        class="bg-white rounded-lg shadow p-4 flex items-center gap-3"
      >
        <div :class="['rounded-lg p-2 shrink-0', statDocTypeColor(type)]">
          <DocumentTextIcon class="h-5 w-5 text-white" />
        </div>
        <div>
          <p class="text-xl font-bold text-gray-900">{{ count }}</p>
          <p class="text-xs text-gray-500">{{ statDocTypeLabel(type) }}</p>
        </div>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          data-shortcut="search"
          placeholder="Search by title... (press /)"
          class="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <select
        v-model="filters.doc_type"
        class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option v-for="opt in docTypeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <select
        v-model="filters.visa_type"
        class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option v-for="opt in visaTypeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="store.loading && !showModal" variant="card" :rows="6" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="!store.loading && store.docs.length === 0"
      title="No knowledge documents yet"
      description="Add your first document to build your knowledge base. Upload templates, sample responses, regulations, and firm knowledge for AI-powered draft generation."
      :icon="BookOpenIcon"
    >
      <template #action>
        <button
          @click="openCreate"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          Add Document
        </button>
      </template>
    </EmptyState>

    <!-- Documents list -->
    <div v-else>
      <!-- Mobile card layout -->
      <div class="md:hidden space-y-3">
        <div
          v-for="doc in store.docs"
          :key="'m-' + doc.id"
          class="bg-white shadow rounded-lg p-4 cursor-pointer"
          @click="toggleExpand(doc)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900">{{ doc.title }}</p>
              <div v-if="doc.file_name" class="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <PaperClipIcon class="h-3 w-3" />
                {{ doc.file_name }}
              </div>
            </div>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
              :class="docTypeBadgeClass(doc.doc_type)"
            >
              {{ docTypeLabel(doc.doc_type) }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span
              v-if="doc.embedding_status === 'embedded'"
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              Embedded
            </span>
            <span v-else class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
              Pending
            </span>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="doc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
            >
              {{ doc.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <!-- Expanded content -->
          <div v-if="expandedDocId === doc.id" class="mt-3 pt-3 border-t border-gray-100">
            <div v-if="loadingDetail" class="text-sm text-gray-500">Loading...</div>
            <div v-else-if="expandedDoc">
              <div v-if="expandedDoc.content" class="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">{{ expandedDoc.content }}</div>
              <p v-else class="text-sm text-gray-400 italic">No text content.</p>
              <div v-if="doc.file_name" class="mt-3 flex items-center gap-2">
                <PaperClipIcon class="h-4 w-4 text-gray-400" />
                <a
                  :href="doc.file_url"
                  target="_blank"
                  class="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                  @click.stop
                >
                  Download {{ doc.file_name }}
                </a>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-100" @click.stop>
            <button @click="openEdit(doc)" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">Edit</button>
            <button @click="confirmDelete(doc)" class="text-sm font-medium text-red-600 hover:text-red-500">Delete</button>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visa
                </th>
                <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded By
                </th>
                <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="doc in store.docs" :key="doc.id">
                <tr
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="toggleExpand(doc)"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <DocumentTextIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ doc.title }}</div>
                        <div v-if="doc.file_name" class="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <PaperClipIcon class="h-3 w-3" />
                          {{ doc.file_name }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="docTypeBadgeClass(doc.doc_type)"
                    >
                      {{ docTypeLabel(doc.doc_type) }}
                    </span>
                  </td>
                  <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ doc.visa_type || '--' }}
                  </td>
                  <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ doc.rfe_category || '--' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ doc.uploaded_by_name || '--' }}
                  </td>
                  <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(doc.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="doc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                    >
                      {{ doc.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      v-if="doc.embedding_status === 'embedded'"
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800"
                      title="Embedded for AI retrieval"
                    >
                      Embedded
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500"
                      title="Pending embedding generation"
                    >
                      Pending
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right" @click.stop>
                    <div class="flex items-center justify-end gap-2">
                      <button
                        @click="openEdit(doc)"
                        class="text-indigo-600 hover:text-indigo-500 transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon class="h-4 w-4" />
                      </button>
                      <button
                        @click="confirmDelete(doc)"
                        class="text-red-600 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Expanded detail row -->
                <tr v-if="expandedDocId === doc.id">
                  <td colspan="9" class="px-6 py-4 bg-gray-50">
                    <div v-if="loadingDetail" class="text-sm text-gray-500">Loading...</div>
                    <div v-else-if="expandedDoc">
                      <div v-if="expandedDoc.content" class="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{{ expandedDoc.content }}</div>
                      <p v-else class="text-sm text-gray-400 italic">No text content.</p>
                      <div v-if="doc.file_name" class="mt-3 flex items-center gap-2">
                        <PaperClipIcon class="h-4 w-4 text-gray-400" />
                        <a
                          :href="doc.file_url"
                          target="_blank"
                          class="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                        >
                          {{ doc.file_name }}
                        </a>
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

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showModal = false" />

        <!-- Modal panel -->
        <div class="relative w-full max-w-2xl transform rounded-xl bg-white shadow-2xl transition-all">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingDoc ? 'Edit Document' : 'Add Document' }}
            </h3>
            <button
              @click="showModal = false"
              class="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <form @submit.prevent="handleSave" class="p-6 space-y-5">
            <!-- Title -->
            <div>
              <label for="doc-title" class="block text-sm font-medium text-gray-700">
                Title <span class="text-red-500">*</span>
              </label>
              <input
                id="doc-title"
                v-model="form.title"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. 8 CFR 214.2(h) - H-1B Specialty Occupation"
              />
              <p v-if="formErrors.title" class="mt-1 text-sm text-red-600">{{ formErrors.title }}</p>
            </div>

            <!-- Doc type and Visa type row -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label for="doc-type" class="block text-sm font-medium text-gray-700">
                  Document Type <span class="text-red-500">*</span>
                </label>
                <select
                  id="doc-type"
                  v-model="form.doc_type"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="template">Template</option>
                  <option value="sample_response">Sample Response</option>
                  <option value="regulation">Regulation</option>
                  <option value="firm_knowledge">Firm Knowledge</option>
                </select>
                <p v-if="formErrors.doc_type" class="mt-1 text-sm text-red-600">{{ formErrors.doc_type }}</p>
              </div>
              <div>
                <label for="doc-visa" class="block text-sm font-medium text-gray-700">
                  Visa Type
                </label>
                <select
                  id="doc-visa"
                  v-model="form.visa_type"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">None</option>
                  <option value="H-1B">H-1B</option>
                  <option value="L-1">L-1</option>
                  <option value="O-1">O-1</option>
                  <option value="EB-1">EB-1</option>
                  <option value="EB-2">EB-2</option>
                  <option value="EB-3">EB-3</option>
                </select>
              </div>
            </div>

            <!-- RFE Category -->
            <div>
              <label for="doc-category" class="block text-sm font-medium text-gray-700">
                RFE Category
              </label>
              <select
                id="doc-category"
                v-model="form.rfe_category"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">None</option>
                <option v-for="opt in rfeCategoryOptions.slice(1)" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Content -->
            <div>
              <label for="doc-content" class="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="doc-content"
                v-model="form.content"
                rows="8"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Paste text content here (regulations, templates, etc.)..."
              />
            </div>

            <!-- File upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700">
                File Attachment
              </label>
              <div class="mt-1">
                <div v-if="editingDoc?.file_name && !selectedFile" class="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <PaperClipIcon class="h-4 w-4" />
                  <span>Current: {{ editingDoc.file_name }}</span>
                </div>
                <div v-if="selectedFile" class="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <PaperClipIcon class="h-4 w-4" />
                  <span>{{ selectedFile.name }}</span>
                  <button
                    type="button"
                    @click="removeSelectedFile"
                    class="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon class="h-4 w-4" />
                  </button>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.rtf"
                  @change="onFileSelect"
                  class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p class="mt-1 text-xs text-gray-500">PDF, DOC, DOCX, TXT, or RTF. Optional.</p>
              </div>
            </div>

            <!-- Active toggle -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="form.is_active = !form.is_active"
                :class="[
                  form.is_active ? 'bg-indigo-600' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                ]"
                role="switch"
                :aria-checked="form.is_active"
              >
                <span
                  :class="[
                    form.is_active ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  ]"
                />
              </button>
              <span class="text-sm font-medium text-gray-700">
                {{ form.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="showModal = false"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  v-if="saving"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ saving ? 'Saving...' : (editingDoc ? 'Update Document' : 'Create Document') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Document"
      :message="`Are you sure you want to delete &quot;${deletingDoc?.title}&quot;? This action cannot be undone.`"
      confirm-label="Delete"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Bulk Upload Modal -->
    <div v-if="showBulkModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showBulkModal = false" />

        <div class="relative w-full max-w-lg transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">Bulk Upload Documents</h3>
            <button @click="showBulkModal = false" class="text-gray-400 hover:text-gray-500 transition-colors">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Drop zone -->
            <div
              @dragover.prevent="bulkDragOver = true"
              @dragleave="bulkDragOver = false"
              @drop.prevent="onBulkDrop"
              :class="[
                'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                bulkDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400',
              ]"
            >
              <CloudArrowUpIcon class="mx-auto h-10 w-10 text-gray-400" />
              <p class="mt-2 text-sm text-gray-600">
                <button type="button" @click="bulkFileInput?.click()" class="font-semibold text-indigo-600 hover:text-indigo-500">
                  Choose files
                </button>
                or drag and drop
              </p>
              <p class="mt-1 text-xs text-gray-500">PDF, DOC, DOCX, TXT, RTF</p>
              <input
                ref="bulkFileInput"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.rtf"
                class="hidden"
                @change="onBulkFileSelect"
              />
            </div>

            <!-- File list -->
            <div v-if="bulkFiles.length > 0" class="space-y-2">
              <div class="text-sm font-medium text-gray-700">{{ bulkFiles.length }} file(s) selected</div>
              <div
                v-for="(file, index) in bulkFiles"
                :key="index"
                class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <PaperClipIcon class="h-4 w-4 text-gray-400 shrink-0" />
                  <span class="text-sm text-gray-700 truncate">{{ file.name }}</span>
                  <span class="text-xs text-gray-400 shrink-0">{{ (file.size / 1024).toFixed(0) }} KB</span>
                </div>
                <button @click="removeBulkFile(index)" class="text-red-500 hover:text-red-700 shrink-0 ml-2">
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Shared metadata -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">Document Type</label>
                <select
                  v-model="bulkDocType"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="template">Template</option>
                  <option value="sample_response">Sample Response</option>
                  <option value="regulation">Regulation</option>
                  <option value="firm_knowledge">Firm Knowledge</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Visa Type</label>
                <select
                  v-model="bulkVisaType"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">None</option>
                  <option value="H-1B">H-1B</option>
                  <option value="L-1">L-1</option>
                  <option value="O-1">O-1</option>
                  <option value="EB-1">EB-1</option>
                  <option value="EB-2">EB-2</option>
                  <option value="EB-3">EB-3</option>
                </select>
              </div>
            </div>

            <!-- Footer -->
            <!-- Upload progress bar -->
            <div v-if="bulkUploading" class="pt-3">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-600">Uploading...</span>
                <span class="font-medium text-indigo-600">{{ store.uploadProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: store.uploadProgress + '%' }"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                @click="showBulkModal = false"
                :disabled="bulkUploading"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                @click="handleBulkUpload"
                :disabled="bulkUploading || bulkFiles.length === 0"
                class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ bulkUploading ? `Uploading ${store.uploadProgress}%...` : `Upload ${bulkFiles.length} File(s)` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
