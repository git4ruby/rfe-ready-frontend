import { mount, flushPromises } from '@vue/test-utils'
import ForgotPasswordView from '../ForgotPasswordView.vue'
import { createMountOptions } from '../../test/helpers'

vi.mock('../../api/client')
import apiClient from '../../api/client'

describe('ForgotPasswordView', () => {
  let wrapper
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions()
    router = mountOptions.router

    await router.push('/forgot-password')
    await router.isReady()

    wrapper = mount(ForgotPasswordView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          'router-link': { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })
  })

  it('renders email input and submit button', () => {
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Reset your password')
  })

  it('submits forgot password request with email', async () => {
    apiClient.post.mockResolvedValueOnce({ data: {} })

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/users/password', {
      user: { email: 'user@example.com' },
    })
  })

  it('shows success message after submission', async () => {
    apiClient.post.mockResolvedValueOnce({ data: {} })

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Check your email')
    expect(wrapper.text()).toContain('user@example.com')
  })

  it('shows loading state during submission', async () => {
    let resolvePost
    apiClient.post.mockReturnValueOnce(new Promise((resolve) => (resolvePost = resolve)))

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Sending...')

    resolvePost({ data: {} })
    await flushPromises()
  })

  it('handles API errors', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('Network error'))

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong. Please try again.')
  })

  it('has a back to sign in link', () => {
    const backLink = wrapper.find('a[href="/login"]')
    expect(backLink.exists()).toBe(true)
    expect(backLink.text()).toContain('Back to Sign In')
  })

  it('shows back to sign in button after successful submission', async () => {
    apiClient.post.mockResolvedValueOnce({ data: {} })

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const backBtn = wrapper.find('button')
    expect(backBtn.text()).toContain('Back to Sign In')
  })
})
