import { mount, flushPromises } from '@vue/test-utils'
import SettingsView from '../SettingsView.vue'
import { createMountOptions } from '../../test/helpers'
import { useAuthStore } from '../../stores/auth'
import { useSettingsStore } from '../../stores/settings'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockTenant = {
  id: '1',
  name: 'Smith & Associates',
  slug: 'smith-associates',
  plan: 'professional',
  status: 'active',
  data_retention_days: 90,
  created_at: '2025-06-15T10:00:00Z',
}

describe('SettingsView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  async function mountSettings(tenantData = mockTenant, role = 'admin') {
    apiClient.get.mockResolvedValueOnce({ data: { data: tenantData } })

    const authStore = useAuthStore()
    authStore.user = { id: '10', role, first_name: 'Test', last_name: 'User' }
    authStore.token = 'test-token'

    const wrapper = mount(SettingsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('renders settings page header', async () => {
    const wrapper = await mountSettings()

    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Manage your organization settings.')
  })

  it('fetches tenant settings on mount', async () => {
    await mountSettings()

    expect(apiClient.get).toHaveBeenCalledWith('/tenant')
  })

  it('renders tenant name and data retention fields', async () => {
    const wrapper = await mountSettings()

    const nameInput = wrapper.find('#org-name')
    expect(nameInput.exists()).toBe(true)
    expect(nameInput.element.value).toBe('Smith & Associates')

    const retentionInput = wrapper.find('#retention')
    expect(retentionInput.exists()).toBe(true)
    expect(retentionInput.element.value).toBe('90')
  })

  it('shows save button for admin users', async () => {
    const wrapper = await mountSettings(mockTenant, 'admin')

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    expect(saveBtn).toBeDefined()
  })

  it('disables inputs for non-admin users', async () => {
    const wrapper = await mountSettings(mockTenant, 'attorney')

    const nameInput = wrapper.find('#org-name')
    expect(nameInput.attributes('disabled')).toBeDefined()

    const retentionInput = wrapper.find('#retention')
    expect(retentionInput.attributes('disabled')).toBeDefined()

    // Save button should not be visible for non-admins
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    expect(saveBtn).toBeUndefined()
  })

  it('saves settings successfully', async () => {
    apiClient.patch.mockResolvedValueOnce({
      data: { data: { ...mockTenant, name: 'Updated Name' } },
    })

    const wrapper = await mountSettings()

    await wrapper.find('#org-name').setValue('Updated Name')

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    await flushPromises()

    expect(apiClient.patch).toHaveBeenCalledWith('/tenant', {
      tenant: {
        name: 'Updated Name',
        data_retention_days: 90,
      },
    })
  })

  it('displays plan and account info as read-only', async () => {
    const wrapper = await mountSettings()

    expect(wrapper.text()).toContain('Plan & Account')
    expect(wrapper.text()).toContain('professional')
    expect(wrapper.text()).toContain('active')
    expect(wrapper.text()).toContain('smith-associates')
  })

  it('shows loading spinner while fetching settings', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const authStore = useAuthStore()
    authStore.user = { id: '10', role: 'admin' }
    authStore.token = 'test-token'

    const wrapper = mount(SettingsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
        },
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)

    resolveApi({ data: { data: mockTenant } })
    await flushPromises()
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(false)
  })
})
