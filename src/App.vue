<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { useFeaturesStore } from './stores/features'
import { useIdleTimer } from './composables/useIdleTimer'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { setLocale } from './i18n'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.vue'
import GlobalSearch from './components/GlobalSearch.vue'
import NotificationToast from './components/NotificationToast.vue'
import SessionWarningModal from './components/SessionWarningModal.vue'

const router = useRouter()
const authStore = useAuthStore()
useThemeStore() // Initialize theme (applies dark class from localStorage)
const featuresStore = useFeaturesStore()
const { showWarning, secondsLeft, dismissWarning, start, stop } = useIdleTimer()
const { showHelp, showSearch } = useKeyboardShortcuts()

// Start/stop idle timer based on auth state
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      start(router)
      featuresStore.fetchFlags()
      // Sync locale from user preferences
      const userLocale = authStore.user?.preferences?.locale
      if (userLocale) setLocale(userLocale)
    } else {
      stop()
      featuresStore.reset()
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
  <GlobalSearch
    :show="showSearch"
    @close="showSearch = false"
  />
  <KeyboardShortcutsModal
    :show="showHelp"
    @close="showHelp = false"
  />
</template>
