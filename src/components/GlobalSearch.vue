<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MagnifyingGlassIcon, FolderIcon, BookOpenIcon, UserIcon } from '@heroicons/vue/24/outline'
import { useSearchStore } from '../stores/search'

const props = defineProps({
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const router = useRouter()
const searchStore = useSearchStore()
const inputRef = ref(null)
const selectedIndex = ref(0)

// Focus input when shown
watch(() => props.show, (val) => {
  if (val) {
    searchStore.clear()
    selectedIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

function onInput(e) {
  searchStore.search(e.target.value)
  selectedIndex.value = 0
}

// Flatten all results for keyboard navigation
const flatResults = computed(() => {
  const items = []
  for (const c of searchStore.results.cases) {
    items.push({ type: 'case', ...c })
  }
  for (const d of searchStore.results.knowledge_docs) {
    items.push({ type: 'knowledge_doc', ...d })
  }
  for (const u of searchStore.results.users) {
    items.push({ type: 'user', ...u })
  }
  return items
})

const hasResults = computed(() => flatResults.value.length > 0)
const hasQuery = computed(() => searchStore.query.length >= 2)

function onKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, flatResults.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && flatResults.value.length > 0) {
    e.preventDefault()
    navigate(flatResults.value[selectedIndex.value])
  }
}

function navigate(item) {
  if (item.type === 'case') {
    router.push(`/cases/${item.id}`)
  } else if (item.type === 'knowledge_doc') {
    router.push('/knowledge')
  } else if (item.type === 'user') {
    router.push('/users')
  }
  emit('close')
}

function statusColor(status) {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    review: 'bg-yellow-100 text-yellow-700',
    analyzing: 'bg-blue-100 text-blue-700',
    responded: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[60]">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

      <!-- Command palette -->
      <div class="relative mx-auto mt-[15vh] max-w-xl w-full px-4">
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden">
          <!-- Search input -->
          <div class="flex items-center px-4 border-b border-gray-200">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 shrink-0" />
            <input
              ref="inputRef"
              type="text"
              :value="searchStore.query"
              @input="onInput"
              @keydown="onKeydown"
              placeholder="Search cases, documents, users..."
              class="w-full border-0 py-3.5 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0"
            />
            <kbd class="hidden sm:inline-flex items-center rounded border border-gray-300 px-1.5 text-xs text-gray-400 font-sans">ESC</kbd>
          </div>

          <!-- Results -->
          <div v-if="hasQuery" class="max-h-80 overflow-y-auto">
            <!-- Loading -->
            <div v-if="searchStore.loading" class="px-4 py-6 text-center text-sm text-gray-400">
              Searching...
            </div>

            <!-- No results -->
            <div v-else-if="!hasResults" class="px-4 py-6 text-center text-sm text-gray-400">
              No results found for "{{ searchStore.query }}"
            </div>

            <template v-else>
              <!-- Cases -->
              <div v-if="searchStore.results.cases.length > 0">
                <p class="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">Cases</p>
                <button
                  v-for="(item, i) in searchStore.results.cases"
                  :key="item.id"
                  @click="navigate({ type: 'case', ...item })"
                  @mouseenter="selectedIndex = flatResults.findIndex(f => f.id === item.id && f.type === 'case')"
                  :class="[
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    flatResults.findIndex(f => f.id === item.id && f.type === 'case') === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  ]"
                >
                  <FolderIcon class="h-5 w-5 text-gray-400 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ item.case_number }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ item.petitioner_name }} &middot; {{ item.visa_type }}</p>
                  </div>
                  <span :class="['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusColor(item.status)]">
                    {{ item.status }}
                  </span>
                </button>
              </div>

              <!-- Knowledge Docs -->
              <div v-if="searchStore.results.knowledge_docs.length > 0">
                <p class="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">Knowledge Base</p>
                <button
                  v-for="item in searchStore.results.knowledge_docs"
                  :key="item.id"
                  @click="navigate({ type: 'knowledge_doc', ...item })"
                  @mouseenter="selectedIndex = flatResults.findIndex(f => f.id === item.id && f.type === 'knowledge_doc')"
                  :class="[
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    flatResults.findIndex(f => f.id === item.id && f.type === 'knowledge_doc') === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  ]"
                >
                  <BookOpenIcon class="h-5 w-5 text-gray-400 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
                    <p class="text-xs text-gray-500">{{ item.doc_type }}</p>
                  </div>
                </button>
              </div>

              <!-- Users -->
              <div v-if="searchStore.results.users.length > 0">
                <p class="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">Users</p>
                <button
                  v-for="item in searchStore.results.users"
                  :key="item.id"
                  @click="navigate({ type: 'user', ...item })"
                  @mouseenter="selectedIndex = flatResults.findIndex(f => f.id === item.id && f.type === 'user')"
                  :class="[
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    flatResults.findIndex(f => f.id === item.id && f.type === 'user') === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  ]"
                >
                  <UserIcon class="h-5 w-5 text-gray-400 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
                    <p class="text-xs text-gray-500">{{ item.email }} &middot; {{ item.role }}</p>
                  </div>
                </button>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-xs text-gray-400">
            <span><kbd class="font-sans border border-gray-300 rounded px-1">↑↓</kbd> Navigate</span>
            <span><kbd class="font-sans border border-gray-300 rounded px-1">↵</kbd> Open</span>
            <span><kbd class="font-sans border border-gray-300 rounded px-1">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
