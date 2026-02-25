import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../api/client', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    rateLimitData: { limit: 0, remaining: 0, resetAt: 0 },
  }
})

import { rateLimitData } from '../../api/client'
import { useRateLimitStore } from '../rateLimit'

describe('rateLimit store', () => {
  let store

  beforeEach(() => {
    vi.useFakeTimers()
    // Reset rateLimitData before each test
    rateLimitData.limit = 0
    rateLimitData.remaining = 0
    rateLimitData.resetAt = 0

    setActivePinia(createPinia())
    store = useRateLimitStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with zero values', () => {
      expect(store.limit).toBe(0)
      expect(store.remaining).toBe(0)
      expect(store.resetAt).toBe(0)
    })
  })

  describe('sync()', () => {
    it('reads limit from rateLimitData', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 950
      rateLimitData.resetAt = 1700000000

      store.sync()

      expect(store.limit).toBe(1000)
      expect(store.remaining).toBe(950)
      expect(store.resetAt).toBe(1700000000)
    })

    it('updates values when rateLimitData changes', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 500
      rateLimitData.resetAt = 1700000000
      store.sync()

      expect(store.remaining).toBe(500)

      rateLimitData.remaining = 499
      store.sync()

      expect(store.remaining).toBe(499)
    })
  })

  describe('percentUsed computed', () => {
    it('returns 0 when limit is 0', () => {
      expect(store.percentUsed).toBe(0)
    })

    it('calculates percent used correctly', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 750
      store.sync()

      // (1000 - 750) / 1000 * 100 = 25
      expect(store.percentUsed).toBe(25)
    })

    it('returns 100 when all requests are used', () => {
      rateLimitData.limit = 100
      rateLimitData.remaining = 0
      store.sync()

      expect(store.percentUsed).toBe(100)
    })

    it('returns 0 when no requests are used', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 1000
      store.sync()

      expect(store.percentUsed).toBe(0)
    })

    it('rounds to nearest integer', () => {
      rateLimitData.limit = 3
      rateLimitData.remaining = 1
      store.sync()

      // (3 - 1) / 3 * 100 = 66.666... -> 67
      expect(store.percentUsed).toBe(67)
    })
  })

  describe('isWarning computed', () => {
    it('returns false when limit is 0', () => {
      expect(store.isWarning).toBe(false)
    })

    it('returns false when remaining is above 20% of limit', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 300
      store.sync()

      expect(store.isWarning).toBe(false)
    })

    it('returns false when remaining is exactly 20% of limit', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 200
      store.sync()

      // remaining (200) < limit * 0.2 (200) is false
      expect(store.isWarning).toBe(false)
    })

    it('returns true when remaining is below 20% of limit', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 199
      store.sync()

      expect(store.isWarning).toBe(true)
    })

    it('returns true when remaining is 0', () => {
      rateLimitData.limit = 1000
      rateLimitData.remaining = 0
      store.sync()

      expect(store.isWarning).toBe(true)
    })
  })
})
