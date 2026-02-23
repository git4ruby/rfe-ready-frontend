import { vi } from 'vitest'

const apiClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  defaults: {
    headers: { common: {} },
  },
}

export default apiClient

export const rateLimitData = { limit: 0, remaining: 0, resetAt: 0 }
