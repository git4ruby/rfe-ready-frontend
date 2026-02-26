<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useRateLimitStore } from '../stores/rateLimit'
import { useOnboarding } from '../composables/useOnboarding'
import {
  HomeIcon,
  FolderIcon,
  BookOpenIcon,
  CogIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  CloudArrowUpIcon,
  FlagIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'
import NotificationPanel from '../components/NotificationPanel.vue'
import { useLiveNotificationsStore } from '../stores/liveNotifications'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const rateLimit = useRateLimitStore()
const { restartTour } = useOnboarding()
const notifStore = useLiveNotificationsStore()
const { t } = useI18n()

const sidebarOpen = ref(false)
const notifPanelOpen = ref(false)

// Start listening for real-time notifications
notifStore.startListening()

const navigation = [
  { nameKey: 'nav.dashboard', href: '/', icon: HomeIcon, routeName: 'Dashboard' },
  { nameKey: 'nav.cases', href: '/cases', icon: FolderIcon, routeName: 'Cases' },
  { nameKey: 'nav.knowledgeBase', href: '/knowledge', icon: BookOpenIcon, routeName: 'Knowledge' },
  { nameKey: 'nav.reports', href: '/reports', icon: ChartBarIcon, routeName: 'Reports' },
  { nameKey: 'nav.help', href: '/help', icon: QuestionMarkCircleIcon, routeName: 'Help' },
]

const adminNavigation = [
  { nameKey: 'nav.settings', href: '/settings', icon: CogIcon, routeName: 'Settings' },
  { nameKey: 'nav.users', href: '/users', icon: UsersIcon, routeName: 'Users' },
  { nameKey: 'nav.auditLog', href: '/audit-log', icon: ClipboardDocumentListIcon, routeName: 'AuditLog' },
  { nameKey: 'nav.featureFlags', href: '/feature-flags', icon: FlagIcon, routeName: 'FeatureFlags' },
  { nameKey: 'nav.backups', href: '/backups', icon: CloudArrowUpIcon, routeName: 'Backups' },
]

function isActive(item) {
  if (item.href === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(item.href)
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-800">
        <router-link to="/" class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span class="text-white font-bold text-sm">R</span>
          </div>
          <span class="text-lg font-bold tracking-tight">RFE Ready</span>
        </router-link>
        <button
          class="lg:hidden text-gray-400 hover:text-white"
          @click="sidebarOpen = false"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :id="`nav-${item.routeName.toLowerCase()}`"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive(item)
              ? 'bg-gray-800 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
          ]"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          {{ t(item.nameKey) }}
        </router-link>

        <!-- Admin section -->
        <template v-if="authStore.isAdmin">
          <div class="pt-4 pb-2 px-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {{ t('nav.administration') }}
            </p>
          </div>
          <router-link
            v-for="item in adminNavigation"
            :key="item.name"
            :id="`nav-${item.routeName.toLowerCase()}`"
            :to="item.href"
            :class="[
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(item)
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white',
            ]"
            @click="sidebarOpen = false"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            {{ t(item.nameKey) }}
          </router-link>
        </template>
      </nav>

      <!-- Rate limit warning -->
      <div v-if="rateLimit.isWarning" class="px-4 py-2 bg-amber-900/50 border-t border-amber-700">
        <p class="text-xs text-amber-300">API rate limit: {{ rateLimit.remaining }}/{{ rateLimit.limit }} remaining</p>
        <div class="mt-1 w-full bg-amber-800 rounded-full h-1">
          <div class="bg-amber-400 h-1 rounded-full" :style="{ width: rateLimit.percentUsed + '%' }" />
        </div>
      </div>

      <!-- User info -->
      <div class="border-t border-gray-800 p-4 space-y-3">
        <router-link to="/profile" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div class="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <span class="text-sm font-medium text-white">
              {{ authStore.user?.first_name?.[0] || 'U' }}{{ authStore.user?.last_name?.[0] || '' }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ authStore.fullName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ authStore.user?.role }}</p>
          </div>
        </router-link>
        <div class="flex items-center justify-between">
          <button
            @click="notifPanelOpen = true"
            class="text-gray-400 hover:text-white transition-colors relative p-1.5 rounded-lg hover:bg-gray-800"
            title="Notifications"
          >
            <BellIcon class="h-5 w-5" />
            <span
              v-if="notifStore.unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold"
            >
              {{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}
            </span>
          </button>
          <button
            @click="restartTour"
            class="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            title="Restart guided tour"
          >
            <QuestionMarkCircleIcon class="h-5 w-5" />
          </button>
          <button
            @click="themeStore.toggle()"
            class="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <SunIcon v-if="themeStore.isDark" class="h-5 w-5" />
            <MoonIcon v-else class="h-5 w-5" />
          </button>
          <button
            @click="handleLogout"
            class="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0 theme-main">
      <!-- Top bar -->
      <!-- Mobile top bar (hamburger only, hidden on desktop) -->
      <header class="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center px-4 lg:hidden">
        <button
          class="text-gray-500 hover:text-gray-700"
          @click="sidebarOpen = true"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>
        <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{{ route.meta?.title || route.name }}</span>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 lg:p-6 bg-gray-50 overflow-auto">
        <router-view />
      </main>
    </div>

    <!-- Notification slide-over -->
    <NotificationPanel :show="notifPanelOpen" @close="notifPanelOpen = false" />
  </div>
</template>
