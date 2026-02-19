<script setup>
import { ChevronRightIcon, HomeIcon } from '@heroicons/vue/20/solid'

defineProps({
  items: {
    type: Array,
    required: true,
    // Each item: { label: string, to?: string }
    // Last item should have no `to` (it's the current page)
  },
})
</script>

<template>
  <nav class="flex items-center text-sm mb-4" aria-label="Breadcrumb">
    <ol class="flex items-center gap-1">
      <li>
        <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors">
          <HomeIcon class="h-4 w-4" />
        </router-link>
      </li>
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1">
        <ChevronRightIcon class="h-4 w-4 text-gray-300 shrink-0" />
        <router-link
          v-if="item.to"
          :to="item.to"
          class="text-gray-500 hover:text-gray-700 transition-colors"
        >
          {{ item.label }}
        </router-link>
        <span v-else class="text-gray-900 font-medium">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
