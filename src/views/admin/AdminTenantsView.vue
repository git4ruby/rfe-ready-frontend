<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useNotificationStore } from '../../stores/notification'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const store = useAdminStore()
const notify = useNotificationStore()

const searchQuery = ref('')
const filterStatus = ref('')
const filterPlan = ref('')
const currentPage = ref(1)

const planOptions = [
  { value: '', label: 'All Plans' },
  { value: 'trial', label: 'Trial' },
  { value: 'basic', label: 'Basic' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Create modal
const showCreateModal = ref(false)
const creating = ref(false)
const createForm = ref({ name: '', plan: 'trial', data_retention_days: 30 })
const createErrors = ref({})

// Delete confirm
const showDeleteConfirm = ref(false)
const deletingTenant = ref(null)
const deleting = ref(false)

async function loadTenants(page = 1) {
  currentPage.value = page
  const params = { page }
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (filterStatus.value) params.status = filterStatus.value
  if (filterPlan.value) params.plan = filterPlan.value
  await store.fetchTenants(params)
}

onMounted(() => loadTenants())

let searchTimer = null
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadTenants(1), 300)
})

watch([filterStatus, filterPlan], () => loadTenants(1))

function openCreate() {
  createForm.value = { name: '', plan: 'trial', data_retention_days: 30 }
  createErrors.value = {}
  showCreateModal.value = true
}

async function handleCreate() {
  createErrors.value = {}
  if (!createForm.value.name.trim()) {
    createErrors.value.name = 'Name is required'
    return
  }
  creating.value = true
  try {
    await store.createTenant(createForm.value)
    notify.success('Tenant created successfully.')
    showCreateModal.value = false
    loadTenants(1)
  } catch (err) {
    const msg = err.response?.data?.details?.join(', ') || err.response?.data?.error || 'Failed to create tenant.'
    notify.error(msg)
  } finally {
    creating.value = false
  }
}

async function handleChangeStatus(tenant, newStatus) {
  try {
    await store.changeTenantStatus(tenant.id, newStatus)
    notify.success(`Tenant ${newStatus}.`)
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to change status.')
  }
}

async function handleChangePlan(tenant, newPlan) {
  try {
    await store.changeTenantPlan(tenant.id, newPlan)
    notify.success(`Plan changed to ${newPlan}.`)
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to change plan.')
  }
}

function confirmDelete(tenant) {
  deletingTenant.value = tenant
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingTenant.value) return
  deleting.value = true
  try {
    await store.deleteTenant(deletingTenant.value.id)
    notify.success('Tenant deleted.')
    showDeleteConfirm.value = false
    deletingTenant.value = null
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to delete tenant.')
  } finally {
    deleting.value = false
  }
}

function planColor(plan) {
  const colors = { trial: 'bg-gray-100 text-gray-800', basic: 'bg-blue-100 text-blue-800', professional: 'bg-purple-100 text-purple-800', enterprise: 'bg-amber-100 text-amber-800' }
  return colors[plan] || 'bg-gray-100 text-gray-800'
}

function statusColor(status) {
  const colors = { active: 'bg-green-100 text-green-800', suspended: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-600' }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <p class="mt-1 text-sm text-gray-500">Manage organizations using the RFE Ready platform.</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
      >
        <PlusIcon class="h-5 w-5" />
        Create Tenant
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name..."
          class="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
        />
      </div>
      <select v-model="filterPlan" class="rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
        <option v-for="opt in planOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select v-model="filterStatus" class="rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <LoadingSpinner v-if="store.tenantsLoading" />

    <template v-else>
      <!-- Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div v-if="store.tenants.length === 0" class="p-6 text-center text-sm text-gray-400">
          No tenants found.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="tenant in store.tenants" :key="tenant.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <router-link :to="`/platform/tenants/${tenant.id}`" class="text-indigo-600 hover:text-indigo-500 hover:underline">
                    {{ tenant.name }}
                  </router-link>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{{ tenant.slug }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    :value="tenant.plan"
                    @change="handleChangePlan(tenant, $event.target.value)"
                    class="rounded-md border-gray-300 text-xs py-1 focus:border-red-500 focus:ring-red-500"
                  >
                    <option value="trial">Trial</option>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    :value="tenant.status"
                    @change="handleChangeStatus(tenant, $event.target.value)"
                    class="rounded-md border-gray-300 text-xs py-1 focus:border-red-500 focus:ring-red-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(tenant.created_at) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex items-center justify-center gap-2">
                    <router-link
                      :to="`/platform/tenants/${tenant.id}`"
                      class="text-indigo-600 hover:text-indigo-500 transition-colors"
                      title="View Details"
                    >
                      <EyeIcon class="h-4 w-4" />
                    </router-link>
                    <button
                      @click="confirmDelete(tenant)"
                      class="text-red-600 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="store.tenantsPagination?.total_pages > 1"
          class="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200"
        >
          <div class="text-sm text-gray-500">
            Page {{ store.tenantsPagination.current_page }} of {{ store.tenantsPagination.total_pages }}
          </div>
          <div class="flex gap-2">
            <button
              :disabled="store.tenantsPagination.current_page <= 1"
              @click="loadTenants(store.tenantsPagination.current_page - 1)"
              class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              :disabled="store.tenantsPagination.current_page >= store.tenantsPagination.total_pages"
              @click="loadTenants(store.tenantsPagination.current_page + 1)"
              class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Tenant Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showCreateModal = false" />
        <div class="relative w-full max-w-md transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">Create Tenant</h3>
            <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-500">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <form @submit.prevent="handleCreate" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Organization Name <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.name"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                placeholder="e.g. Pacific Visa Partners"
              />
              <p v-if="createErrors.name" class="mt-1 text-sm text-red-600">{{ createErrors.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Plan</label>
              <select v-model="createForm.plan" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                <option value="trial">Trial</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Data Retention (days)</label>
              <input
                v-model.number="createForm.data_retention_days"
                type="number"
                min="1"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" @click="showCreateModal = false" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ creating ? 'Creating...' : 'Create Tenant' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showDeleteConfirm = false" />
        <div class="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl transition-all">
          <h3 class="text-lg font-semibold text-gray-900">Delete Tenant</h3>
          <p class="mt-2 text-sm text-gray-500">
            Are you sure you want to delete "{{ deletingTenant?.name }}"? This will permanently remove all their data including cases, users, and documents. This action cannot be undone.
          </p>
          <div class="mt-5 flex items-center justify-end gap-3">
            <button @click="showDeleteConfirm = false" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
            <button
              @click="handleDelete"
              :disabled="deleting"
              class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ deleting ? 'Deleting...' : 'Delete Tenant' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
