<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useKnowledgeStore } from '../stores/knowledge'
import { useNotificationStore } from '../stores/notification'
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'

const store = useKnowledgeStore()
const notify = useNotificationStore()

// Filters
const filterDocType = ref('')
const filterVisaType = ref('')
const searchQuery = ref('')
const currentPage = ref(1)

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

// Filtered docs (client-side search on top of server-filtered results)
const filteredDocs = computed(() => {
  if (!searchQuery.value.trim()) return store.docs
  const q = searchQuery.value.toLowerCase()
  return store.docs.filter(
    (d) =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.visa_type || '').toLowerCase().includes(q) ||
      (d.rfe_category || '').toLowerCase().includes(q)
  )
})

// Load docs
async function loadDocs(page = 1) {
  currentPage.value = page
  try {
    await store.fetchDocs(
      {
        doc_type: filterDocType.value || undefined,
        visa_type: filterVisaType.value || undefined,
      },
      page
    )
  } catch {
    notify.error('Failed to load knowledge documents.')
  }
}

onMounted(() => loadDocs())

// Re-fetch when filters change
watch([filterDocType, filterVisaType], () => {
  loadDocs(1)
})

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

// Pagination
async function goToPage(page) {
  await loadDocs(page)
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
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        <PlusIcon class="h-5 w-5" />
        Add Document
      </button>
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
          placeholder="Search by title..."
          class="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <select
        v-model="filterDocType"
        class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option v-for="opt in docTypeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <select
        v-model="filterVisaType"
        class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option v-for="opt in visaTypeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="store.loading && !showModal" />

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

    <!-- Documents table -->
    <div v-else class="bg-white shadow rounded-lg overflow-hidden">
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visa
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded By
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="doc in filteredDocs" :key="doc.id">
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ doc.visa_type || '--' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ doc.rfe_category || '--' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ doc.uploaded_by_name || '--' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                <td colspan="8" class="px-6 py-4 bg-gray-50">
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

      <!-- Pagination -->
      <div
        v-if="store.pagination?.total_pages > 1"
        class="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200"
      >
        <div class="text-sm text-gray-500">
          Page {{ store.pagination.current_page }} of {{ store.pagination.total_pages }}
          ({{ store.pagination.total_count }} total)
        </div>
        <div class="flex gap-2">
          <button
            :disabled="store.pagination.current_page <= 1"
            @click="goToPage(store.pagination.current_page - 1)"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            :disabled="store.pagination.current_page >= store.pagination.total_pages"
            @click="goToPage(store.pagination.current_page + 1)"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
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

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showDeleteConfirm = false" />
        <div class="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl transition-all">
          <h3 class="text-lg font-semibold text-gray-900">Delete Document</h3>
          <p class="mt-2 text-sm text-gray-500">
            Are you sure you want to delete "{{ deletingDoc?.title }}"? This action cannot be undone.
          </p>
          <div class="mt-5 flex items-center justify-end gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              :disabled="deleting"
              class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
