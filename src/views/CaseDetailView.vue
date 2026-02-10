<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCasesStore } from '../stores/cases'
import { useNotificationStore } from '../stores/notification'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
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
const casesStore = useCasesStore()
const notify = useNotificationStore()

const activeTab = ref('overview')

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

const caseData = computed(() => {
  const c = casesStore.currentCase
  if (!c) return null
  // Handle both flat and JSON:API serialized responses
  return c.attributes || c
})
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
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          <div class="flex items-center gap-3">
            <DeadlineIndicator
              v-if="caseData.rfe_deadline"
              :deadline="caseData.rfe_deadline"
            />
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
                    <dd class="mt-0.5 text-sm text-gray-900">
                      {{ caseData.attorney_name || 'Not assigned' }}
                    </dd>
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
                Coming soon -- RFE Analysis will be available after file processing is implemented.
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
                Coming soon -- Checklist will be available after file processing is implemented.
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
                Coming soon -- Drafts will be available after file processing is implemented.
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
                Coming soon -- Exhibits will be available after file processing is implemented.
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
                Coming soon -- Export will be available after file processing is implemented.
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
