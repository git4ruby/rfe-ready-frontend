<script setup>
import { ref, computed } from 'vue'
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import { helpArticles, helpCategories } from '../data/help-articles.js'

const search = ref('')
const expandedSlugs = ref(new Set())
const selectedCategory = ref('All')

const filteredArticles = computed(() => {
  let articles = helpArticles
  if (selectedCategory.value !== 'All') {
    articles = articles.filter(a => a.category === selectedCategory.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    )
  }
  return articles
})

const groupedArticles = computed(() => {
  const groups = {}
  for (const article of filteredArticles.value) {
    if (!groups[article.category]) groups[article.category] = []
    groups[article.category].push(article)
  }
  return groups
})

function toggle(slug) {
  if (expandedSlugs.value.has(slug)) {
    expandedSlugs.value.delete(slug)
  } else {
    expandedSlugs.value.add(slug)
  }
}

function isExpanded(slug) {
  return expandedSlugs.value.has(slug)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Help Center</h1>
      <p class="mt-1 text-sm text-gray-500">Find answers to common questions about using RFE Ready.</p>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1">
        <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search articles..."
          class="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <select
        v-model="selectedCategory"
        class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
      >
        <option value="All">All Categories</option>
        <option v-for="cat in helpCategories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- No results -->
    <div v-if="filteredArticles.length === 0" class="text-center py-12">
      <p class="text-sm text-gray-500">No articles found matching your search.</p>
    </div>

    <!-- Grouped Articles -->
    <div v-else class="space-y-8">
      <div v-for="(articles, category) in groupedArticles" :key="category">
        <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">{{ category }}</h2>
        <div class="bg-white shadow rounded-lg divide-y divide-gray-200">
          <div v-for="article in articles" :key="article.slug">
            <button
              @click="toggle(article.slug)"
              class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span class="text-sm font-medium text-gray-900">{{ article.title }}</span>
              <ChevronUpIcon v-if="isExpanded(article.slug)" class="h-5 w-5 text-gray-400 shrink-0" />
              <ChevronDownIcon v-else class="h-5 w-5 text-gray-400 shrink-0" />
            </button>
            <div
              v-if="isExpanded(article.slug)"
              class="px-6 pb-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line"
            >{{ article.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
