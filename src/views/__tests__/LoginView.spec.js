import { mount, flushPromises } from '@vue/test-utils'
import LoginView from '../LoginView.vue'
import { createMountOptions } from '../../test/helpers'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/twoFactor', () => ({
  default: {
    validate: vi.fn(),
    setup: vi.fn(),
    verify: vi.fn(),
    disable: vi.fn(),
  },
}))
import twoFactorApi from '../../api/twoFactor'

vi.mock('../../api/client')

describe('LoginView', () => {
  let wrapper
  let mountOptions
  let authStore
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router

    await router.push('/login')
    await router.isReady()

    wrapper = mount(LoginView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          'router-link': { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

    authStore = useAuthStore()
  })

  it('renders the login form with email and password fields', () => {
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('renders the Google SSO button', () => {
    const ssoLink = wrapper.find('a[href*="google_oauth2"]')
    expect(ssoLink.exists()).toBe(true)
  })

  it('renders the forgot password link', () => {
    const forgotLink = wrapper.find('a[href="/forgot-password"]')
    expect(forgotLink.exists()).toBe(true)
  })

  it('calls authStore.login on form submit', async () => {
    vi.spyOn(authStore, 'login').mockResolvedValueOnce({})

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(authStore.login).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('displays error message on login failure', async () => {
    const error = new Error('fail')
    error.response = { data: { error: 'Invalid credentials' } }
    vi.spyOn(authStore, 'login').mockRejectedValueOnce(error)

    await wrapper.find('input[type="email"]').setValue('bad@test.com')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid credentials')
  })

  it('shows loading state on submit button while logging in', async () => {
    let resolveLogin
    vi.spyOn(authStore, 'login').mockReturnValueOnce(new Promise((resolve) => (resolveLogin = resolve)))

    await wrapper.find('input[type="email"]').setValue('user@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()

    resolveLogin({})
    await flushPromises()
  })

  it('shows 2FA form when login requires OTP', async () => {
    vi.spyOn(authStore, 'login').mockImplementation(async () => {
      authStore.requires2FA = true
    })

    await wrapper.find('input[type="email"]').setValue('user@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('input#otp').exists()).toBe(true)
  })

  it('calls twoFactorApi.validate on 2FA submit', async () => {
    // Get to 2FA state
    vi.spyOn(authStore, 'login').mockImplementation(async () => {
      authStore.requires2FA = true
    })

    await wrapper.find('input[type="email"]').setValue('user@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    twoFactorApi.validate.mockResolvedValueOnce({})
    vi.spyOn(authStore, 'confirm2FA')

    await wrapper.find('input#otp').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(twoFactorApi.validate).toHaveBeenCalledWith('123456')
  })
})
