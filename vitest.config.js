import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/main.js', 'src/test/**', 'src/**/__mocks__/**', 'src/assets/**', 'src/data/**'],
    },
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000',
      VITE_API_URL: 'http://localhost:3000/api/v1',
    },
  },
})
