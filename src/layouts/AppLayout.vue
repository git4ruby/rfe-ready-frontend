<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  HomeIcon,
  FolderIcon,
  BookOpenIcon,
  CogIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarOpen = ref(false)

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, routeName: 'Dashboard' },
  { name: 'Cases', href: '/cases', icon: FolderIcon, routeName: 'Cases' },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpenIcon, routeName: 'Knowledge' },
]

const adminNavigation = [
  { name: 'Settings', href: '/settings', icon: CogIcon, routeName: 'Settings' },
  { name: 'Users', href: '/users', icon: UsersIcon, routeName: 'Users' },
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
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
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
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navigation"
          :key="item.name"
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
          {{ item.name }}
        </router-link>

        <!-- Admin section -->
        <template v-if="authStore.isAdmin">
          <div class="pt-4 pb-2 px-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Administration
            </p>
          </div>
          <router-link
            v-for="item in adminNavigation"
            :key="item.name"
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
            {{ item.name }}
          </router-link>
        </template>
      </nav>

      <!-- User info -->
      <div class="border-t border-gray-800 p-4">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <span class="text-sm font-medium text-white">
              {{ authStore.user?.first_name?.[0] || 'U' }}{{ authStore.user?.last_name?.[0] || '' }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ authStore.fullName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ authStore.user?.role }}</p>
          </div>
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

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6">
        <button
          class="lg:hidden mr-4 text-gray-500 hover:text-gray-700"
          @click="sidebarOpen = true"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>
        <div class="flex-1">
          <!-- Breadcrumb area -->
          <nav class="text-sm text-gray-500">
            <span class="text-gray-900 font-medium">{{ route.meta?.title || route.name }}</span>
          </nav>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 lg:p-6 bg-gray-50 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
