<script setup>
import { XMarkIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { useLiveNotificationsStore } from '../stores/liveNotifications'

defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
const notifStore = useLiveNotificationsStore()

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function typeColor(type) {
  const colors = {
    case_status_change: 'bg-blue-100 text-blue-700',
    draft_ready: 'bg-green-100 text-green-700',
    analysis_complete: 'bg-indigo-100 text-indigo-700',
    case_assigned: 'bg-yellow-100 text-yellow-700',
    deadline_approaching: 'bg-red-100 text-red-700',
  }
  return colors[type] || 'bg-gray-100 text-gray-700'
}
</script>

<template>
  <!-- Slide-over panel -->
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="emit('close')" />

      <!-- Panel -->
      <div class="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 class="text-sm font-semibold text-gray-900">Notifications</h2>
          <div class="flex items-center gap-2">
            <button
              v-if="notifStore.unreadCount > 0"
              @click="notifStore.markAllRead()"
              class="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Mark all read
            </button>
            <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Notification list -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="notifStore.notifications.length === 0" class="p-6 text-center text-sm text-gray-400">
            No notifications yet.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="n in notifStore.notifications"
              :key="n.id"
              :class="['px-4 py-3 flex items-start gap-3 transition-colors', n.read ? 'bg-white' : 'bg-indigo-50/50']"
            >
              <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5', typeColor(n.type)]">
                {{ n.type?.replace(/_/g, ' ') || 'update' }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ n.title }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ n.body }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ timeAgo(n.created_at) }}</p>
              </div>
              <button
                v-if="!n.read"
                @click="notifStore.markAsRead(n.id)"
                class="shrink-0 text-gray-300 hover:text-indigo-500 mt-1"
                title="Mark as read"
              >
                <CheckIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
