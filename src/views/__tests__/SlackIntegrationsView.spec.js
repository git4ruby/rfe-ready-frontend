import { mount, flushPromises } from '@vue/test-utils'
import SlackIntegrationsView from '../SlackIntegrationsView.vue'
import { createMountOptions } from '../../test/helpers'
import { useSlackStore } from '../../stores/slack'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockIntegrations = [
  {
    id: 'slack-1',
    webhook_url: 'https://hooks.slack.com/services/T00/B00/xxxx',
    channel_name: '#rfe-alerts',
    events: ['case.created', 'case.status_changed'],
    active: true,
  },
  {
    id: 'slack-2',
    webhook_url: 'https://hooks.slack.com/services/T00/B00/yyyy',
    channel_name: '#general',
    events: ['draft.approved'],
    active: false,
  },
]

describe('SlackIntegrationsView', () => {
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
    LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
    ConfirmDialog: { template: '<div data-testid="confirm-dialog" />', props: ['title', 'message'], emits: ['confirm', 'cancel'] },
    PlusIcon: { template: '<span />' },
    PencilSquareIcon: { template: '<span />' },
    TrashIcon: { template: '<span />' },
    PaperAirplaneIcon: { template: '<span />' },
    ChatBubbleLeftRightIcon: { template: '<span />' },
    XMarkIcon: { template: '<span />' },
  }

  async function mountSlack(integrations = mockIntegrations) {
    apiClient.get.mockResolvedValueOnce({ data: { data: integrations } })

    const wrapper = mount(SlackIntegrationsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    // Ensure store is populated with expected data (reset any stale state)
    const store = useSlackStore()
    store.integrations = [...integrations]
    store.loading = false
    await flushPromises()

    return wrapper
  }

  it('renders page header', async () => {
    const wrapper = await mountSlack()

    expect(wrapper.text()).toContain('Slack Integration')
    expect(wrapper.text()).toContain('Connect Slack to receive case notifications in your channels.')
  })

  it('fetches integrations on mount', async () => {
    await mountSlack()

    expect(apiClient.get).toHaveBeenCalledWith('/slack_integrations')
  })

  it('shows loading spinner while fetching data', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const wrapper = mount(SlackIntegrationsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)

    resolveApi({ data: { data: mockIntegrations } })
    await flushPromises()
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(false)
  })

  it('shows empty state when no integrations', async () => {
    const wrapper = await mountSlack([])

    expect(wrapper.text()).toContain('No Slack integrations configured.')
  })

  it('renders integration webhook URLs', async () => {
    const wrapper = await mountSlack()

    expect(wrapper.text()).toContain('https://hooks.slack.com/services/T00/B00/xxxx')
    expect(wrapper.text()).toContain('https://hooks.slack.com/services/T00/B00/yyyy')
  })

  it('renders channel names', async () => {
    const wrapper = await mountSlack()

    expect(wrapper.text()).toContain('#rfe-alerts')
    expect(wrapper.text()).toContain('#general')
  })

  it('shows active/inactive status badges', async () => {
    const wrapper = await mountSlack()

    expect(wrapper.text()).toContain('Active')
    expect(wrapper.text()).toContain('Inactive')
  })

  it('shows event pills for each integration', async () => {
    const wrapper = await mountSlack()

    expect(wrapper.text()).toContain('case.created')
    expect(wrapper.text()).toContain('case.status_changed')
    expect(wrapper.text()).toContain('draft.approved')
  })

  it('shows add integration button', async () => {
    const wrapper = await mountSlack()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Integration'))
    expect(createBtn).toBeDefined()
  })

  it('opens create modal on button click', async () => {
    const wrapper = await mountSlack()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Integration'))
    await createBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Add Integration')
    expect(wrapper.text()).toContain('Webhook URL')
    expect(wrapper.text()).toContain('Channel Name')
    expect(wrapper.text()).toContain('Events')
  })

  it('shows supported events in the create form', async () => {
    const wrapper = await mountSlack()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Integration'))
    await createBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('case.created')
    expect(wrapper.text()).toContain('case.status_changed')
    expect(wrapper.text()).toContain('case.archived')
    expect(wrapper.text()).toContain('document.uploaded')
    expect(wrapper.text()).toContain('draft.approved')
  })

  it('shows test notification button for each integration', async () => {
    const wrapper = await mountSlack()

    const testButtons = wrapper.findAll('button').filter((b) => b.text().includes('Send Test'))
    expect(testButtons.length).toBe(2)
  })

  it('sends test notification', async () => {
    const wrapper = await mountSlack()

    apiClient.post.mockResolvedValueOnce({ data: { data: {} } })

    const testBtn = wrapper.findAll('button').filter((b) => b.text().includes('Send Test'))[0]
    await testBtn.trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/slack_integrations/slack-1/test_notification')
  })

  it('submits create form successfully', async () => {
    const wrapper = await mountSlack()

    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'slack-3',
          webhook_url: 'https://hooks.slack.com/services/T00/B00/zzzz',
          channel_name: '#new-channel',
          events: ['case.created'],
          active: true,
        },
      },
    })

    // Open modal
    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Integration'))
    await createBtn.trigger('click')
    await flushPromises()

    // Fill webhook URL
    const urlInput = wrapper.find('input[type="url"]')
    await urlInput.setValue('https://hooks.slack.com/services/T00/B00/zzzz')

    // Fill channel name
    const textInputs = wrapper.findAll('input[type="text"]')
    await textInputs[0].setValue('#new-channel')

    // Toggle first event checkbox
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(true)

    // Save
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save'))
    await saveBtn.trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/slack_integrations', {
      slack_integration: expect.objectContaining({
        webhook_url: 'https://hooks.slack.com/services/T00/B00/zzzz',
        channel_name: '#new-channel',
      }),
    })
  })

  it('handles API error on load', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network error'))

    mount(SlackIntegrationsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/slack_integrations')
  })
})
