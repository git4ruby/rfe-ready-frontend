import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Syncs filter/search/page state with URL query params.
 * Filters persist when navigating away and back.
 *
 * Usage:
 *   const { filters, currentPage, updateFilters, goToPage } = useQueryFilters({
 *     q: '',
 *     status: '',
 *   })
 */
export function useQueryFilters(defaults = {}, { onLoad } = {}) {
  const route = useRoute()
  const router = useRouter()

  const filters = ref({ ...defaults })
  const currentPage = ref(1)

  // Read initial state from URL query params
  function readFromQuery() {
    const query = route.query
    if (query.page) currentPage.value = parseInt(query.page, 10) || 1
    for (const key of Object.keys(defaults)) {
      if (query[key] !== undefined) {
        filters.value[key] = query[key]
      }
    }
  }

  // Write current state to URL query params (replace, not push)
  function writeToQuery() {
    const query = {}
    if (currentPage.value > 1) query.page = String(currentPage.value)
    for (const [key, val] of Object.entries(filters.value)) {
      if (val && val !== defaults[key]) {
        query[key] = val
      }
    }
    // Only update if query actually changed
    const currentQuery = { ...route.query }
    const changed = JSON.stringify(query) !== JSON.stringify(currentQuery)
    if (changed) {
      internalUpdate = true
      router.replace({ query })
    }
  }

  function updateFilters(newFilters) {
    Object.assign(filters.value, newFilters)
    currentPage.value = 1
    writeToQuery()
    if (onLoad) onLoad(currentPage.value)
  }

  function goToPage(page) {
    currentPage.value = page
    writeToQuery()
    if (onLoad) onLoad(page)
  }

  let internalUpdate = false

  // Watch for external route changes (browser back/forward, sidebar clicks)
  watch(
    () => route.query,
    () => {
      if (internalUpdate) {
        internalUpdate = false
        return
      }
      // Reset to defaults, then read from new query
      filters.value = { ...defaults }
      currentPage.value = 1
      readFromQuery()
      if (onLoad) onLoad(currentPage.value)
    }
  )

  // Initialize from URL on mount
  onMounted(() => {
    readFromQuery()
    if (onLoad) onLoad(currentPage.value)
  })

  return { filters, currentPage, updateFilters, goToPage }
}
