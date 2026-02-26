<script setup>
import { ref, onMounted, computed } from 'vue'
import { useWebhooksStore } from '../stores/webhooks'
import { useNotificationStore } from '../stores/notification'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import EmptyState from '../components/EmptyState.vue'
import {
  BoltIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useWebhooksStore()
const notify = useNotificationStore()

const SUPPORTED_EVENTS = [
  'case.created',
  'case.updated',
  'case.status_changed',
  'case.archived',
  'document.uploaded',
  'document.deleted',
  'draft.approved',
  'draft.regenerated',
]

const EVENT_GROUPS = computed(() => [
  {
    key: 'case',
    label: t('webhooks.eventGroups.case'),
    events: SUPPORTED_EVENTS.filter(e => e.startsWith('case.')),
  },
  {
    key: 'document',
    label: t('webhooks.eventGroups.document'),
    events: SUPPORTED_EVENTS.filter(e => e.startsWith('document.')),
  },
  {
    key: 'draft',
    label: t('webhooks.eventGroups.draft'),
    events: SUPPORTED_EVENTS.filter(e => e.startsWith('draft.')),
  },
])

// Modal state
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)

const emptyForm = () => ({
  url: '',
  description: '',
  secret: '',
  events: [],
  active: true,
})

const form = ref(emptyForm())

// Delete confirm
const showDeleteConfirm = ref(false)
const deletingWebhook = ref(null)
const deleting = ref(false)

// Testing
const testingId = ref(null)

