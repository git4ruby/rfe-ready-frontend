<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useIdleTimer } from './composables/useIdleTimer'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.vue'
import NotificationToast from './components/NotificationToast.vue'
import SessionWarningModal from './components/SessionWarningModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const { showWarning, secondsLeft, dismissWarning, start, stop } = useIdleTimer()
const { showHelp } = useKeyboardShortcuts()

// Start/stop idle timer based on auth state
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      start(router)
    } else {
      stop()
    }
  },
  { immediate: true }
)
</script>

<template>
  <router-view />
  <NotificationToast />
  <SessionWarningModal
    :show="showWarning"
    :seconds-left="secondsLeft"
    @continue="dismissWarning"
  />
  <KeyboardShortcutsModal
    :show="showHelp"
    @close="showHelp = false"
  />
</template>
