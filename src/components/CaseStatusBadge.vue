<script setup>
defineProps({
  status: {
    type: String,
    required: true,
  },
})

const statusConfig = {
  draft: {
    classes: 'bg-gray-100 text-gray-700',
    label: 'Draft',
  },
  analyzing: {
    classes: 'bg-amber-100 text-amber-700',
    label: 'Analyzing',
  },
  review: {
    classes: 'bg-blue-100 text-blue-700',
    label: 'In Review',
  },
  responded: {
    classes: 'bg-green-100 text-green-700',
    label: 'Responded',
  },
  archived: {
    classes: 'bg-gray-200 text-gray-600',
    label: 'Archived',
  },
}

function getConfig(status) {
  return (
    statusConfig[status] || {
      classes: 'bg-gray-100 text-gray-700',
      label: status,
    }
  )
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
      getConfig(status).classes,
    ]"
  >
    {{ getConfig(status).label }}
  </span>
</template>
