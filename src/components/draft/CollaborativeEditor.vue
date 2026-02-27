<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCollaborativeEditing } from '../../composables/useCollaborativeEditing'
import { LockClosedIcon, LockOpenIcon, UserGroupIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  draftId: { type: String, required: true },
  caseId: { type: String, required: true },
  lockedById: { type: String, default: null },
  lockedByName: { type: String, default: null },
  currentUserId: { type: String, required: true },
})

const emit = defineEmits(['lock-acquired', 'lock-released'])
const { t } = useI18n()
const { isLocked, lockedBy, lockLoading, acquireLock, releaseLock } = useCollaborativeEditing(props.draftId)

// Initialize from props
if (props.lockedById) {
  isLocked.value = true
  lockedBy.value = { id: props.lockedById, first_name: props.lockedByName }
}

const isLockedByMe = computed(() => lockedBy.value?.id === props.currentUserId)
const isLockedByOther = computed(() => isLocked.value && !isLockedByMe.value)

async function handleLock() {
  const success = await acquireLock(props.caseId)
  if (success) emit('lock-acquired')
}

async function handleUnlock() {
  await releaseLock(props.caseId)
  emit('lock-released')
}
</script>

<template>
  <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
    <template v-if="isLockedByMe">
      <LockClosedIcon class="h-4 w-4 text-green-600" />
      <span class="text-sm text-green-700 font-medium">{{ t('collaborative.editingActive') }}</span>
      <button
        @click="handleUnlock"
        class="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
      >{{ t('collaborative.releaseLock') }}</button>
    </template>
    <template v-else-if="isLockedByOther">
      <LockClosedIcon class="h-4 w-4 text-amber-500" />
      <span class="text-sm text-amber-700">{{ t('collaborative.lockedBy', { name: lockedBy?.first_name || t('collaborative.anotherUser') }) }}</span>
    </template>
    <template v-else>
      <LockOpenIcon class="h-4 w-4 text-gray-400" />
      <span class="text-sm text-gray-500">{{ t('collaborative.unlocked') }}</span>
      <button
        @click="handleLock"
        :disabled="lockLoading"
        class="ml-auto rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >{{ lockLoading ? t('common.loading') : t('collaborative.startEditing') }}</button>
    </template>
  </div>
</template>
