import { createConsumer } from '@rails/actioncable'
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

let consumer = null
const subscriptions = ref([])

export function useCable() {
  const authStore = useAuthStore()

  function connect() {
    if (consumer) return consumer

    const token = authStore.token
    if (!token) return null

    const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
    consumer = createConsumer(`${wsBase}/cable?token=${token}`)
    return consumer
  }

  function subscribe(channel, params = {}, callbacks = {}) {
    const c = connect()
    if (!c) return null

    const sub = c.subscriptions.create(
      { channel, ...params },
      {
        received(data) {
          callbacks.received?.(data)
        },
        connected() {
          callbacks.connected?.()
        },
        disconnected() {
          callbacks.disconnected?.()
        },
      }
    )
    subscriptions.value.push(sub)
    return sub
  }

  function disconnect() {
    subscriptions.value.forEach(sub => sub.unsubscribe())
    subscriptions.value = []
    if (consumer) {
      consumer.disconnect()
      consumer = null
    }
  }

  // Auto-disconnect on logout
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (!isAuth) disconnect()
    }
  )

  return { connect, subscribe, disconnect }
}
