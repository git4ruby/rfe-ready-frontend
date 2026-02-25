import { mount, flushPromises } from '@vue/test-utils'
import BackupsView from '../BackupsView.vue'
import { createMountOptions } from '../../test/helpers'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockBackups = [
  {
    id: '1',
    status: 'completed',
    file_size_human: '2.4 MB',
    user_name: 'Jane Doe',
    created_at: '2026-02-20T14:30:00Z',
    error_message: null,
  },
  {
    id: '2',
    status: 'in_progress',
    file_size_human: null,
    user_name: 'Admin User',
    created_at: '2026-02-21T10:00:00Z',
    error_message: null,
  },
  {
    id: '3',
    status: 'failed',
    file_size_human: null,
    user_name: 'Admin User',
    created_at: '2026-02-19T09:00:00Z',
    error_message: 'Storage quota exceeded',
  },
]

describe('BackupsView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.resetAllMocks()
    mountOptions = createMountOptions()
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function mountBackups(backups = mockBackups) {
    apiClient.get.mockResolvedValueOnce({ data: { data: backups } })

    const wrapper = mount(BackupsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          ArrowDownTrayIcon: { template: '<span />' },
          TrashIcon: { template: '<span />' },
          PlusIcon: { template: '<span />' },
        },
      },
    })

    await vi.runAllTimersAsync()
    await flushPromises()
    return wrapper
  }

  it('fetches backups on mount', async () => {
    await mountBackups()

    expect(apiClient.get).toHaveBeenCalledWith('/backups')
  })

  it('renders backups list with metadata', async () => {
    const wrapper = await mountBackups()

    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('Admin User')
    expect(wrapper.text()).toContain('2.4 MB')
  })

  it('shows backup status badges', async () => {
    const wrapper = await mountBackups()

    expect(wrapper.text()).toContain('completed')
    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).toContain('failed')
  })

  it('shows create backup button', async () => {
    const wrapper = await mountBackups()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Backup'))
    expect(createBtn).toBeDefined()
  })

  it('creates a new backup on button click', async () => {
    const wrapper = await mountBackups()

    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          id: '4',
          status: 'pending',
          file_size_human: null,
          user_name: 'Admin User',
          created_at: new Date().toISOString(),
        },
      },
    })

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Backup'))
    await createBtn.trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/backups')
  })

  it('shows download button only for completed backups', async () => {
    const wrapper = await mountBackups()

    // Check that download buttons exist in the table
    const rows = wrapper.findAll('tr')
    // The completed backup row should have a download button
    // We rely on the v-if="backup.status === 'completed'" in the template
    const downloadButtons = wrapper.findAll('button[title="Download"]')
    expect(downloadButtons.length).toBe(1) // Only the completed backup
  })

  it('shows delete button for all backups', async () => {
    const wrapper = await mountBackups()

    const rows = wrapper.findAll('tbody tr')
    const deleteButtons = wrapper.findAll('button[title="Delete"]')
    expect(deleteButtons.length).toBe(rows.length) // Every backup row has a delete button
  })

  it('shows table headers', async () => {
    const wrapper = await mountBackups()

    expect(wrapper.text()).toContain('Created')
    expect(wrapper.text()).toContain('Status')
    expect(wrapper.text()).toContain('Size')
    expect(wrapper.text()).toContain('Created By')
    expect(wrapper.text()).toContain('Actions')
  })

  it('shows empty state when no backups', async () => {
    const wrapper = await mountBackups([])

    expect(wrapper.text()).toContain('No backups yet')
  })

  it('shows loading state before data loads', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const wrapper = mount(BackupsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          ArrowDownTrayIcon: { template: '<span />' },
          TrashIcon: { template: '<span />' },
          PlusIcon: { template: '<span />' },
        },
      },
    })

    // Check loading state before API resolves
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)

    resolveApi({ data: { data: mockBackups } })
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(wrapper.find('.animate-pulse').exists()).toBe(false)
  })

  it('renders page header', async () => {
    const wrapper = await mountBackups()

    expect(wrapper.text()).toContain('Backups')
  })
})
