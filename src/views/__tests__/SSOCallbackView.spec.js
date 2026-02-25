import { mount, flushPromises } from '@vue/test-utils'
import SSOCallbackView from '../SSOCallbackView.vue'
import { createMountOptions } from '../../test/helpers'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/client')

describe('SSOCallbackView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    localStorage.clear()
    mountOptions = createMountOptions({
      piniaOptions: { stubActions: false },
      routerRoutes: [
        {
          path: '/sso/callback',
          name: 'SSOCallback',
          component: SSOCallbackView,
        },
      ],
    })
    router = mountOptions.router
  })

  async function mountView(query = {}) {
    await router.push({ path: '/sso/callback', query })
    await router.isReady()

    return mount(SSOCallbackView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          'router-link': { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })
  }

  it('shows loading state when no error and processing token', async () => {
    const wrapper = await mountView({
      token: 'jwt-token-123',
      user_id: '1',
      email: 'user@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'attorney',
      tenant_id: '10',
      is_super_admin: 'false',
    })
    await flushPromises()

    // After processing, it redirects, so we check that the error state is not shown
    expect(wrapper.find('.bg-red-50').exists()).toBe(false)
  })

  it('stores token and user data on successful SSO callback', async () => {
    await mountView({
      token: 'jwt-token-123',
      user_id: '1',
      email: 'user@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'attorney',
      tenant_id: '10',
      is_super_admin: 'false',
    })
    await flushPromises()

    const authStore = useAuthStore()
    expect(authStore.token).toBe('jwt-token-123')
    expect(localStorage.getItem('auth_token')).toBe('jwt-token-123')
  })

  it('redirects to dashboard for regular users', async () => {
    await mountView({
      token: 'jwt-token-123',
      user_id: '1',
      email: 'user@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'attorney',
      tenant_id: '10',
      is_super_admin: 'false',
    })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects to admin dashboard for super admins', async () => {
    await mountView({
      token: 'jwt-token-456',
      user_id: '2',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      tenant_id: '10',
      is_super_admin: 'true',
    })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/platform')
  })

  it('handles error callback params', async () => {
    const wrapper = await mountView({ error: 'access_denied' })
    await flushPromises()

    expect(wrapper.text()).toContain('access_denied')
    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
  })

  it('shows error when no token received', async () => {
    const wrapper = await mountView({})
    await flushPromises()

    expect(wrapper.text()).toContain('Authentication failed. No token received.')
  })

  it('shows back to login link on error', async () => {
    const wrapper = await mountView({ error: 'some_error' })
    await flushPromises()

    const backLink = wrapper.find('a[href="/login"]')
    expect(backLink.exists()).toBe(true)
    expect(backLink.text()).toContain('Back to login')
  })
})
