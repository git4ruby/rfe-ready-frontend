import { setActivePinia, createPinia } from 'pinia'
import { useLiveNotificationsStore } from '../liveNotifications'

// Mock the useCable composable to avoid ActionCable dependency
vi.mock('../../composables/useCable', () => ({
  useCable: () => ({
    subscribe: vi.fn(),
    disconnect: vi.fn(),
  }),
}))

describe('liveNotifications store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useLiveNotificationsStore()
  })

  describe('initial state', () => {
    it('has empty notifications and zero unread count', () => {
      expect(store.notifications).toEqual([])
      expect(store.unreadCount).toBe(0)
    })
  })

  describe('addNotification()', () => {
    it('adds a notification to the beginning of the list', () => {
      store.addNotification({ id: '1', title: 'First', body: 'Hello' })

      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].id).toBe('1')
      expect(store.notifications[0].title).toBe('First')
      expect(store.notifications[0].read).toBe(false)
    })

    it('prepends new notifications (most recent first)', () => {
      store.addNotification({ id: '1', title: 'First' })
      store.addNotification({ id: '2', title: 'Second' })

      expect(store.notifications[0].id).toBe('2')
      expect(store.notifications[1].id).toBe('1')
    })

    it('marks new notifications as unread', () => {
      store.addNotification({ id: '1', title: 'Test' })

      expect(store.notifications[0].read).toBe(false)
    })

    it('enforces max 50 notifications limit', () => {
      // Add 55 notifications
      for (let i = 0; i < 55; i++) {
        store.addNotification({ id: String(i), title: `Notification ${i}` })
      }

      expect(store.notifications).toHaveLength(50)
      // Most recent should be first
      expect(store.notifications[0].id).toBe('54')
      // Oldest kept should be id 5 (0-4 were trimmed)
      expect(store.notifications[49].id).toBe('5')
    })

    it('trims oldest notifications when exceeding limit', () => {
      // Fill to max
      for (let i = 0; i < 50; i++) {
        store.addNotification({ id: String(i), title: `N${i}` })
      }
      expect(store.notifications).toHaveLength(50)

      // Add one more
      store.addNotification({ id: '50', title: 'N50' })
      expect(store.notifications).toHaveLength(50)
      expect(store.notifications[0].id).toBe('50')
    })
  })

  describe('markAsRead()', () => {
    it('marks a specific notification as read', () => {
      store.addNotification({ id: '1', title: 'First' })
      store.addNotification({ id: '2', title: 'Second' })

      store.markAsRead('1')

      const n = store.notifications.find((n) => n.id === '1')
      expect(n.read).toBe(true)
      // Other notification remains unread
      const other = store.notifications.find((n) => n.id === '2')
      expect(other.read).toBe(false)
    })

    it('does nothing for non-existent notification id', () => {
      store.addNotification({ id: '1', title: 'Test' })

      store.markAsRead('999')

      expect(store.notifications[0].read).toBe(false)
    })
  })

  describe('markAllRead()', () => {
    it('marks all notifications as read', () => {
      store.addNotification({ id: '1', title: 'First' })
      store.addNotification({ id: '2', title: 'Second' })
      store.addNotification({ id: '3', title: 'Third' })

      store.markAllRead()

      expect(store.notifications.every((n) => n.read === true)).toBe(true)
    })

    it('handles empty notifications', () => {
      store.markAllRead()
      expect(store.notifications).toEqual([])
    })
  })

  describe('clear()', () => {
    it('removes all notifications', () => {
      store.addNotification({ id: '1', title: 'First' })
      store.addNotification({ id: '2', title: 'Second' })

      store.clear()

      expect(store.notifications).toEqual([])
    })
  })

  describe('unreadCount computed', () => {
    it('returns 0 when no notifications', () => {
      expect(store.unreadCount).toBe(0)
    })

    it('counts unread notifications', () => {
      store.addNotification({ id: '1', title: 'First' })
      store.addNotification({ id: '2', title: 'Second' })
      store.addNotification({ id: '3', title: 'Third' })

      expect(store.unreadCount).toBe(3)
    })

    it('decrements when notification is marked as read', () => {
      store.addNotification({ id: '1', title: 'First' })
      store.addNotification({ id: '2', title: 'Second' })

      store.markAsRead('1')

      expect(store.unreadCount).toBe(1)
    })

    it('returns 0 after markAllRead', () => {
      store.addNotification({ id: '1', title: 'First' })
      store.addNotification({ id: '2', title: 'Second' })

      store.markAllRead()

      expect(store.unreadCount).toBe(0)
    })

    it('returns 0 after clear', () => {
      store.addNotification({ id: '1', title: 'First' })

      store.clear()

      expect(store.unreadCount).toBe(0)
    })
  })
})
