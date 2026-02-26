<script setup>
import { ref, onMounted } from 'vue'
import { useFeaturesStore } from '../stores/features'
import { useNotificationStore } from '../stores/notification'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import EmptyState from '../components/EmptyState.vue'
import {
  FlagIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useFeaturesStore()
const notify = useNotificationStore()

const roleOptions = ['admin', 'attorney', 'paralegal', 'viewer']
const planOptions = ['trial', 'basic', 'professional', 'enterprise']

// Create modal
const showCreateModal = ref(false)
const saving = ref(false)
const createForm = ref({ name: '', enabled: true, allowed_roles: [], allowed_plans: [] })

// Delete confirm
const showDeleteConfirm = ref(false)
const deletingFlag = ref(null)
const deleting = ref(false)

onMounted(async () => {
  try {
    await store.fetchManagedFlags()
  } catch {
    notify.error(t('featureFlags.loadFailed'))
  }
})

function openCreate() {
  createForm.value = { name: '', enabled: true, allowed_roles: [], allowed_plans: [] }
  showCreateModal.value = true
}

async function handleCreate() {
  if (!createForm.value.name.trim()) return
  saving.value = true
  try {
    await store.createFlag(createForm.value)
    notify.success(t('featureFlags.createSuccess'))
    showCreateModal.value = false
  } catch (err) {
    const msg = err.response?.data?.details?.join(', ') || err.response?.data?.error || t('featureFlags.createFailed')
    notify.error(msg)
  } finally {
    saving.value = false
  }
}

async function toggleFlag(flag) {
  try {
    await store.updateFlag(flag.id, { enabled: !flag.enabled })
  } catch {
    notify.error(t('featureFlags.updateFailed'))
  }
}

async function updateRoles(flag, role, checked) {
  const roles = checked
    ? [...flag.allowed_roles, role]
    : flag.allowed_roles.filter((r) => r !== role)
  try {
    await store.updateFlag(flag.id, { allowed_roles: roles })
  } catch {
    notify.error(t('featureFlags.updateFailed'))
  }
}

async function updatePlans(flag, plan, checked) {
  const plans = checked
    ? [...flag.allowed_plans, plan]
    : flag.allowed_plans.filter((p) => p !== plan)
  try {
    await store.updateFlag(flag.id, { allowed_plans: plans })
  } catch {
    notify.error(t('featureFlags.updateFailed'))
  }
}

function confirmDelete(flag) {
  deletingFlag.value = flag
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingFlag.value) return
  deleting.value = true
  try {
    await store.deleteFlag(deletingFlag.value.id)
    notify.success(t('featureFlags.deleteSuccess'))
    showDeleteConfirm.value = false
    deletingFlag.value = null
  } catch {
    notify.error(t('featureFlags.deleteFailed'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('featureFlags.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('featureFlags.subtitle') }}</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        <PlusIcon class="h-5 w-5" />
        {{ t('featureFlags.createFlag') }}
      </button>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="store.managedLoading" variant="card" :rows="4" />

    <!-- Empty -->
    <EmptyState
      v-else-if="store.managedFlags.length === 0"
      :title="t('featureFlags.noFlags')"
      :description="t('featureFlags.noFlagsDesc')"
      :icon="FlagIcon"
    >
      <template #action>
        <button
          @click="openCreate"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          {{ t('featureFlags.createFlag') }}
        </button>
      </template>
    </EmptyState>

    <!-- Flags list -->
    <div v-else class="space-y-4">
      <div
        v-for="flag in store.managedFlags"
        :key="flag.id"
        class="bg-white shadow rounded-lg p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <FlagIcon class="h-5 w-5 text-gray-400" />
            <div>
              <h3 class="text-sm font-semibold text-gray-900">{{ flag.name }}</h3>
              <p class="text-xs text-gray-500">ID: {{ flag.id.slice(0, 8) }}...</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <!-- Toggle switch -->
            <button
              @click="toggleFlag(flag)"
              :class="[
                flag.enabled ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
              ]"
              role="switch"
              :aria-checked="flag.enabled"
            >
              <span
                :class="[
                  flag.enabled ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                ]"
              />
            </button>
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
            >
              {{ flag.enabled ? t('featureFlags.enabled') : t('featureFlags.disabled') }}
            </span>
            <button
              @click="confirmDelete(flag)"
              class="text-red-500 hover:text-red-700 transition-colors"
              :title="t('common.delete')"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Role restrictions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-medium text-gray-500 mb-2">{{ t('featureFlags.allowedRoles') }}</p>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="role in roleOptions"
                :key="role"
                class="inline-flex items-center gap-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  :checked="flag.allowed_roles.includes(role)"
                  @change="updateRoles(flag, role, $event.target.checked)"
                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span class="text-gray-700 capitalize">{{ role }}</span>
              </label>
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ t('featureFlags.emptyRolesHint') }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 mb-2">{{ t('featureFlags.allowedPlans') }}</p>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="plan in planOptions"
                :key="plan"
                class="inline-flex items-center gap-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  :checked="flag.allowed_plans.includes(plan)"
                  @change="updatePlans(flag, plan, $event.target.checked)"
                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span class="text-gray-700 capitalize">{{ plan }}</span>
              </label>
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ t('featureFlags.emptyPlansHint') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="showCreateModal = false" />
        <div class="relative w-full max-w-md transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ t('featureFlags.createFlag') }}</h3>
            <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-500 transition-colors">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <form @submit.prevent="handleCreate" class="p-6 space-y-4">
            <div>
              <label for="flag-name" class="block text-sm font-medium text-gray-700">
                {{ t('featureFlags.flagName') }} <span class="text-red-500">*</span>
              </label>
              <input
                id="flag-name"
                v-model="createForm.name"
                type="text"
                placeholder="e.g. my_new_feature"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="createForm.enabled = !createForm.enabled"
                :class="[
                  createForm.enabled ? 'bg-indigo-600' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                ]"
                role="switch"
                :aria-checked="createForm.enabled"
              >
                <span
                  :class="[
                    createForm.enabled ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  ]"
                />
              </button>
              <span class="text-sm font-medium text-gray-700">
                {{ createForm.enabled ? t('featureFlags.enabled') : t('featureFlags.disabled') }}
              </span>
            </div>
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="showCreateModal = false"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving || !createForm.name.trim()"
                class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ saving ? t('common.loading') : t('common.create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      :title="t('featureFlags.deleteTitle')"
      :message="t('featureFlags.deleteMessage')"
      :confirm-label="t('common.delete')"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
