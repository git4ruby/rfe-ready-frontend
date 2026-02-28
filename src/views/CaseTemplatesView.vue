<script setup>
import { ref, onMounted } from 'vue'
import { useTemplatesStore } from '../stores/templates'
import { useNotificationStore } from '../stores/notification'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import EmptyState from '../components/EmptyState.vue'
import {
  DocumentDuplicateIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useTemplatesStore()
const notify = useNotificationStore()

const VISA_CATEGORIES = ['H-1B', 'L-1', 'O-1', 'EB-1', 'EB-2', 'EB-3', 'Other']

// Modal state
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)

const emptyForm = () => ({
  name: '',
  description: '',
  visa_category: 'H-1B',
  default_sections: [],
  default_checklist: [],
  default_notes: '',
})

const form = ref(emptyForm())

// Delete confirm
const showDeleteConfirm = ref(false)
const deletingTemplate = ref(null)
const deleting = ref(false)

onMounted(async () => {
  try {
    await store.fetchTemplates()
  } catch {
    notify.error(t('templates.loadFailed'))
  }
})

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(template) {
  editing.value = template
  form.value = {
    name: template.name || '',
    description: template.description || '',
    visa_category: template.visa_category || 'H-1B',
    default_sections: template.default_sections ? template.default_sections.map(s => ({ ...s })) : [],
    default_checklist: template.default_checklist ? template.default_checklist.map(c => ({ ...c })) : [],
    default_notes: template.default_notes || '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  form.value = emptyForm()
}

function addSection() {
  form.value.default_sections.push({ title: '', description: '' })
}

function removeSection(index) {
  form.value.default_sections.splice(index, 1)
}

function addChecklistItem() {
  form.value.default_checklist.push({ name: '', required: false })
}

function removeChecklistItem(index) {
  form.value.default_checklist.splice(index, 1)
}

async function handleSave() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      visa_category: form.value.visa_category,
      default_sections: form.value.default_sections,
      default_checklist: form.value.default_checklist,
      default_notes: form.value.default_notes,
    }
    if (editing.value) {
      await store.updateTemplate(editing.value.id, payload)
      notify.success(t('templates.updateSuccess'))
    } else {
      await store.createTemplate(payload)
      notify.success(t('templates.createSuccess'))
    }
    closeModal()
  } catch (err) {
    const msg = err.response?.data?.details?.join(', ') || err.response?.data?.error || t('templates.saveFailed')
    notify.error(msg)
  } finally {
    saving.value = false
  }
}

function confirmDelete(template) {
  deletingTemplate.value = template
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingTemplate.value) return
  deleting.value = true
  try {
    await store.deleteTemplate(deletingTemplate.value.id)
    notify.success(t('templates.deleteSuccess'))
    showDeleteConfirm.value = false
    deletingTemplate.value = null
  } catch {
    notify.error(t('templates.deleteFailed'))
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
        <h1 class="text-2xl font-bold text-gray-900">{{ t('templates.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('templates.subtitle') }}</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        <PlusIcon class="h-5 w-5" />
        {{ t('templates.createTemplate') }}
      </button>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="store.loading" variant="card" :rows="4" />

    <!-- Empty -->
    <EmptyState
      v-else-if="store.templates.length === 0"
      :title="t('templates.noTemplates')"
      :description="t('templates.noTemplatesDesc')"
      :icon="DocumentDuplicateIcon"
    >
      <template #action>
        <button
          @click="openCreate"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          {{ t('templates.createTemplate') }}
        </button>
      </template>
    </EmptyState>

    <!-- Templates table -->
    <div v-else class="bg-white shadow rounded-lg overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('templates.name') }}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('templates.visaCategory') }}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('templates.sections') }}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('templates.checklist') }}
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('common.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="template in store.templates" :key="template.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ template.name }}</div>
              <div v-if="template.description" class="text-xs text-gray-500">{{ template.description }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {{ template.visa_category }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ (template.default_sections || []).length }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ (template.default_checklist || []).length }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="openEdit(template)"
                  class="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                  :title="t('common.edit')"
                >
                  <PencilSquareIcon class="h-4 w-4" />
                </button>
                <button
                  @click="confirmDelete(template)"
                  class="text-gray-400 hover:text-red-600 transition-colors p-1"
                  :title="t('common.delete')"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="closeModal" />
        <div class="relative w-full max-w-lg sm:max-w-2xl transform rounded-xl bg-white shadow-2xl transition-all">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editing ? t('templates.editTemplate') : t('templates.createTemplate') }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-500 transition-colors">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <form @submit.prevent="handleSave" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <!-- Name -->
            <div>
              <label for="template-name" class="block text-sm font-medium text-gray-700">
                {{ t('templates.name') }} <span class="text-red-500">*</span>
              </label>
              <input
                id="template-name"
                v-model="form.name"
                type="text"
                :placeholder="t('templates.namePlaceholder')"
                required
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="template-description" class="block text-sm font-medium text-gray-700">
                {{ t('templates.description') }}
              </label>
              <textarea
                id="template-description"
                v-model="form.description"
                rows="2"
                :placeholder="t('templates.descriptionPlaceholder')"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Visa Category -->
            <div>
              <label for="template-visa-category" class="block text-sm font-medium text-gray-700">
                {{ t('templates.visaCategory') }}
              </label>
              <select
                id="template-visa-category"
                v-model="form.visa_category"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option v-for="cat in VISA_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- Default Sections -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('templates.sections') }}
              </label>
              <div class="space-y-3">
                <div
                  v-for="(section, idx) in form.default_sections"
                  :key="idx"
                  class="border border-gray-200 rounded-lg p-3"
                >
                  <div class="flex items-start gap-2">
                    <div class="flex-1 space-y-2">
                      <input
                        v-model="section.title"
                        type="text"
                        :placeholder="t('templates.sectionTitle')"
                        class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <input
                        v-model="section.description"
                        type="text"
                        :placeholder="t('templates.sectionDescription')"
                        class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      @click="removeSection(idx)"
                      class="text-gray-400 hover:text-red-600 transition-colors p-1 mt-1"
                    >
                      <XMarkIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="addSection"
                class="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                <PlusIcon class="h-4 w-4" />
                {{ t('templates.addSection') }}
              </button>
            </div>

            <!-- Default Checklist -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('templates.checklist') }}
              </label>
              <div class="space-y-2">
                <div
                  v-for="(item, idx) in form.default_checklist"
                  :key="idx"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="item.name"
                    type="text"
                    :placeholder="t('templates.checklistItem')"
                    class="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <label class="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                    <input
                      v-model="item.required"
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    {{ t('templates.required') }}
                  </label>
                  <button
                    type="button"
                    @click="removeChecklistItem(idx)"
                    class="text-gray-400 hover:text-red-600 transition-colors p-1"
                  >
                    <XMarkIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="addChecklistItem"
                class="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                <PlusIcon class="h-4 w-4" />
                {{ t('templates.addChecklistItem') }}
              </button>
            </div>

            <!-- Default Notes -->
            <div>
              <label for="template-notes" class="block text-sm font-medium text-gray-700">
                {{ t('templates.defaultNotes') }}
              </label>
              <textarea
                id="template-notes"
                v-model="form.default_notes"
                rows="3"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
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
                :disabled="saving || !form.name.trim()"
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
      :message="t('templates.deleteConfirm')"
      :confirm-label="t('common.delete')"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
