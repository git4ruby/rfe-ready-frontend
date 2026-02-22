import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const results = ref({ cases: [], knowledge_docs: [], users: [] })
  const loading = ref(false)
  let debounceTimer = null

  async function search(q) {
    query.value = q
    if (!q || q.length < 2) {
      results.value = { cases: [], knowledge_docs: [], users: [] }
      loading.value = false
      return
    }

    loading.value = true
    clearTimeout(debounceTimer)

    debounceTimer = setTimeout(async () => {
      try {
        const response = await apiClient.get('/search', { params: { q } })
        results.value = response.data.data
      } catch {
        results.value = { cases: [], knowledge_docs: [], users: [] }
      } finally {
        loading.value = false
      }
    }, 300)
  }

  function clear() {
    query.value = ''
    results.value = { cases: [], knowledge_docs: [], users: [] }
    loading.value = false
  }

  return { query, results, loading, search, clear }
})
