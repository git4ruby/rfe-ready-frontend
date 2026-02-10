<script setup>
import { FolderOpenIcon } from '@heroicons/vue/24/outline'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: [Object, Function],
    default: null,
  },
})
</script>

<template>
  <div class="text-center py-12 px-4">
    <component
      :is="icon || FolderOpenIcon"
      class="mx-auto h-12 w-12 text-gray-400"
    />
    <h3 class="mt-4 text-lg font-semibold text-gray-900">{{ title }}</h3>
    <p v-if="description" class="mt-2 text-sm text-gray-500 max-w-md mx-auto">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
