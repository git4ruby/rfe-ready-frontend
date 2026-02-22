import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rateLimitData } from '../api/client'

export const useRateLimitStore = defineStore('rateLimit', () => {
  const limit = ref(0)
  const remaining = ref(0)
  const resetAt = ref(0)

  const percentUsed = computed(() => {
    if (!limit.value) return 0
    return Math.round(((limit.value - remaining.value) / limit.value) * 100)
  })

  const isWarning = computed(() => limit.value > 0 && remaining.value < limit.value * 0.2)

  // Sync from shared data (called after API responses)
  function sync() {
    limit.value = rateLimitData.limit
    remaining.value = rateLimitData.remaining
    resetAt.value = rateLimitData.resetAt
  }

  // Poll every 2 seconds to pick up latest header data
  setInterval(sync, 2000)

  return { limit, remaining, resetAt, percentUsed, isWarning, sync }
})
