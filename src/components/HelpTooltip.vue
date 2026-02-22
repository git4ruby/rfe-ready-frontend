<script setup>
import { ref, computed } from 'vue'
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { helpArticles } from '../data/help-articles.js'

const props = defineProps({
  article: { type: String, required: true },
})

const show = ref(false)

const articleData = computed(() => helpArticles.find(a => a.slug === props.article))

const summary = computed(() => {
  if (!articleData.value) return ''
  const text = articleData.value.content
  const end = text.indexOf('\n\n')
  return end > 0 ? text.substring(0, end) : text.substring(0, 200)
})
</script>

<template>
  <span class="relative inline-flex">
    <button
      @click.stop="show = !show"
      class="text-gray-400 hover:text-indigo-500 transition-colors"
      type="button"
    >
      <QuestionMarkCircleIcon class="h-4 w-4" />
    </button>
    <div
      v-if="show && articleData"
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
    >
      <div class="flex items-start justify-between gap-2 mb-2">
        <h4 class="text-sm font-semibold text-gray-900">{{ articleData.title }}</h4>
        <button @click.stop="show = false" class="text-gray-400 hover:text-gray-600 shrink-0">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
      <p class="text-xs text-gray-600 leading-relaxed">{{ summary }}</p>
      <router-link
        :to="`/help`"
        class="inline-block mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
        @click="show = false"
      >
        Read more &rarr;
      </router-link>
    </div>
  </span>
</template>
