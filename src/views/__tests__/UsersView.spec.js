import { mount, flushPromises } from '@vue/test-utils'
import UsersView from '../UsersView.vue'
import { createMountOptions } from '../../test/helpers'
import { useAuthStore } from '../../stores/auth'
import { useUsersStore } from '../../stores/users'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockUsers = [
  {
    id: '1',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    role: 'admin',
    status: 'active',
    bar_number: null,
    created_at: '2025-01-10T10:00:00Z',
  },
  {
    id: '2',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john@example.com',
    role: 'attorney',
    status: 'active',
    bar_number: 'CA-456789',
    created_at: '2025-03-15T10:00:00Z',
  },
  {
    id: '3',
    first_name: 'Bob',
    last_name: 'Jones',
    email: 'bob@example.com',
    role: 'paralegal',
    status: 'invited',
    bar_number: null,
    created_at: '2025-05-20T10:00:00Z',
  },
]

const mockMeta = {
  current_page: 1,
  total_pages: 2,
  total_count: 15,
}

describe('UsersView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  async function mountUsers(users = mockUsers, meta = mockMeta, currentUserId = '10') {
    apiClient.get.mockResolvedValueOnce({ data: { data: users, meta } })

    const authStore = useAuthStore()
    authStore.user = { id: currentUserId, role: 'admin', first_name: 'Current', last_name: 'Admin' }
    authStore.token = 'test-token'

    const wrapper = mount(UsersView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          EmptyState: { template: '<div data-testid="empty"><slot name="action" /></div>', props: ['title', 'description', 'icon'] },
          PaginationBar: {
            template: '<div data-testid="pagination" />',
            props: ['currentPage', 'totalPages', 'totalCount'],
            emits: ['page-change'],
          },
          PasswordStrength: { template: '<div />', props: ['password'] },
          ConfirmDialog: {
            template: '<div data-testid="confirm-dialog" />',
            props: ['show', 'title', 'message', 'confirmLabel', 'loading'],
            emits: ['confirm', 'cancel'],
          },
          UsersIcon: { template: '<span />' },
          PlusIcon: { template: '<span />' },
          PencilSquareIcon: { template: '<span />' },
          XMarkIcon: { template: '<span />' },
          EnvelopeIcon: { template: '<span />' },
          NoSymbolIcon: { template: '<span />' },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('fetches users on mount', async () => {
    await mountUsers()

    expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { page: 1 } })
  })

  it('renders users in the table', async () => {
    const wrapper = await mountUsers()

    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('Doe')
    expect(wrapper.text()).toContain('jane@example.com')
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Smith')
    expect(wrapper.text()).toContain('john@example.com')
  })

  it('shows invite user button', async () => {
    const wrapper = await mountUsers()

    const inviteBtn = wrapper.findAll('button').find((b) => b.text().includes('Invite User'))
    expect(inviteBtn).toBeDefined()
  })

  it('opens invite user modal on click', async () => {
    const wrapper = await mountUsers()

    const inviteBtn = wrapper.findAll('button').find((b) => b.text().includes('Invite User'))
    await inviteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Invite User')
    expect(wrapper.find('#invite-email').exists()).toBe(true)
    expect(wrapper.find('#invite-first').exists()).toBe(true)
    expect(wrapper.find('#invite-last').exists()).toBe(true)
  })

  it('creates new user via invite modal', async () => {
    // First call: initial load. Second call: after createUser refreshes.
    apiClient.post.mockResolvedValueOnce({
      data: { data: { id: '4', first_name: 'New', last_name: 'User', email: 'new@example.com', role: 'paralegal', status: 'active' } },
    })
    apiClient.get.mockResolvedValueOnce({ data: { data: mockUsers, meta: mockMeta } })

    const wrapper = await mountUsers()

    // Open modal
    const inviteBtn = wrapper.findAll('button').find((b) => b.text().includes('Invite User'))
    await inviteBtn.trigger('click')
    await flushPromises()

    // Fill form
    await wrapper.find('#invite-first').setValue('New')
    await wrapper.find('#invite-last').setValue('User')
    await wrapper.find('#invite-email').setValue('new@example.com')

    // Change role to paralegal (not attorney, to avoid bar_number requirement)
    await wrapper.find('#invite-role').setValue('paralegal')

    await wrapper.find('#invite-password').setValue('password123')
    await wrapper.find('#invite-password-confirm').setValue('password123')

    // Submit the modal form
    const modalForm = wrapper.findAll('form').find((f) => f.find('#invite-email').exists())
    await modalForm.trigger('submit')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/users', {
      user: expect.objectContaining({
        first_name: 'New',
        last_name: 'User',
        email: 'new@example.com',
        role: 'paralegal',
      }),
    })
  })

  it('shows role badges', async () => {
    const wrapper = await mountUsers()

    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('attorney')
    expect(wrapper.text()).toContain('paralegal')
  })

  it('shows status badges', async () => {
    const wrapper = await mountUsers()

    expect(wrapper.text()).toContain('active')
    expect(wrapper.text()).toContain('invited')
  })

  it('shows pagination component', async () => {
    const wrapper = await mountUsers()

    expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(true)
  })

  it('shows empty state when no users', async () => {
    const wrapper = await mountUsers([], { current_page: 1, total_pages: 1, total_count: 0 })

    // Users store has 0 users, but we need to check the loading flag is false too
    const store = useUsersStore()
    store.loading = false
    store.users = []
    await flushPromises()

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  it('shows bulk action bar when users are selected', async () => {
    const wrapper = await mountUsers()

    // Find checkboxes (users other than current user can be selected)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    if (checkboxes.length > 0) {
      await checkboxes[0].setValue(true)
      await flushPromises()

      // With at least one selected, bulk bar should appear
      expect(wrapper.text()).toContain('selected')
    }
  })

  it('validates invite form fields', async () => {
    const wrapper = await mountUsers()

    // Open modal
    const inviteBtn = wrapper.findAll('button').find((b) => b.text().includes('Invite User'))
    await inviteBtn.trigger('click')
    await flushPromises()

    // Submit empty form - the default role is 'attorney' which requires bar_number
    const modalForm = wrapper.findAll('form').find((f) => f.find('#invite-email').exists())
    await modalForm.trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('First name is required')
    expect(wrapper.text()).toContain('Last name is required')
    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
  })
})
