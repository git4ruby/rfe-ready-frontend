<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import apiClient from '../../api/client'
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const emit = defineEmits(['close', 'imported'])

const file = ref(null)
const dragOver = ref(false)
const uploading = ref(false)
const results = ref(null)
const error = ref(null)

function onFileSelect(event) {
  const selected = event.target.files[0]
  if (selected && selected.type === 'text/csv') {
    file.value = selected
    error.value = null
  } else {
    error.value = t('import.invalidFileType')
  }
}

function onDrop(event) {
  dragOver.value = false
  const dropped = event.dataTransfer.files[0]
  if (dropped && (dropped.type === 'text/csv' || dropped.name.endsWith('.csv'))) {
    file.value = dropped
    error.value = null
  } else {
    error.value = t('import.invalidFileType')
  }
}

function downloadTemplate() {
  const headers = 'case_number,visa_type,petitioner_name,beneficiary_name,uscis_receipt_number,rfe_received_date,rfe_deadline,notes'
  const example = 'RFE-2025-001,H-1B,Acme Corp,John Doe,WAC-XX-XXX-XXXXX,2025-01-15,2025-04-15,Sample notes'
  const csv = headers + '\n' + example + '\n'
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rfe_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function uploadFile() {
  if (!file.value) return
  uploading.value = true
  error.value = null
  results.value = null
  try {
    const formData = new FormData()
    formData.append('file', file.value)
    const response = await apiClient.post('/imports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    results.value = response.data.data
    if (results.value.imported > 0) {
      emit('imported')
    }
  } catch (err) {
    error.value = err.response?.data?.error || t('import.uploadFailed')
  } finally {
    uploading.value = false
  }
}

function reset() {
  file.value = null
  results.value = null
  error.value = null
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">{{ t('import.title') }}</h2>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-500">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <div class="px-6 py-4 space-y-4">
        <!-- Results display -->
        <div v-if="results" class="space-y-4">
          <div class="flex items-center gap-3 p-4 rounded-lg" :class="results.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'">
            <CheckCircleIcon v-if="results.failed === 0" class="h-6 w-6 text-green-500" />
            <ExclamationCircleIcon v-else class="h-6 w-6 text-yellow-500" />
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ t('import.importedCount', { count: results.imported }) }}
              </p>
              <p v-if="results.failed > 0" class="text-sm text-gray-500">
                {{ t('import.failedCount', { count: results.failed }) }}
              </p>
            </div>
          </div>

          <!-- Error details -->
          <div v-if="results.errors && results.errors.length > 0" class="space-y-2">
            <p class="text-sm font-medium text-gray-700">{{ t('import.errorDetails') }}</p>
            <div class="max-h-40 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-3">
              <p v-for="(err, idx) in results.errors" :key="idx" class="text-xs text-red-600 mb-1">
                {{ t('import.rowError', { row: err.row }) }}: {{ err.message }}
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button @click="reset" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {{ t('import.importAnother') }}
            </button>
            <button @click="emit('close')" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              {{ t('common.close') }}
            </button>
          </div>
        </div>

        <!-- Upload form -->
        <template v-else>
          <p class="text-sm text-gray-500">{{ t('import.description') }}</p>

          <!-- Download template -->
          <button @click="downloadTemplate" class="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            <DocumentArrowDownIcon class="h-4 w-4" />
            {{ t('import.downloadTemplate') }}
          </button>

          <!-- Drop zone -->
          <div
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            ]"
            @click="$refs.fileInput.click()"
          >
            <CloudArrowUpIcon class="mx-auto h-10 w-10 text-gray-400" />
            <p class="mt-2 text-sm text-gray-600">
              {{ file ? file.name : t('import.dropZone') }}
            </p>
            <p v-if="!file" class="mt-1 text-xs text-gray-400">{{ t('import.csvOnly') }}</p>
            <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="onFileSelect" />
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button @click="emit('close')" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {{ t('common.cancel') }}
            </button>
            <button
              @click="uploadFile"
              :disabled="!file || uploading"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ uploading ? t('import.uploading') : t('import.upload') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
