import { mount, flushPromises } from '@vue/test-utils'
import FeatureFlagsView from '../FeatureFlagsView.vue'
import { createMountOptions } from '../../test/helpers'
import { useFeaturesStore } from '../../stores/features'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockFlags = [
  {
    id: 'flag-001-abcdef',
    name: 'beta_analytics',
    enabled: true,
    allowed_roles: ['admin', 'attorney'],
    allowed_plans: ['professional', 'enterprise'],
  },
  {
    id: 'flag-002-ghijkl',
    name: 'ai_suggestions',
    enabled: false,
    allowed_roles: [],
    allowed_plans: [],
  },
]

describe('FeatureFlagsView', () => {
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
    EmptyState: { template: '<div data-testid="empty"><slot name="action" /></div>', props: ['title', 'description', 'icon'] },
    ConfirmDialog: { template: '<div data-testid="confirm-dialog" />', props: ['show', 'title', 'message', 'confirmLabel', 'loading'], emits: ['confirm', 'cancel'] },
    FlagIcon: { template: '<span />' },
    PlusIcon: { template: '<span />' },
    TrashIcon: { template: '<span />' },
    XMarkIcon: { template: '<span />' },
  }

  async function mountFeatureFlags(flags = mockFlags) {
    apiClient.get.mockResolvedValueOnce({ data: { data: flags } })

    const wrapper = mount(FeatureFlagsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    // Ensure store is populated with expected data (reset any stale state)
    const store = useFeaturesStore()
    store.managedFlags = [...flags]
    store.managedLoading = false
    await flushPromises()

    return wrapper
  }

  it('renders page header', async () => {
    const wrapper = await mountFeatureFlags()

    expect(wrapper.text()).toContain('Feature Flags')
    expect(wrapper.text()).toContain('Manage feature flags to control feature availability for your organization.')
  })

  it('fetches managed flags on mount', async () => {
    await mountFeatureFlags()

    expect(apiClient.get).toHaveBeenCalledWith('/feature_flags/manage')
  })

  it('shows loading skeleton while fetching flags', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const wrapper = mount(FeatureFlagsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    resolveApi({ data: { data: mockFlags } })
    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
  })

  it('shows empty state when no flags', async () => {
    const wrapper = await mountFeatureFlags([])

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  it('renders flag names', async () => {
    const wrapper = await mountFeatureFlags()

    expect(wrapper.text()).toContain('beta_analytics')
    expect(wrapper.text()).toContain('ai_suggestions')
  })

  it('shows enabled/disabled status badges', async () => {
    const wrapper = await mountFeatureFlags()

    expect(wrapper.text()).toContain('Enabled')
    expect(wrapper.text()).toContain('Disabled')
  })

  it('shows create flag button', async () => {
    const wrapper = await mountFeatureFlags()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Flag'))
    expect(createBtn).toBeDefined()
  })

  it('opens create modal on button click', async () => {
    const wrapper = await mountFeatureFlags()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Flag'))
    await createBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('#flag-name').exists()).toBe(true)
  })

  it('submits create form successfully', async () => {
    const wrapper = await mountFeatureFlags()

    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'flag-003-mnopqr',
          name: 'new_feature',
          enabled: true,
          allowed_roles: [],
          allowed_plans: [],
        },
      },
    })

    // Open modal
    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Flag'))
    await createBtn.trigger('click')
    await flushPromises()

    // Fill form
    await wrapper.find('#flag-name').setValue('new_feature')

    // Submit
    const form = wrapper.find('form')
    await form.trigger('submit')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/feature_flags', {
      feature_flag: { name: 'new_feature', enabled: true, allowed_roles: [], allowed_plans: [] },
    })
  })

  it('toggles flag enabled state', async () => {
    const wrapper = await mountFeatureFlags()

    apiClient.patch.mockResolvedValueOnce({
      data: { data: { ...mockFlags[0], enabled: false } },
    })

    const toggleBtn = wrapper.findAll('button[role="switch"]')[0]
    await toggleBtn.trigger('click')
    await flushPromises()

    expect(apiClient.patch).toHaveBeenCalledWith('/feature_flags/flag-001-abcdef', {
      feature_flag: { enabled: false },
    })
  })

  it('shows allowed roles checkboxes', async () => {
    const wrapper = await mountFeatureFlags()

    expect(wrapper.text()).toContain('Allowed Roles')
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('attorney')
    expect(wrapper.text()).toContain('paralegal')
    expect(wrapper.text()).toContain('viewer')
  })

  it('shows allowed plans checkboxes', async () => {
    const wrapper = await mountFeatureFlags()

    expect(wrapper.text()).toContain('Allowed Plans')
    expect(wrapper.text()).toContain('trial')
    expect(wrapper.text()).toContain('basic')
    expect(wrapper.text()).toContain('professional')
    expect(wrapper.text()).toContain('enterprise')
  })

  it('handles API error on load', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network error'))

    mount(FeatureFlagsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    // Should not crash; the notification store receives the error
    expect(apiClient.get).toHaveBeenCalledWith('/feature_flags/manage')
  })

  it('shows delete button for each flag', async () => {
    const wrapper = await mountFeatureFlags()

    // Each flag card has a delete button with red color classes
    const flagCards = wrapper.findAll('.bg-white.shadow.rounded-lg.p-5')
    expect(flagCards.length).toBe(2)

    // Each card should contain a button with red text for delete
    flagCards.forEach((card) => {
      const redButtons = card.findAll('button').filter(
        (b) => b.classes().some((c) => c.includes('text-red'))
      )
      expect(redButtons.length).toBeGreaterThanOrEqual(1)
    })
  })
})
