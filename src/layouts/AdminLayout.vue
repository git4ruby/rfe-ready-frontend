<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import {
  HomeIcon,
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const sidebarOpen = ref(false)

const navigation = [
  { name: 'Platform Dashboard', href: '/platform', icon: HomeIcon, routeName: 'AdminDashboard' },
  { name: 'Tenants', href: '/platform/tenants', icon: BuildingOfficeIcon, routeName: 'AdminTenants' },
]

function isActive(item) {
  if (item.href === '/platform') return route.path === '/platform'
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
        'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-slate-800">
        <router-link to="/platform" class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
            <span class="text-white font-bold text-sm">SA</span>
          </div>
          <span class="text-lg font-bold tracking-tight">RFE Platform</span>
        </router-link>
        <button class="lg:hidden text-gray-400 hover:text-white" @click="sidebarOpen = false">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive(item)
              ? 'bg-slate-800 text-white'
              : 'text-gray-300 hover:bg-slate-800 hover:text-white',
          ]"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          {{ item.name }}
        </router-link>
      </nav>

      <!-- User info -->
      <div class="border-t border-slate-800 p-4 space-y-3">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <span class="text-sm font-medium text-white">
              {{ authStore.user?.first_name?.[0] || 'S' }}{{ authStore.user?.last_name?.[0] || 'A' }}
            </span>
          </div>
          <router-link to="/platform/profile" class="flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <p class="text-sm font-medium text-white truncate">{{ authStore.fullName }}</p>
            <p class="text-xs text-red-400 truncate">Super Admin</p>
          </router-link>
          <button
            @click="themeStore.toggle()"
            class="shrink-0 text-gray-400 hover:text-white transition-colors"
            :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <SunIcon v-if="themeStore.isDark" class="h-5 w-5" />
            <MoonIcon v-else class="h-5 w-5" />
          </button>
          <button
            @click="handleLogout"
            class="shrink-0 text-gray-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 theme-main">
      <!-- Mobile top bar (hamburger only, hidden on desktop) -->
      <header class="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center px-4 lg:hidden">
        <button class="text-gray-500 hover:text-gray-700" @click="sidebarOpen = true">
          <Bars3Icon class="h-6 w-6" />
        </button>
        <span class="ml-3 text-red-600 font-medium text-xs uppercase tracking-wider bg-red-50 px-2 py-1 rounded">Super Admin</span>
        <span class="ml-2 text-sm font-medium text-gray-900">{{ route.meta?.title || route.name }}</span>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 lg:p-6 bg-gray-50 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
