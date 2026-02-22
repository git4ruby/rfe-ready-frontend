import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCable } from '../composables/useCable'

export const useLiveNotificationsStore = defineStore('liveNotifications', () => {
  const notifications = ref([])
  const maxNotifications = 50
  let subscribed = false

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  function addNotification(data) {
    notifications.value.unshift({
      ...data,
      read: false,
    })
    // Keep only the most recent notifications
    if (notifications.value.length > maxNotifications) {
      notifications.value = notifications.value.slice(0, maxNotifications)
    }
  }

  function markAsRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  function markAllRead() {
    notifications.value.forEach(n => (n.read = true))
  }

  function clear() {
    notifications.value = []
  }

  function startListening() {
    if (subscribed) return

    const { subscribe } = useCable()

    // Personal notifications
    subscribe('NotificationChannel', {}, {
      received(data) {
        addNotification(data)
      },
    })

    // Tenant-wide case updates
    subscribe('CaseUpdatesChannel', {}, {
      received(data) {
        addNotification({
          id: data.id,
          type: data.type,
          title: `Case ${data.case_number}`,
          body: data.message,
          data: { case_id: data.case_id },
          created_at: data.created_at,
        })
      },
    })

    subscribed = true
  }

  function stopListening() {
    const { disconnect } = useCable()
    disconnect()
    subscribed = false
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllRead,
    clear,
    startListening,
    stopListening,
  }
})
