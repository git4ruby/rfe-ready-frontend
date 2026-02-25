import { mount, flushPromises } from '@vue/test-utils'
import ResetPasswordView from '../ResetPasswordView.vue'
import { createMountOptions } from '../../test/helpers'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('ResetPasswordView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({
      routerRoutes: [
        {
          path: '/reset-password',
          name: 'ResetPassword',
          component: ResetPasswordView,
        },
      ],
    })
    router = mountOptions.router
  })

  async function mountView(query = { reset_password_token: 'valid-token-123' }) {
    await router.push({ path: '/reset-password', query })
    await router.isReady()

    return mount(ResetPasswordView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          'router-link': { template: '<a :href="to"><slot /></a>', props: ['to'] },
          PasswordStrength: { template: '<div data-testid="password-strength" />', props: ['password'] },
        },
      },
    })
  }

  it('renders password fields and submit button', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.find('#password_confirmation').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Set new password')
  })

  it('submits new password with reset token', async () => {
    apiClient.put.mockResolvedValueOnce({ data: {} })
    const wrapper = await mountView()

    await wrapper.find('#password').setValue('newpassword123')
    await wrapper.find('#password_confirmation').setValue('newpassword123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(apiClient.put).toHaveBeenCalledWith('/users/password', {
      user: {
        reset_password_token: 'valid-token-123',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      },
    })
  })

  it('shows validation error for password mismatch', async () => {
    const wrapper = await mountView()

    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#password_confirmation').setValue('different456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Passwords do not match.')
    expect(apiClient.put).not.toHaveBeenCalled()
  })

  it('shows validation error for short password', async () => {
    const wrapper = await mountView()

    await wrapper.find('#password').setValue('12345')
    await wrapper.find('#password_confirmation').setValue('12345')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Password must be at least 6 characters.')
    expect(apiClient.put).not.toHaveBeenCalled()
  })

  it('shows error for missing reset token', async () => {
    const wrapper = await mountView({})

    await wrapper.find('#password').setValue('newpassword123')
    await wrapper.find('#password_confirmation').setValue('newpassword123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid or missing reset token')
    expect(apiClient.put).not.toHaveBeenCalled()
  })

  it('handles API errors for expired token', async () => {
    const error = new Error('fail')
    error.response = { data: { error: 'Token has expired' } }
    apiClient.put.mockRejectedValueOnce(error)

    const wrapper = await mountView()

    await wrapper.find('#password').setValue('newpassword123')
    await wrapper.find('#password_confirmation').setValue('newpassword123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Token has expired')
  })

  it('has a back to sign in link', async () => {
    const wrapper = await mountView()

    const backLink = wrapper.find('a[href="/login"]')
    expect(backLink.exists()).toBe(true)
    expect(backLink.text()).toContain('Back to Sign In')
  })
})
