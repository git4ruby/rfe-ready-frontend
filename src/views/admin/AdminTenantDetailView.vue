<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
import { useNotificationStore } from '../../stores/notification'
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminStore()
const notify = useNotificationStore()

const loading = ref(true)
const tenantId = computed(() => route.params.id)

// Edit modal
const showEditModal = ref(false)
const saving = ref(false)
const editForm = ref({ name: '', data_retention_days: 30 })

// Create user modal
const showUserModal = ref(false)
const creatingUser = ref(false)
const userForm = ref({ first_name: '', last_name: '', email: '', password: '', role: 'admin' })
const userErrors = ref({})

async function loadTenant() {
  loading.value = true
  try {
    await store.fetchTenant(tenantId.value)
    await store.fetchTenantUsers(tenantId.value)
  } finally {
    loading.value = false
  }
}

onMounted(loadTenant)

function openEdit() {
  const t = store.currentTenant
  editForm.value = {
    name: t.name,
    data_retention_days: t.data_retention_days || 30,
  }
  showEditModal.value = true
}

async function handleEdit() {
  saving.value = true
  try {
    await store.updateTenant(tenantId.value, editForm.value)
    notify.success('Tenant updated.')
    showEditModal.value = false
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to update tenant.')
  } finally {
    saving.value = false
  }
}

async function handleChangeStatus(newStatus) {
  try {
    await store.changeTenantStatus(tenantId.value, newStatus)
    notify.success(`Tenant ${newStatus}.`)
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to change status.')
  }
}

async function handleChangePlan(newPlan) {
  try {
    await store.changeTenantPlan(tenantId.value, newPlan)
    notify.success(`Plan changed to ${newPlan}.`)
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to change plan.')
  }
}

function openCreateUser() {
  userForm.value = { first_name: '', last_name: '', email: '', password: '', role: 'admin' }
  userErrors.value = {}
  showUserModal.value = true
}

async function handleCreateUser() {
  userErrors.value = {}
  if (!userForm.value.first_name.trim()) { userErrors.value.first_name = 'Required'; return }
  if (!userForm.value.last_name.trim()) { userErrors.value.last_name = 'Required'; return }
  if (!userForm.value.email.trim()) { userErrors.value.email = 'Required'; return }
  if (!userForm.value.password || userForm.value.password.length < 6) { userErrors.value.password = 'Min 6 characters'; return }

  creatingUser.value = true
  try {
    await store.createTenantUser(tenantId.value, userForm.value)
    notify.success('User created successfully.')
    showUserModal.value = false
    store.fetchTenantUsers(tenantId.value)
  } catch (err) {
    const msg = err.response?.data?.details?.join(', ') || err.response?.data?.error || 'Failed to create user.'
    notify.error(msg)
  } finally {
    creatingUser.value = false
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

function roleColor(role) {
  const colors = { admin: 'bg-red-100 text-red-800', attorney: 'bg-blue-100 text-blue-800', paralegal: 'bg-purple-100 text-purple-800', viewer: 'bg-gray-100 text-gray-600' }
  return colors[role] || 'bg-gray-100 text-gray-800'
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div>
    <!-- Back link -->
    <button @click="router.push('/platform/tenants')" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
      <ArrowLeftIcon class="h-4 w-4" />
      Back to Tenants
    </button>

    <LoadingSpinner v-if="loading" />

    <template v-else-if="store.currentTenant">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ store.currentTenant.name }}</h1>
          <p class="mt-1 text-sm text-gray-500 font-mono">{{ store.currentTenant.slug }}</p>
        </div>
        <button @click="openEdit" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          <PencilIcon class="h-4 w-4" />
          Edit Tenant
        </button>
      </div>

      <!-- Info cards -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Tenant Info</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Plan</dt>
              <dd>
                <select
                  :value="store.currentTenant.plan"
                  @change="handleChangePlan($event.target.value)"
                  class="rounded-md border-gray-300 text-xs py-1 focus:border-red-500 focus:ring-red-500"
                >
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Status</dt>
              <dd>
                <select
                  :value="store.currentTenant.status"
                  @change="handleChangeStatus($event.target.value)"
                  class="rounded-md border-gray-300 text-xs py-1 focus:border-red-500 focus:ring-red-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Data Retention</dt>
              <dd class="text-sm font-medium text-gray-900">{{ store.currentTenant.data_retention_days }} days</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Created</dt>
              <dd class="text-sm font-medium text-gray-900">{{ formatDate(store.currentTenant.created_at) }}</dd>
            </div>
          </dl>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Usage</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Users</dt>
              <dd class="text-sm font-medium text-gray-900">{{ store.currentTenant.user_count ?? '--' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Cases</dt>
              <dd class="text-sm font-medium text-gray-900">{{ store.currentTenant.case_count ?? '--' }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Users section -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Users</h2>
          <button
            @click="openCreateUser"
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
          >
            <PlusIcon class="h-4 w-4" />
            Add User
          </button>
        </div>

        <LoadingSpinner v-if="store.tenantUsersLoading" />

        <template v-else>
          <div v-if="store.tenantUsers.length === 0" class="p-6 text-center text-sm text-gray-400">
            No users yet. Create one to get started.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="u in store.tenantUsers" :key="u.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ u.first_name }} {{ u.last_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ u.email }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', roleColor(u.role)]">
                      {{ u.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(u.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>

    <!-- Edit Tenant Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showEditModal = false" />
        <div class="relative w-full max-w-md transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">Edit Tenant</h3>
            <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-500">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <form @submit.prevent="handleEdit" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                v-model="editForm.name"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Data Retention (days)</label>
              <input
                v-model.number="editForm.data_retention_days"
                type="number"
                min="1"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" @click="showEditModal = false" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showUserModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showUserModal = false" />
        <div class="relative w-full max-w-md transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">Add User to {{ store.currentTenant?.name }}</h3>
            <button @click="showUserModal = false" class="text-gray-400 hover:text-gray-500">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <form @submit.prevent="handleCreateUser" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">First Name <span class="text-red-500">*</span></label>
                <input
                  v-model="userForm.first_name"
                  type="text"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                />
                <p v-if="userErrors.first_name" class="mt-1 text-sm text-red-600">{{ userErrors.first_name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Last Name <span class="text-red-500">*</span></label>
                <input
                  v-model="userForm.last_name"
                  type="text"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                />
                <p v-if="userErrors.last_name" class="mt-1 text-sm text-red-600">{{ userErrors.last_name }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email <span class="text-red-500">*</span></label>
              <input
                v-model="userForm.email"
                type="email"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
              <p v-if="userErrors.email" class="mt-1 text-sm text-red-600">{{ userErrors.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Password <span class="text-red-500">*</span></label>
              <input
                v-model="userForm.password"
                type="password"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
              <p v-if="userErrors.password" class="mt-1 text-sm text-red-600">{{ userErrors.password }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Role</label>
              <select v-model="userForm.role" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                <option value="admin">Admin</option>
                <option value="attorney">Attorney</option>
                <option value="paralegal">Paralegal</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" @click="showUserModal = false" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                :disabled="creatingUser"
                class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ creatingUser ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
