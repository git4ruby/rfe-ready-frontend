<script setup>
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalCount: { type: Number, default: null },
  maxVisible: { type: Number, default: 7 },
  activeClass: { type: String, default: 'bg-indigo-600 text-white' },
})

const emit = defineEmits(['page-change'])

const pages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const max = props.maxVisible

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const items = []
  // Always show first page
  items.push(1)

  // Calculate range around current page
  const sideCount = Math.floor((max - 4) / 2) // subtract first, last, and 2 ellipses
  let rangeStart = Math.max(2, current - sideCount)
  let rangeEnd = Math.min(total - 1, current + sideCount)

  // Adjust if near the start
  if (current <= sideCount + 2) {
    rangeStart = 2
    rangeEnd = Math.min(total - 1, max - 2)
  }

  // Adjust if near the end
  if (current >= total - sideCount - 1) {
    rangeStart = Math.max(2, total - max + 3)
    rangeEnd = total - 1
  }

  // Add ellipsis before range if needed
  if (rangeStart > 2) {
    items.push('...')
  }

  // Add range pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    items.push(i)
  }

  // Add ellipsis after range if needed
  if (rangeEnd < total - 1) {
    items.push('...')
  }

  // Always show last page
  items.push(total)

  return items
})
</script>

<template>
  <div
    v-if="totalPages > 1"
    class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
  >
    <div class="text-sm text-gray-500">
      Page {{ currentPage }} of {{ totalPages }}<span v-if="totalCount != null"> ({{ totalCount.toLocaleString() }} total)</span>
    </div>
    <nav class="flex items-center gap-1">
      <!-- Previous -->
      <button
        :disabled="currentPage <= 1"
        @click="emit('page-change', currentPage - 1)"
        class="relative inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon class="h-4 w-4" />
      </button>

      <!-- Page numbers -->
      <template v-for="(page, idx) in pages" :key="idx">
        <span
          v-if="page === '...'"
          class="px-2 py-1.5 text-sm text-gray-400"
        >...</span>
        <button
          v-else
          @click="emit('page-change', page)"
          :class="[
            'relative inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            page === currentPage
              ? activeClass
              : 'text-gray-700 hover:bg-gray-50',
          ]"
        >
          {{ page }}
        </button>
      </template>

      <!-- Next -->
      <button
        :disabled="currentPage >= totalPages"
        @click="emit('page-change', currentPage + 1)"
        class="relative inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon class="h-4 w-4" />
      </button>
    </nav>
  </div>
</template>
