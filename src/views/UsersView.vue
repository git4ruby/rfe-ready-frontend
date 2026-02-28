<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUsersStore } from '../stores/users'
import { useNotificationStore } from '../stores/notification'
import { useAuthStore } from '../stores/auth'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import {
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  XMarkIcon,
  EnvelopeIcon,
  NoSymbolIcon,
} from '@heroicons/vue/24/outline'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import EmptyState from '../components/EmptyState.vue'
import PasswordStrength from '../components/PasswordStrength.vue'
import PaginationBar from '../components/PaginationBar.vue'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useUsersStore()
const notify = useNotificationStore()
const auth = useAuthStore()

const currentPage = ref(1)

// Invite modal
const showInviteModal = ref(false)
const inviting = ref(false)
const inviteErrors = ref({})
const inviteForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  role: 'attorney',
  bar_number: '',
  password: '',
  password_confirmation: '',
})

// Edit modal
const showEditModal = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const editErrors = ref({})
const editForm = ref({
  first_name: '',
  last_name: '',
  role: '',
  bar_number: '',
  status: '',
})

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'attorney', label: 'Attorney' },
  { value: 'paralegal', label: 'Paralegal' },
  { value: 'viewer', label: 'Viewer' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

// Load users
async function loadUsers(page = 1) {
  currentPage.value = page
  try {
    await store.fetchUsers(page)
  } catch {
    notify.error('Failed to load users.')
  }
}

onMounted(() => loadUsers())

// Invite
function openInvite() {
  inviteForm.value = {
    first_name: '',
    last_name: '',
    email: '',
    role: 'attorney',
    bar_number: '',
    password: '',
    password_confirmation: '',
  }
  inviteErrors.value = {}
  showInviteModal.value = true
}

function validateInvite() {
  const errs = {}
  if (!inviteForm.value.first_name.trim()) errs.first_name = 'First name is required'
  if (!inviteForm.value.last_name.trim()) errs.last_name = 'Last name is required'
  if (!inviteForm.value.email.trim()) errs.email = 'Email is required'
  if (!inviteForm.value.password) errs.password = 'Password is required'
  else if (inviteForm.value.password.length < 8) errs.password = 'Password must be at least 8 characters'
  if (inviteForm.value.password !== inviteForm.value.password_confirmation) errs.password_confirmation = 'Passwords do not match'
  if (inviteForm.value.role === 'attorney' && !inviteForm.value.bar_number.trim()) errs.bar_number = 'Bar number is required for attorneys'
  inviteErrors.value = errs
  return Object.keys(errs).length === 0
}

async function handleInvite() {
  if (!validateInvite()) return

  inviting.value = true
  try {
    const data = { ...inviteForm.value }
    if (data.role !== 'attorney') delete data.bar_number
    await store.createUser(data)
    notify.success('User invited successfully.')
    showInviteModal.value = false
  } catch (err) {
    const msg =
      err.response?.data?.details?.join(', ') ||
      err.response?.data?.error ||
      'Failed to invite user.'
    notify.error(msg)
  } finally {
    inviting.value = false
  }
}

// Edit
function openEdit(user) {
  editingUser.value = user
  editForm.value = {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role || 'viewer',
    bar_number: user.bar_number || '',
    status: user.status || 'active',
  }
  editErrors.value = {}
  showEditModal.value = true
}

function validateEdit() {
  const errs = {}
  if (!editForm.value.first_name.trim()) errs.first_name = 'First name is required'
  if (!editForm.value.last_name.trim()) errs.last_name = 'Last name is required'
  if (editForm.value.role === 'attorney' && !editForm.value.bar_number.trim()) errs.bar_number = 'Bar number is required for attorneys'
  editErrors.value = errs
  return Object.keys(errs).length === 0
}

// Confirm status change to inactive via edit form
const showEditDeactivateConfirm = ref(false)

async function handleEdit() {
  if (!validateEdit()) return

  // If changing status to inactive, ask for confirmation first
  if (editForm.value.status === 'inactive' && editingUser.value?.status !== 'inactive') {
    showEditDeactivateConfirm.value = true
    return
  }

  await saveEdit()
}

async function saveEdit() {
  saving.value = true
  try {
    const data = { ...editForm.value }
    if (data.role !== 'attorney') delete data.bar_number
    await store.updateUser(editingUser.value.id, data)
    notify.success('User updated successfully.')
    showEditModal.value = false
    showEditDeactivateConfirm.value = false
  } catch (err) {
    const msg =
      err.response?.data?.errors?.join(', ') ||
      err.response?.data?.error ||
      'Failed to update user.'
    notify.error(msg)
  } finally {
    saving.value = false
  }
}

// Resend invitation
async function handleResend(user) {
  try {
    await store.resendInvitation(user.id)
    notify.success(`Invitation resent to ${user.email}.`)
  } catch {
    notify.error('Failed to resend invitation.')
  }
}

// Deactivate
const showDeactivateConfirm = ref(false)
const deactivatingUser = ref(null)
const deactivating = ref(false)

function confirmDeactivate(user) {
  deactivatingUser.value = user
  showDeactivateConfirm.value = true
}

async function handleDeactivate() {
  if (!deactivatingUser.value) return
  deactivating.value = true
  try {
    await store.deactivateUser(deactivatingUser.value.id)
    notify.success(`${deactivatingUser.value.first_name} ${deactivatingUser.value.last_name} has been deactivated.`)
    showDeactivateConfirm.value = false
    deactivatingUser.value = null
  } catch {
    notify.error('Failed to deactivate user.')
  } finally {
    deactivating.value = false
  }
}

// Bulk selection
const selectedIds = ref(new Set())
const bulkProcessing = ref(false)

const selectableUsers = computed(() =>
  store.users.filter((u) => u.id !== auth.user?.id)
)

const allSelected = computed(
  () => selectableUsers.value.length > 0 && selectableUsers.value.every((u) => selectedIds.value.has(u.id))
)

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(selectableUsers.value.map((u) => u.id))
  }
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function handleBulkAction(status) {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return
  bulkProcessing.value = true
  try {
    const result = await store.bulkUpdateStatus(ids, status)
    const label = status === 'inactive' ? 'deactivated' : 'activated'
    notify.success(`${result.success} user(s) ${label}.${result.failed ? ` ${result.failed} failed.` : ''}`)
    clearSelection()
    await loadUsers(currentPage.value)
  } catch {
    notify.error('Bulk action failed.')
  } finally {
    bulkProcessing.value = false
  }
}

