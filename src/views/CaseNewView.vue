<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCasesStore } from '../stores/cases'
import { useNotificationStore } from '../stores/notification'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const casesStore = useCasesStore()
const notify = useNotificationStore()

const loading = ref(false)
const errors = ref({})

const form = ref({
  case_number: '',
  uscis_receipt_number: '',
  visa_type: 'H-1B',
  petitioner_name: '',
  beneficiary_name: '',
  rfe_received_date: '',
  rfe_deadline: '',
  notes: '',
})

function validate() {
  const errs = {}
  if (!form.value.case_number.trim()) errs.case_number = 'Case number is required'
  if (!form.value.petitioner_name.trim()) errs.petitioner_name = 'Petitioner name is required'
  if (!form.value.beneficiary_name.trim()) errs.beneficiary_name = 'Beneficiary name is required'
  if (!form.value.rfe_received_date) errs.rfe_received_date = 'Received date is required'
  if (!form.value.rfe_deadline) errs.rfe_deadline = 'Deadline is required'
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  try {
    const newCase = await casesStore.createCase(form.value)
    notify.success('Case created successfully!')
    router.push(`/cases/${newCase.id}`)
  } catch (err) {
    const msg =
      err.response?.data?.errors?.join(', ') ||
      err.response?.data?.error ||
      'Failed to create case. Please try again.'
    notify.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Back link -->
    <div class="mb-6">
      <router-link
        to="/cases"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeftIcon class="h-4 w-4" />
        Back to Cases
      </router-link>
    </div>

    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Create New Case</h1>
      <p class="mt-1 text-sm text-gray-500">Fill in the details for the new RFE case.</p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-white shadow rounded-lg">
      <div class="p-6 space-y-6">
        <!-- Case number and Receipt number row -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label for="case_number" class="block text-sm font-medium text-gray-700">
              Case Number <span class="text-red-500">*</span>
            </label>
            <input
              id="case_number"
              v-model="form.case_number"
              type="text"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g. RFE-2026-001"
            />
            <p v-if="errors.case_number" class="mt-1 text-sm text-red-600">
              {{ errors.case_number }}
            </p>
          </div>

          <div>
            <label for="uscis_receipt_number" class="block text-sm font-medium text-gray-700">
              USCIS Receipt Number
            </label>
            <input
              id="uscis_receipt_number"
              v-model="form.uscis_receipt_number"
              type="text"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g. EAC-26-123-45678"
            />
          </div>
        </div>

        <!-- Visa Type -->
        <div>
          <label for="visa_type" class="block text-sm font-medium text-gray-700">
            Visa Type <span class="text-red-500">*</span>
          </label>
          <select
            id="visa_type"
            v-model="form.visa_type"
            class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="H-1B">H-1B</option>
          </select>
        </div>

        <!-- Petitioner and Beneficiary row -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label for="petitioner_name" class="block text-sm font-medium text-gray-700">
              Petitioner Name <span class="text-red-500">*</span>
            </label>
            <input
              id="petitioner_name"
              v-model="form.petitioner_name"
              type="text"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Company or organization name"
            />
            <p v-if="errors.petitioner_name" class="mt-1 text-sm text-red-600">
              {{ errors.petitioner_name }}
            </p>
          </div>

          <div>
            <label for="beneficiary_name" class="block text-sm font-medium text-gray-700">
              Beneficiary Name <span class="text-red-500">*</span>
            </label>
            <input
              id="beneficiary_name"
              v-model="form.beneficiary_name"
              type="text"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Full name of the beneficiary"
            />
            <p v-if="errors.beneficiary_name" class="mt-1 text-sm text-red-600">
              {{ errors.beneficiary_name }}
            </p>
          </div>
        </div>

        <!-- Dates row -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label for="rfe_received_date" class="block text-sm font-medium text-gray-700">
              RFE Received Date <span class="text-red-500">*</span>
            </label>
            <input
              id="rfe_received_date"
              v-model="form.rfe_received_date"
              type="date"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p v-if="errors.rfe_received_date" class="mt-1 text-sm text-red-600">
              {{ errors.rfe_received_date }}
            </p>
          </div>

          <div>
            <label for="rfe_deadline" class="block text-sm font-medium text-gray-700">
              RFE Deadline <span class="text-red-500">*</span>
            </label>
            <input
              id="rfe_deadline"
              v-model="form.rfe_deadline"
              type="date"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p v-if="errors.rfe_deadline" class="mt-1 text-sm text-red-600">
              {{ errors.rfe_deadline }}
            </p>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="4"
            class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Any additional notes about this case..."
          />
        </div>
      </div>

      <!-- Form footer -->
      <div class="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg border-t border-gray-200">
        <router-link
          to="/cases"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </router-link>
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            v-if="loading"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ loading ? 'Creating...' : 'Create Case' }}
        </button>
      </div>
    </form>
  </div>
</template>
