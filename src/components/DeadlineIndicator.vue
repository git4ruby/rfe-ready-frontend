<script setup>
import { computed } from 'vue'
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  deadline: {
    type: String,
    required: true,
  },
})

const daysRemaining = computed(() => {
  if (!props.deadline) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(props.deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  const diffMs = deadlineDate - now
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
})

const isOverdue = computed(() => daysRemaining.value !== null && daysRemaining.value < 0)

const colorClasses = computed(() => {
  if (daysRemaining.value === null) return 'text-gray-500'
  if (daysRemaining.value < 0) return 'text-red-600'
  if (daysRemaining.value <= 7) return 'text-red-600'
  if (daysRemaining.value <= 14) return 'text-yellow-600'
  return 'text-green-600'
})

const bgClasses = computed(() => {
  if (daysRemaining.value === null) return 'bg-gray-50'
  if (daysRemaining.value < 0) return 'bg-red-50'
  if (daysRemaining.value <= 7) return 'bg-red-50'
  if (daysRemaining.value <= 14) return 'bg-yellow-50'
  return 'bg-green-50'
})

const label = computed(() => {
  if (daysRemaining.value === null) return 'No deadline'
  if (daysRemaining.value < 0) return 'Overdue'
  if (daysRemaining.value === 0) return 'Due today'
  if (daysRemaining.value === 1) return '1 day left'
  return `${daysRemaining.value} days left`
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
      colorClasses,
      bgClasses,
    ]"
  >
    <ExclamationTriangleIcon v-if="isOverdue" class="h-3.5 w-3.5" />
    <ClockIcon v-else class="h-3.5 w-3.5" />
    {{ label }}
  </span>
</template>
