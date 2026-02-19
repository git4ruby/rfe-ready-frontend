import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import { useRouter } from 'vue-router'

const IDLE_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const WARNING_BEFORE = 60 * 1000 // Show warning 1 minute before logout

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

export function useIdleTimer() {
  const showWarning = ref(false)
  const secondsLeft = ref(60)

  let idleTimer = null
  let warningTimer = null
  let countdownInterval = null
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  let router = null 

  function resetTimers() {
    // Once warning is showing, only the explicit "I'm still here" button should dismiss it
    if (showWarning.value) {
      return
    }

    clearTimeout(idleTimer)
    clearTimeout(warningTimer)

    // Set warning timer (fires at 14 min)
    warningTimer = setTimeout(() => {
      showWarning.value = true
      secondsLeft.value = Math.floor(WARNING_BEFORE / 1000)

      countdownInterval = setInterval(() => {
        secondsLeft.value--
        if (secondsLeft.value <= 0) {
          clearInterval(countdownInterval)
        }
      }, 1000)
    }, IDLE_TIMEOUT - WARNING_BEFORE)

    // Set logout timer (fires at 15 min)
    idleTimer = setTimeout(() => {
      performLogout()
    }, IDLE_TIMEOUT)
  }

  function dismissWarning() {
    showWarning.value = false
    clearInterval(countdownInterval)
    resetTimers()
  }

  async function performLogout() {
    cleanup()
    await authStore.logout()
    notificationStore.show('You have been logged out due to inactivity.', 'info', 8000)
    router.push('/login')
  }

  function cleanup() {
    showWarning.value = false
    clearTimeout(idleTimer)
    clearTimeout(warningTimer)
    clearInterval(countdownInterval)
    ACTIVITY_EVENTS.forEach((event) => {
      document.removeEventListener(event, resetTimers)
    })
  }

  function start(routerInstance) {
    router = routerInstance
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, resetTimers, { passive: true })
    })
    resetTimers()
  }

  function stop() {
    cleanup()
  }

  return {
    showWarning,
    secondsLeft,
    dismissWarning,
    start,
    stop,
  }
}
