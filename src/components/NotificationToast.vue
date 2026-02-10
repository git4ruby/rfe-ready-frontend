<script setup>
import { useNotificationStore } from '../stores/notification'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const notificationStore = useNotificationStore()

function typeClasses(type) {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-400 text-green-800'
    case 'error':
      return 'bg-red-50 border-red-400 text-red-800'
    case 'info':
    default:
      return 'bg-blue-50 border-blue-400 text-blue-800'
  }
}

function iconColor(type) {
  switch (type) {
    case 'success':
      return 'text-green-400'
    case 'error':
      return 'text-red-400'
    case 'info':
    default:
      return 'text-blue-400'
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-96">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="[
          'border-l-4 rounded-lg shadow-lg p-4 flex items-start gap-3',
          typeClasses(notification.type),
        ]"
      >
        <!-- Icon -->
        <div class="shrink-0 mt-0.5">
          <!-- Success icon -->
          <svg
            v-if="notification.type === 'success'"
            :class="['h-5 w-5', iconColor(notification.type)]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Error icon -->
          <svg
            v-else-if="notification.type === 'error'"
            :class="['h-5 w-5', iconColor(notification.type)]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Info icon -->
          <svg
            v-else
            :class="['h-5 w-5', iconColor(notification.type)]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <!-- Message -->
        <p class="flex-1 text-sm font-medium">{{ notification.message }}</p>

        <!-- Dismiss button -->
        <button
          @click="notificationStore.remove(notification.id)"
          class="shrink-0 rounded-md p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
