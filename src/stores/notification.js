import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  let nextId = 0

  function show(message, type = 'info', duration = 5000) {
    const id = nextId++
    notifications.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }

  function success(message) {
    show(message, 'success')
  }

  function error(message) {
    show(message, 'error', 8000)
  }

  function remove(id) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  return { notifications, show, success, error, remove }
})
