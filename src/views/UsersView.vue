<script setup>
import { ref } from 'vue'
import { UsersIcon } from '@heroicons/vue/24/outline'

const placeholderUsers = ref([
  { id: 1, name: 'John Smith', email: 'john@example.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'attorney', status: 'active' },
  { id: 3, name: 'Mike Williams', email: 'mike@example.com', role: 'paralegal', status: 'active' },
  { id: 4, name: 'Emily Brown', email: 'emily@example.com', role: 'viewer', status: 'invited' },
])

function roleClasses(role) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-700'
    case 'attorney':
      return 'bg-blue-100 text-blue-700'
    case 'paralegal':
      return 'bg-green-100 text-green-700'
    case 'viewer':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function statusClasses(status) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'invited':
      return 'bg-yellow-100 text-yellow-700'
    case 'disabled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
      <p class="mt-1 text-sm text-gray-500">Manage team members and their roles.</p>
    </div>

    <!-- Users table -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="user in placeholderUsers"
              :key="user.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span class="text-xs font-medium text-indigo-700">
                      {{ user.name.split(' ').map(n => n[0]).join('') }}
                    </span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize',
                    roleClasses(user.role),
                  ]"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize',
                    statusClasses(user.status),
                  ]"
                >
                  {{ user.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer placeholder -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UsersIcon class="h-4 w-4" />
          <span>User management coming soon -- invite, edit roles, and deactivate users.</span>
        </div>
      </div>
    </div>
  </div>
</template>