// Clear selection on page change
watch(currentPage, () => clearSelection())

// Pagination
async function goToPage(page) {
  await loadUsers(page)
}

// Badge helpers
function roleClasses(role) {
  const classes = {
    admin: 'bg-purple-100 text-purple-800',
    attorney: 'bg-blue-100 text-blue-800',
    paralegal: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-700',
  }
  return classes[role] || 'bg-gray-100 text-gray-700'
}

function statusClasses(status) {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-700',
    invited: 'bg-yellow-100 text-yellow-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function initials(user) {
  return `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase()
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
        <h1 class="text-2xl font-bold text-gray-900">{{ t('users.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('users.subtitle', 'Manage team members, invite new users, and assign roles.') }}</p>
      </div>
      <button
        @click="openInvite"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        <PlusIcon class="h-5 w-5" />
        {{ t('users.inviteUser') }}
      </button>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="store.loading" variant="table" :rows="6" :columns="4" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="!store.loading && store.users.length === 0"
      title="No team members yet"
      description="Invite your first team member to get started."
      :icon="UsersIcon"
    >
      <template #action>
        <button
          @click="openInvite"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          Invite User
        </button>
      </template>
    </EmptyState>

    <!-- Users list -->
    <div v-else>
      <!-- Bulk action bar -->
      <div
        v-if="selectedIds.size > 0"
        class="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2.5"
      >
        <span class="text-sm font-medium text-indigo-800">{{ selectedIds.size }} user(s) selected</span>
        <button
          @click="handleBulkAction('inactive')"
          :disabled="bulkProcessing"
          class="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          <NoSymbolIcon class="h-3.5 w-3.5" />
          Deactivate
        </button>
        <button
          @click="handleBulkAction('active')"
          :disabled="bulkProcessing"
          class="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
        >
          Activate
        </button>
        <button
          @click="clearSelection"
          class="text-xs text-gray-500 hover:text-gray-700 ml-auto"
        >
          Clear
        </button>
      </div>

      <!-- Mobile card layout -->
      <div class="md:hidden space-y-3">
        <div
          v-for="user in store.users"
          :key="'m-' + user.id"
          class="bg-white shadow rounded-lg p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <input
                v-if="user.id !== auth.user?.id"
                type="checkbox"
                :checked="selectedIds.has(user.id)"
                @change="toggleSelect(user.id)"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
              />
              <div class="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-medium text-indigo-700">{{ initials(user) }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-900">{{ user.first_name }} {{ user.last_name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
              </div>
            </div>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              :class="statusClasses(user.status)"
            >
              {{ user.status }}
            </span>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              :class="roleClasses(user.role)"
            >
              {{ user.role }}
            </span>
            <div class="flex items-center gap-3">
              <button v-if="user.status === 'invited'" @click="handleResend(user)" class="text-yellow-600 hover:text-yellow-500" title="Resend"><EnvelopeIcon class="h-4 w-4" /></button>
              <button @click="openEdit(user)" :disabled="user.id === auth.user?.id" :class="{ 'opacity-50': user.id === auth.user?.id }" class="text-indigo-600 hover:text-indigo-500" title="Edit"><PencilSquareIcon class="h-4 w-4" /></button>
              <button v-if="user.status === 'active' && user.id !== auth.user?.id" @click="confirmDeactivate(user)" class="text-red-600 hover:text-red-500" title="Deactivate"><NoSymbolIcon class="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('users.name') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('auth.email') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('users.role') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('common.status') }}
                </th>
                <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="user in store.users"
                :key="user.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="w-10 px-4 py-4">
                  <input
                    v-if="user.id !== auth.user?.id"
                    type="checkbox"
                    :checked="selectedIds.has(user.id)"
                    @change="toggleSelect(user.id)"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span class="text-xs font-medium text-indigo-700">{{ initials(user) }}</span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.first_name }} {{ user.last_name }}
                      </div>
                      <div v-if="user.bar_number" class="text-xs text-gray-500">
                        Bar: {{ user.bar_number }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    :class="roleClasses(user.role)"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    :class="statusClasses(user.status)"
                  >
                    {{ user.status }}
                  </span>
                </td>
                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      v-if="user.status === 'invited'"
                      @click="handleResend(user)"
                      class="text-yellow-600 hover:text-yellow-500 transition-colors"
                      title="Resend invitation"
                    >
                      <EnvelopeIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click="openEdit(user)"
                      class="text-indigo-600 hover:text-indigo-500 transition-colors"
                      :class="{ 'opacity-50 cursor-not-allowed': user.id === auth.user?.id }"
                      :disabled="user.id === auth.user?.id"
                      title="Edit user"
                    >
                      <PencilSquareIcon class="h-4 w-4" />
                    </button>
                    <button
                      v-if="user.status === 'active' && user.id !== auth.user?.id"
                      @click="confirmDeactivate(user)"
                      class="text-red-600 hover:text-red-500 transition-colors"
                      title="Deactivate user"
                    >
                      <NoSymbolIcon class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
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

    <!-- Invite User Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showInviteModal = false" />

        <div class="relative w-full max-w-lg mx-4 transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">Invite User</h3>
            <button @click="showInviteModal = false" class="text-gray-400 hover:text-gray-500 transition-colors">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="handleInvite" class="p-6 space-y-5">
            <!-- Name row -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label for="invite-first" class="block text-sm font-medium text-gray-700">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="invite-first"
                  v-model="inviteForm.first_name"
                  type="text"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p v-if="inviteErrors.first_name" class="mt-1 text-sm text-red-600">{{ inviteErrors.first_name }}</p>
              </div>
              <div>
                <label for="invite-last" class="block text-sm font-medium text-gray-700">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="invite-last"
                  v-model="inviteForm.last_name"
                  type="text"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p v-if="inviteErrors.last_name" class="mt-1 text-sm text-red-600">{{ inviteErrors.last_name }}</p>
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="invite-email" class="block text-sm font-medium text-gray-700">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                id="invite-email"
                v-model="inviteForm.email"
                type="email"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="user@example.com"
              />
              <p v-if="inviteErrors.email" class="mt-1 text-sm text-red-600">{{ inviteErrors.email }}</p>
            </div>

            <!-- Role -->
            <div>
              <label for="invite-role" class="block text-sm font-medium text-gray-700">
                Role <span class="text-red-500">*</span>
              </label>
              <select
                id="invite-role"
                v-model="inviteForm.role"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Bar number (attorney only) -->
            <div v-if="inviteForm.role === 'attorney'">
              <label for="invite-bar" class="block text-sm font-medium text-gray-700">
                Bar Number <span class="text-red-500">*</span>
              </label>
              <input
                id="invite-bar"
                v-model="inviteForm.bar_number"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. CA-123456"
              />
              <p v-if="inviteErrors.bar_number" class="mt-1 text-sm text-red-600">{{ inviteErrors.bar_number }}</p>
            </div>

            <!-- Password row -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label for="invite-password" class="block text-sm font-medium text-gray-700">
                  Temporary Password <span class="text-red-500">*</span>
                </label>
                <input
                  id="invite-password"
                  v-model="inviteForm.password"
                  type="password"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <PasswordStrength :password="inviteForm.password" />
                <p v-if="inviteErrors.password" class="mt-1 text-sm text-red-600">{{ inviteErrors.password }}</p>
              </div>
              <div>
                <label for="invite-password-confirm" class="block text-sm font-medium text-gray-700">
                  Confirm Password <span class="text-red-500">*</span>
                </label>
                <input
                  id="invite-password-confirm"
                  v-model="inviteForm.password_confirmation"
                  type="password"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p v-if="inviteErrors.password_confirmation" class="mt-1 text-sm text-red-600">{{ inviteErrors.password_confirmation }}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="showInviteModal = false"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="inviting"
                class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  v-if="inviting"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ inviting ? 'Inviting...' : 'Send Invitation' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showEditModal = false" />

        <div class="relative w-full max-w-lg mx-4 transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">Edit User</h3>
            <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-500 transition-colors">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="handleEdit" class="p-6 space-y-5">
            <!-- Name row -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label for="edit-first" class="block text-sm font-medium text-gray-700">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="edit-first"
                  v-model="editForm.first_name"
                  type="text"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p v-if="editErrors.first_name" class="mt-1 text-sm text-red-600">{{ editErrors.first_name }}</p>
              </div>
              <div>
                <label for="edit-last" class="block text-sm font-medium text-gray-700">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="edit-last"
                  v-model="editForm.last_name"
                  type="text"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p v-if="editErrors.last_name" class="mt-1 text-sm text-red-600">{{ editErrors.last_name }}</p>
              </div>
            </div>

            <!-- Role and Status row -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label for="edit-role" class="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="edit-role"
                  v-model="editForm.role"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div>
                <label for="edit-status" class="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="edit-status"
                  v-model="editForm.status"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Bar number (attorney only) -->
            <div v-if="editForm.role === 'attorney'">
              <label for="edit-bar" class="block text-sm font-medium text-gray-700">
                Bar Number <span class="text-red-500">*</span>
              </label>
              <input
                id="edit-bar"
                v-model="editForm.bar_number"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. CA-123456"
              />
              <p v-if="editErrors.bar_number" class="mt-1 text-sm text-red-600">{{ editErrors.bar_number }}</p>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="showEditModal = false"
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
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Deactivate Confirmation (from action button) -->
    <ConfirmDialog
      :show="showDeactivateConfirm"
      title="Deactivate User"
      :message="`Are you sure you want to deactivate ${deactivatingUser?.first_name} ${deactivatingUser?.last_name}? They will no longer be able to log in.`"
      confirm-label="Deactivate"
      :loading="deactivating"
      @confirm="handleDeactivate"
      @cancel="showDeactivateConfirm = false"
    />

    <!-- Deactivate Confirmation (from edit form status change) -->
    <ConfirmDialog
      :show="showEditDeactivateConfirm"
      title="Deactivate User"
      :message="`Are you sure you want to deactivate ${editingUser?.first_name} ${editingUser?.last_name}? They will no longer be able to log in.`"
      confirm-label="Deactivate"
      :loading="saving"
      @confirm="saveEdit"
      @cancel="showEditDeactivateConfirm = false"
    />
  </div>
</template>
