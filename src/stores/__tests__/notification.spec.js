import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '../notification'

describe('notification store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useNotificationStore()
  })

  describe('show()', () => {
    it('adds a notification with default type info', () => {
      store.show('Hello')
      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0]).toMatchObject({ message: 'Hello', type: 'info' })
    })

    it('adds a notification with custom type', () => {
      store.show('Warning', 'warning')
      expect(store.notifications[0].type).toBe('warning')
    })

    it('assigns unique incremental ids', () => {
      store.show('First')
      store.show('Second')
      expect(store.notifications[0].id).not.toBe(store.notifications[1].id)
    })

    it('auto-removes notification after duration', () => {
      vi.useFakeTimers()
      store.show('Temporary', 'info', 3000)
      expect(store.notifications).toHaveLength(1)
      vi.advanceTimersByTime(3000)
      expect(store.notifications).toHaveLength(0)
    })

    it('does not auto-remove when duration is 0', () => {
      vi.useFakeTimers()
      store.show('Sticky', 'info', 0)
      vi.advanceTimersByTime(60000)
      expect(store.notifications).toHaveLength(1)
    })
  })

  describe('success()', () => {
    it('creates a notification with type success', () => {
      store.success('Saved')
      expect(store.notifications[0]).toMatchObject({ message: 'Saved', type: 'success' })
    })
  })

  describe('error()', () => {
    it('creates a notification with type error and 8000ms duration', () => {
      vi.useFakeTimers()
      store.error('Failed')
      expect(store.notifications[0].type).toBe('error')
      vi.advanceTimersByTime(7999)
      expect(store.notifications).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(store.notifications).toHaveLength(0)
    })
  })

  describe('remove()', () => {
    it('removes a specific notification by id', () => {
      store.show('First')
      store.show('Second')
      const firstId = store.notifications[0].id
      store.remove(firstId)
      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].message).toBe('Second')
    })

    it('does nothing when id does not exist', () => {
      store.show('Only')
      store.remove(999)
      expect(store.notifications).toHaveLength(1)
    })
  })
})
