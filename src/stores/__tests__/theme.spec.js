import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useThemeStore } from '../theme'

describe('theme store', () => {
  let store

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset classList
    document.documentElement.classList.remove('dark')
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('defaults to light (isDark false) when localStorage has no theme', () => {
      store = useThemeStore()

      expect(store.isDark).toBe(false)
    })

    it('initializes isDark true when localStorage has dark theme', () => {
      localStorage.setItem('rfe_theme', 'dark')
      store = useThemeStore()

      expect(store.isDark).toBe(true)
    })

    it('initializes isDark false when localStorage has light theme', () => {
      localStorage.setItem('rfe_theme', 'light')
      store = useThemeStore()

      expect(store.isDark).toBe(false)
    })
  })

  describe('toggle()', () => {
    it('flips isDark from false to true', () => {
      store = useThemeStore()
      expect(store.isDark).toBe(false)

      store.toggle()

      expect(store.isDark).toBe(true)
    })

    it('flips isDark from true to false', () => {
      localStorage.setItem('rfe_theme', 'dark')
      store = useThemeStore()
      expect(store.isDark).toBe(true)

      store.toggle()

      expect(store.isDark).toBe(false)
    })

    it('can toggle multiple times', () => {
      store = useThemeStore()

      store.toggle()
      expect(store.isDark).toBe(true)

      store.toggle()
      expect(store.isDark).toBe(false)

      store.toggle()
      expect(store.isDark).toBe(true)
    })
  })

  describe('localStorage sync', () => {
    it('persists dark to localStorage when toggled on', async () => {
      store = useThemeStore()

      store.toggle()
      await nextTick()

      expect(localStorage.getItem('rfe_theme')).toBe('dark')
    })

    it('persists light to localStorage when toggled off', async () => {
      localStorage.setItem('rfe_theme', 'dark')
      store = useThemeStore()

      store.toggle()
      await nextTick()

      expect(localStorage.getItem('rfe_theme')).toBe('light')
    })
  })

  describe('document class sync', () => {
    it('adds dark class to documentElement when isDark is true', () => {
      localStorage.setItem('rfe_theme', 'dark')
      store = useThemeStore()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class from documentElement when isDark is false', () => {
      document.documentElement.classList.add('dark')
      store = useThemeStore()

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('toggles dark class on toggle', async () => {
      store = useThemeStore()

      store.toggle()
      await nextTick()
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      store.toggle()
      await nextTick()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
