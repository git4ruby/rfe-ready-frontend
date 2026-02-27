<script setup>
import { ref, onMounted } from 'vue'
import { useSlackStore } from '../stores/slack'
import { useNotificationStore } from '../stores/notification'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const store = useSlackStore()
const notify = useNotificationStore()
const { t } = useI18n()

const showForm = ref(false)
const editing = ref(null)
const saving = ref(false)
const testingId = ref(null)
const deleteTarget = ref(null)

const form = ref({
  webhook_url: '',
  channel_name: '',
  events: [],
  active: true,
})

const supportedEvents = [
  'case.created',
  'case.status_changed',
  'case.archived',
  'document.uploaded',
  'draft.approved',
]

onMounted(() => {
  store.fetchIntegrations().catch(() => notify.error(t('slack.loadFailed')))
})

function openCreate() {
  editing.value = null
  form.value = { webhook_url: '', channel_name: '', events: [], active: true }
  showForm.value = true
}

function openEdit(integration) {
  editing.value = integration.id
  form.value = {
    webhook_url: integration.webhook_url,
    channel_name: integration.channel_name || '',
    events: [...(integration.events || [])],
    active: integration.active,
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

function toggleEvent(event) {
  const idx = form.value.events.indexOf(event)
  if (idx >= 0) {
    form.value.events.splice(idx, 1)
  } else {
    form.value.events.push(event)
  }
}

async function saveForm() {
  saving.value = true
  try {
    if (editing.value) {
      await store.updateIntegration(editing.value, form.value)
      notify.success(t('slack.updateSuccess'))
    } else {
      await store.createIntegration(form.value)
      notify.success(t('slack.createSuccess'))
    }
    closeForm()
  } catch {
    notify.error(t('slack.saveFailed'))
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await store.deleteIntegration(deleteTarget.value)
    notify.success(t('slack.deleteSuccess'))
  } catch {
    notify.error(t('slack.deleteFailed'))
  } finally {
    deleteTarget.value = null
  }
}

async function testNotification(id) {
  testingId.value = id
  try {
    await store.testIntegration(id)
    notify.success(t('slack.testSent'))
  } catch {
    notify.error(t('slack.saveFailed'))
  } finally {
    testingId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('slack.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('slack.subtitle') }}</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        <PlusIcon class="h-4 w-4" />
        {{ t('slack.createIntegration') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <!-- Empty state -->
    <div v-else-if="store.integrations.length === 0" class="text-center py-12">
      <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-300" />
      <p class="mt-4 text-sm text-gray-500">{{ t('slack.noIntegrations') }}</p>
    </div>

    <!-- Integration list -->
    <div v-else class="space-y-4">
      <div
        v-for="integration in store.integrations"
        :key="integration.id"
        class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900 truncate">{{ integration.webhook_url }}</p>
              <span
                :class="integration.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              >
                {{ integration.active ? t('slack.active') : 'Inactive' }}
              </span>
            </div>
            <p v-if="integration.channel_name" class="mt-1 text-sm text-gray-500">
              {{ integration.channel_name }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="event in integration.events"
                :key="event"
                class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
              >
                {{ event }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 ml-4">
            <button
              @click="testNotification(integration.id)"
              :disabled="testingId === integration.id"
              class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <PaperAirplaneIcon class="h-3.5 w-3.5" />
              {{ t('slack.testNotification') }}
            </button>
            <button @click="openEdit(integration)" class="text-gray-400 hover:text-indigo-600">
              <PencilSquareIcon class="h-4 w-4" />
            </button>
            <button @click="deleteTarget = integration.id" class="text-gray-400 hover:text-red-600">
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="closeForm">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ editing ? t('slack.editIntegration') : t('slack.createIntegration') }}
          </h2>
          <button @click="closeForm" class="text-gray-400 hover:text-gray-500">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ t('slack.webhookUrl') }}</label>
            <input
              v-model="form.webhook_url"
              type="url"
              :placeholder="t('slack.webhookUrlPlaceholder')"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ t('slack.channelName') }}</label>
            <input
              v-model="form.channel_name"
              type="text"
              :placeholder="t('slack.channelPlaceholder')"
              class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('slack.events') }}</label>
            <div class="space-y-2">
              <label
                v-for="event in supportedEvents"
                :key="event"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="form.events.includes(event)"
                  @change="toggleEvent(event)"
                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ event }}</span>
              </label>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">{{ t('slack.active') }}</span>
            <button
              type="button"
              role="switch"
              :aria-checked="form.active"
              @click="form.active = !form.active"
              :class="form.active ? 'bg-indigo-600' : 'bg-gray-200'"
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors"
            >
              <span :class="form.active ? 'translate-x-5' : 'translate-x-0'" class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ml-0.5" />
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button @click="closeForm" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {{ t('common.cancel') }}
          </button>
          <button
            @click="saveForm"
            :disabled="saving || !form.webhook_url || form.events.length === 0"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <ConfirmDialog
      v-if="deleteTarget"
      :title="t('common.confirm')"
      :message="t('slack.deleteConfirm')"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>
