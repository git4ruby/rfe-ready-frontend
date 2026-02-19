<script setup>
defineProps({
  variant: {
    type: String,
    default: 'table',
    validator: (v) => ['table', 'card', 'detail', 'list'].includes(v),
  },
  rows: {
    type: Number,
    default: 5,
  },
  columns: {
    type: Number,
    default: 4,
  },
})
</script>

<template>
  <!-- Table skeleton -->
  <div v-if="variant === 'table'" class="bg-white rounded-lg shadow overflow-hidden">
    <!-- Header -->
    <div class="border-b border-gray-200 px-6 py-4 flex gap-4">
      <div v-for="c in columns" :key="c" class="h-4 bg-gray-200 rounded animate-pulse" :style="{ width: c === 1 ? '30%' : '20%' }" />
    </div>
    <!-- Rows -->
    <div v-for="r in rows" :key="r" class="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
      <div v-for="c in columns" :key="c" class="h-3.5 bg-gray-100 rounded animate-pulse" :style="{ width: `${15 + Math.random() * 20}%` }" />
    </div>
  </div>

  <!-- Card grid skeleton -->
  <div v-else-if="variant === 'card'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div v-for="r in rows" :key="r" class="bg-white rounded-lg shadow p-5 space-y-3">
      <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      <div class="h-3 bg-gray-100 rounded animate-pulse w-full" />
      <div class="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
      <div class="flex gap-2 pt-2">
        <div class="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
        <div class="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
      </div>
    </div>
  </div>

  <!-- Detail page skeleton -->
  <div v-else-if="variant === 'detail'" class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div class="space-y-2 flex-1">
          <div class="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
          <div class="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
        </div>
        <div class="flex gap-2">
          <div class="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
          <div class="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div v-for="i in 4" :key="i" class="space-y-1">
          <div class="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
    </div>
    <!-- Content block -->
    <div class="bg-white rounded-lg shadow p-6 space-y-3">
      <div class="h-5 bg-gray-200 rounded animate-pulse w-1/4" />
      <div class="h-3 bg-gray-100 rounded animate-pulse w-full" />
      <div class="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
      <div class="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
    </div>
  </div>

  <!-- Simple list skeleton -->
  <div v-else-if="variant === 'list'" class="space-y-3">
    <div v-for="r in rows" :key="r" class="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      <div class="h-10 w-10 bg-gray-200 rounded-full animate-pulse shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
        <div class="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
      </div>
      <div class="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
    </div>
  </div>
</template>
