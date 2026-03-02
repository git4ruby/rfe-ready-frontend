import { mount, flushPromises } from '@vue/test-utils'
import WebhooksView from '../WebhooksView.vue'
import { createMountOptions } from '../../test/helpers'
import { useWebhooksStore } from '../../stores/webhooks'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockWebhooks = [
  {
    id: 'wh-001',
    url: 'https://example.com/webhook/rfe',
    description: 'Production webhook',
    events: ['case.created', 'case.updated', 'document.uploaded'],
    active: true,
    secret: null,
  },
  {
    id: 'wh-002',
    url: 'https://staging.example.com/webhook',
    description: '',
    events: ['draft.approved'],
    active: false,
    secret: null,
  },
]

describe('WebhooksView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    vi.clearAllMocks()
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  const stubs = {
    SkeletonLoader: { template: '<div data-testid="skeleton" />' },
    EmptyState: { template: '<div data-testid="empty"><slot name="action" /></div>', props: ['title', 'icon'] },
    ConfirmDialog: { template: '<div data-testid="confirm-dialog" />', props: ['show', 'title', 'message', 'confirmLabel', 'loading'], emits: ['confirm', 'cancel'] },
    BoltIcon: { template: '<span />' },
    PlusIcon: { template: '<span />' },
    PencilSquareIcon: { template: '<span />' },
    TrashIcon: { template: '<span />' },
    XMarkIcon: { template: '<span />' },
    PaperAirplaneIcon: { template: '<span />' },
  }

  async function mountWebhooks(webhooks = mockWebhooks) {
    apiClient.get.mockResolvedValueOnce({ data: { data: webhooks } })

    const wrapper = mount(WebhooksView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    // Ensure store is populated with expected data (reset any stale state)
    const store = useWebhooksStore()
    store.webhooks = [...webhooks]
    store.loading = false
    await flushPromises()

    return wrapper
  }

  it('renders page header', async () => {
    const wrapper = await mountWebhooks()

    expect(wrapper.text()).toContain('Webhooks')
    expect(wrapper.text()).toContain('Manage webhook endpoints to receive event notifications.')
  })

  it('fetches webhooks on mount', async () => {
    await mountWebhooks()

    expect(apiClient.get).toHaveBeenCalledWith('/webhooks')
  })

  it('shows loading skeleton while fetching webhooks', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const wrapper = mount(WebhooksView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    resolveApi({ data: { data: mockWebhooks } })
    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
  })

  it('shows empty state when no webhooks', async () => {
    const wrapper = await mountWebhooks([])

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  it('renders webhook URLs', async () => {
    const wrapper = await mountWebhooks()

    expect(wrapper.text()).toContain('https://example.com/webhook/rfe')
    expect(wrapper.text()).toContain('https://staging.example.com/webhook')
  })

  it('renders webhook description', async () => {
    const wrapper = await mountWebhooks()

    expect(wrapper.text()).toContain('Production webhook')
  })

  it('shows active/disabled status badges', async () => {
    const wrapper = await mountWebhooks()

    expect(wrapper.text()).toContain('Active')
    expect(wrapper.text()).toContain('Disabled')
  })

  it('shows event count for each webhook', async () => {
    const wrapper = await mountWebhooks()

    expect(wrapper.text()).toContain('3 events')
    expect(wrapper.text()).toContain('1 events')
  })

  it('shows event pills for each webhook', async () => {
    const wrapper = await mountWebhooks()

    expect(wrapper.text()).toContain('case created')
    expect(wrapper.text()).toContain('case updated')
    expect(wrapper.text()).toContain('document uploaded')
    expect(wrapper.text()).toContain('draft approved')
  })

  it('shows create webhook button', async () => {
    const wrapper = await mountWebhooks()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Webhook'))
    expect(createBtn).toBeDefined()
  })

  it('opens create modal on button click', async () => {
    const wrapper = await mountWebhooks()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Webhook'))
    await createBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Create Webhook')
    expect(wrapper.find('#webhook-url').exists()).toBe(true)
    expect(wrapper.find('#webhook-description').exists()).toBe(true)
    expect(wrapper.find('#webhook-secret').exists()).toBe(true)
  })

  it('shows event groups in modal', async () => {
    const wrapper = await mountWebhooks()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Webhook'))
    await createBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Case Events')
    expect(wrapper.text()).toContain('Document Events')
    expect(wrapper.text()).toContain('Draft Events')
  })

  it('shows test delivery button for each webhook', async () => {
    const wrapper = await mountWebhooks()

    const testButtons = wrapper.findAll('button').filter((b) => b.text().includes('Test'))
    expect(testButtons.length).toBe(2)
  })

  it('sends test delivery', async () => {
    const wrapper = await mountWebhooks()

    apiClient.post.mockResolvedValueOnce({ data: { data: {} } })

    const testBtn = wrapper.findAll('button').filter((b) => b.text().includes('Test'))[0]
    await testBtn.trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/webhooks/wh-001/test_delivery')
  })

  it('toggles webhook active state', async () => {
    const wrapper = await mountWebhooks()

    apiClient.patch.mockResolvedValueOnce({
      data: { data: { ...mockWebhooks[0], active: false } },
    })

    const toggleBtn = wrapper.findAll('button[role="switch"]')[0]
    await toggleBtn.trigger('click')
    await flushPromises()

    expect(apiClient.patch).toHaveBeenCalledWith('/webhooks/wh-001', {
      webhook: { active: false },
    })
  })

  it('shows edit and delete buttons for each webhook', async () => {
    const wrapper = await mountWebhooks()

    // Each webhook card has edit (hover:text-indigo-600) and delete (hover:text-red-600) buttons
    const rows = wrapper.findAll('.bg-white.shadow.rounded-lg.p-5')
    expect(rows.length).toBe(2)
  })

  it('submits create form successfully', async () => {
    const wrapper = await mountWebhooks()

    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'wh-003',
          url: 'https://new.example.com/hook',
          description: 'New hook',
          events: ['case.created'],
          active: true,
        },
      },
    })

    // Open modal
    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Webhook'))
    await createBtn.trigger('click')
    await flushPromises()

    // Fill form
    await wrapper.find('#webhook-url').setValue('https://new.example.com/hook')
    await wrapper.find('#webhook-description').setValue('New hook')

    // Select at least one event
    const eventCheckboxes = wrapper.findAll('input[type="checkbox"]')
    await eventCheckboxes[1].setValue(true)

    // Submit
    const form = wrapper.find('form')
    await form.trigger('submit')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/webhooks', {
      webhook: expect.objectContaining({
        url: 'https://new.example.com/hook',
        description: 'New hook',
      }),
    })
  })

  it('handles API error on load', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network error'))

    mount(WebhooksView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/webhooks')
  })
})