onMounted(async () => {
  try {
    await store.fetchWebhooks()
  } catch {
    notify.error(t('webhooks.loadFailed'))
  }
})

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(webhook) {
  editing.value = webhook
  form.value = {
    url: webhook.url,
    description: webhook.description || '',
    secret: '',
    events: [...webhook.events],
    active: webhook.active,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  form.value = emptyForm()
}

function toggleEvent(event) {
  const idx = form.value.events.indexOf(event)
  if (idx === -1) {
    form.value.events.push(event)
  } else {
    form.value.events.splice(idx, 1)
  }
}

function toggleGroupEvents(group) {
  const allSelected = group.events.every(e => form.value.events.includes(e))
  if (allSelected) {
    form.value.events = form.value.events.filter(e => !group.events.includes(e))
  } else {
    const toAdd = group.events.filter(e => !form.value.events.includes(e))
    form.value.events.push(...toAdd)
  }
}

function isGroupAllSelected(group) {
  return group.events.every(e => form.value.events.includes(e))
}

function isGroupPartiallySelected(group) {
  const count = group.events.filter(e => form.value.events.includes(e)).length
  return count > 0 && count < group.events.length
}

async function handleSave() {
  if (!form.value.url.trim()) return
  saving.value = true
  try {
    const payload = {
      url: form.value.url,
      description: form.value.description,
      events: form.value.events,
      active: form.value.active,
    }
    if (form.value.secret) {
      payload.secret = form.value.secret
    }
    if (editing.value) {
      await store.updateWebhook(editing.value.id, payload)
      notify.success(t('webhooks.updateSuccess'))
    } else {
      await store.createWebhook(payload)
      notify.success(t('webhooks.createSuccess'))
    }
    closeModal()
  } catch (err) {
    const msg = err.response?.data?.details?.join(', ') || err.response?.data?.error || t('webhooks.saveFailed')
    notify.error(msg)
  } finally {
    saving.value = false
  }
}

async function toggleActive(webhook) {
  try {
    await store.updateWebhook(webhook.id, { active: !webhook.active })
  } catch {
    notify.error(t('webhooks.saveFailed'))
  }
}

function confirmDelete(webhook) {
  deletingWebhook.value = webhook
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingWebhook.value) return
  deleting.value = true
  try {
    await store.deleteWebhook(deletingWebhook.value.id)
    notify.success(t('webhooks.deleteSuccess'))
    showDeleteConfirm.value = false
    deletingWebhook.value = null
  } catch {
    notify.error(t('webhooks.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

async function handleTest(webhook) {
  testingId.value = webhook.id
  try {
    await store.testWebhook(webhook.id)
    notify.success(t('webhooks.testSent'))
  } catch {
    notify.error(t('webhooks.saveFailed'))
  } finally {
    testingId.value = null
  }
}

function truncateUrl(url, maxLen = 50) {
  if (!url) return ''
  return url.length > maxLen ? url.slice(0, maxLen) + '...' : url
}

function formatEventName(event) {
  return event.replace('.', ' ').replace(/_/g, ' ')
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('webhooks.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('webhooks.subtitle') }}</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        <PlusIcon class="h-5 w-5" />
        {{ t('webhooks.createWebhook') }}
      </button>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="store.loading" variant="card" :rows="4" />

    <!-- Empty -->
    <EmptyState
      v-else-if="store.webhooks.length === 0"
      :title="t('webhooks.noWebhooks')"
      :icon="BoltIcon"
    >
      <template #action>
        <button
          @click="openCreate"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          {{ t('webhooks.createWebhook') }}
        </button>
      </template>
    </EmptyState>

    <!-- Webhooks list -->
    <div v-else class="space-y-4">
      <div
        v-for="webhook in store.webhooks"
        :key="webhook.id"
        class="bg-white shadow rounded-lg p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0">
            <BoltIcon class="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-900 truncate" :title="webhook.url">
                {{ truncateUrl(webhook.url) }}
              </h3>
              <p v-if="webhook.description" class="text-xs text-gray-500 mt-0.5">
                {{ webhook.description }}
              </p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                >
                  {{ webhook.active ? t('webhooks.active') : t('featureFlags.disabled') }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ webhook.events.length }} {{ t('webhooks.events').toLowerCase() }}
                </span>
              </div>
              <!-- Event pills -->
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="event in webhook.events"
                  :key="event"
                  class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                >
                  {{ formatEventName(event) }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <!-- Active toggle -->
            <button
              @click="toggleActive(webhook)"
              :class="[
                webhook.active ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
              ]"
              role="switch"
              :aria-checked="webhook.active"
            >
              <span
                :class="[
                  webhook.active ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                ]"
              />
            </button>
            <!-- Test -->
            <button
              @click="handleTest(webhook)"
              :disabled="testingId === webhook.id"
              class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :title="t('webhooks.testDelivery')"
            >
              <PaperAirplaneIcon class="h-3.5 w-3.5" />
              {{ t('webhooks.testDelivery') }}
            </button>
            <!-- Edit -->
            <button
              @click="openEdit(webhook)"
              class="text-gray-400 hover:text-indigo-600 transition-colors p-1"
              :title="t('common.edit')"
            >
              <PencilSquareIcon class="h-4 w-4" />
            </button>
            <!-- Delete -->
            <button
              @click="confirmDelete(webhook)"
              class="text-gray-400 hover:text-red-600 transition-colors p-1"
              :title="t('common.delete')"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="closeModal" />
        <div class="relative w-full max-w-lg transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editing ? t('webhooks.editWebhook') : t('webhooks.createWebhook') }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-500 transition-colors">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <form @submit.prevent="handleSave" class="p-6 space-y-4">
            <!-- URL -->
            <div>
              <label for="webhook-url" class="block text-sm font-medium text-gray-700">
                {{ t('webhooks.url') }} <span class="text-red-500">*</span>
              </label>
              <input
                id="webhook-url"
                v-model="form.url"
                type="url"
                :placeholder="t('webhooks.urlPlaceholder')"
                required
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="webhook-description" class="block text-sm font-medium text-gray-700">
                {{ t('webhooks.description') }}
              </label>
              <input
                id="webhook-description"
                v-model="form.description"
                type="text"
                :placeholder="t('webhooks.descriptionPlaceholder')"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Secret -->
            <div>
              <label for="webhook-secret" class="block text-sm font-medium text-gray-700">
                {{ t('webhooks.secret') }}
              </label>
              <input
                id="webhook-secret"
                v-model="form.secret"
                type="password"
                :placeholder="t('webhooks.secretPlaceholder')"
                autocomplete="off"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Active toggle -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="form.active = !form.active"
                :class="[
                  form.active ? 'bg-indigo-600' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                ]"
                role="switch"
                :aria-checked="form.active"
              >
                <span
                  :class="[
                    form.active ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  ]"
                />
              </button>
              <span class="text-sm font-medium text-gray-700">
                {{ t('webhooks.active') }}
              </span>
            </div>

            <!-- Events -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('webhooks.events') }}
              </label>
              <div class="space-y-4">
                <div v-for="group in EVENT_GROUPS" :key="group.key" class="border border-gray-200 rounded-lg p-3">
                  <label class="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      :checked="isGroupAllSelected(group)"
                      :indeterminate="isGroupPartiallySelected(group)"
                      @change="toggleGroupEvents(group)"
                      class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span class="text-sm font-semibold text-gray-700">{{ group.label }}</span>
                  </label>
                  <div class="ml-6 space-y-1.5">
                    <label
                      v-for="event in group.events"
                      :key="event"
                      class="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :checked="form.events.includes(event)"
                        @change="toggleEvent(event)"
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span class="text-sm text-gray-600">{{ formatEventName(event) }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="closeModal"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving || !form.url.trim() || form.events.length === 0"
                class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ saving ? t('common.loading') : (editing ? t('common.save') : t('common.create')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      :title="t('common.delete')"
      :message="t('webhooks.deleteConfirm')"
      :confirm-label="t('common.delete')"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
