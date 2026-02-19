<script setup>
import { ref } from 'vue'
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline'
import { copyToClipboard } from '../utils/formatting'

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: 'Copy',
  },
})

const copied = ref(false)

async function handleCopy() {
  const success = await copyToClipboard(props.text)
  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<template>
  <button
    @click.stop="handleCopy"
    :title="copied ? 'Copied!' : label"
    class="inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors"
  >
    <ClipboardDocumentCheckIcon v-if="copied" class="h-4 w-4 text-green-500" />
    <ClipboardDocumentIcon v-else class="h-4 w-4" />
  </button>
</template>
