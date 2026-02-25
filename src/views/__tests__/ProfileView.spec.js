import { mount, flushPromises } from '@vue/test-utils'
import ProfileView from '../ProfileView.vue'
import { createMountOptions } from '../../test/helpers'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/client')

vi.mock('../../api/profile', () => ({
  default: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}))
import profileApi from '../../api/profile'

vi.mock('../../api/twoFactor', () => ({
  default: {
    setup: vi.fn(),
    verify: vi.fn(),
    disable: vi.fn(),
    validate: vi.fn(),
  },
}))
import twoFactorApi from '../../api/twoFactor'

const mockProfile = {
  id: '1',
  email: 'attorney@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  role: 'attorney',
  bar_number: 'CA-123456',
  otp_required_for_login: false,
  preferences: {
    timezone: 'America/New_York',
    dashboard_layout: 'expanded',
    notify_case_assigned: true,
    notify_deadline_approaching: true,
    notify_draft_ready: true,
  },
}

describe('ProfileView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/profile')
    await router.isReady()
  })

  async function mountProfile(profileData = mockProfile) {
    profileApi.getProfile.mockResolvedValueOnce({ data: { data: profileData } })

    const wrapper = mount(ProfileView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          PasswordStrength: { template: '<div data-testid="password-strength" />', props: ['password'] },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('renders user profile fields after loading', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain('attorney@example.com')
    expect(wrapper.text()).toContain('attorney')
    expect(wrapper.find('input[type="text"]').element.value).toBe('Jane')
  })

  it('shows email and role as read-only account info', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('attorney@example.com')
    expect(wrapper.text()).toContain('Role')
    expect(wrapper.text()).toContain('attorney')
  })

  it('shows bar number field for attorneys', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain('Bar Number')
  })

  it('hides bar number field for non-attorneys', async () => {
    const adminProfile = { ...mockProfile, role: 'admin', bar_number: '' }
    const wrapper = await mountProfile(adminProfile)

    expect(wrapper.text()).not.toContain('Bar Number')
  })

  it('updates profile successfully', async () => {
    const updatedProfile = { ...mockProfile, first_name: 'Janet' }
    profileApi.updateProfile.mockResolvedValueOnce({ data: { data: updatedProfile } })

    const wrapper = await mountProfile()

    const inputs = wrapper.findAll('input[type="text"]')
    // first_name is the first text input
    await inputs[0].setValue('Janet')

    // Find the personal info form and submit it
    const forms = wrapper.findAll('form')
    await forms[0].trigger('submit')
    await flushPromises()

    expect(profileApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Janet' })
    )
  })

  it('shows change password form', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain('Change Password')
    expect(wrapper.text()).toContain('Current Password')
    expect(wrapper.text()).toContain('New Password')
  })

  it('validates current password is required for password change', async () => {
    const wrapper = await mountProfile()

    // Find the change password form (second form)
    const forms = wrapper.findAll('form')
    const passwordForm = forms[1]

    await passwordForm.trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Required')
  })

  it('validates password mismatch in change password', async () => {
    const wrapper = await mountProfile()

    const passwordInputs = wrapper.findAll('input[type="password"]')
    // current_password, password, password_confirmation
    await passwordInputs[0].setValue('current123')
    await passwordInputs[1].setValue('newpass123')
    await passwordInputs[2].setValue('different456')

    const forms = wrapper.findAll('form')
    await forms[1].trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('shows 2FA section with enable button when 2FA is disabled', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain('Two-Factor Authentication')
    expect(wrapper.text()).toContain('Enable 2FA')
  })

  it('starts 2FA setup and shows QR code', async () => {
    twoFactorApi.setup.mockResolvedValueOnce({
      data: {
        data: {
          qr_svg: '<svg>QR Code</svg>',
          secret: 'JBSWY3DPEHPK3PXP',
        },
      },
    })

    const wrapper = await mountProfile()

    // Click Enable 2FA button
    const enableBtn = wrapper.findAll('button').find((b) => b.text().includes('Enable 2FA'))
    await enableBtn.trigger('click')
    await flushPromises()

    expect(twoFactorApi.setup).toHaveBeenCalled()
    expect(wrapper.text()).toContain('JBSWY3DPEHPK3PXP')
    expect(wrapper.text()).toContain('Scan this QR code')
  })

  it('shows backup codes after enabling 2FA', async () => {
    twoFactorApi.setup.mockResolvedValueOnce({
      data: {
        data: {
          qr_svg: '<svg>QR</svg>',
          secret: 'TESTSECRET',
        },
      },
    })

    twoFactorApi.verify.mockResolvedValueOnce({
      data: {
        data: {
          backup_codes: ['code1', 'code2', 'code3', 'code4'],
        },
      },
    })

    const wrapper = await mountProfile()

    // Start setup
    const enableBtn = wrapper.findAll('button').find((b) => b.text().includes('Enable 2FA'))
    await enableBtn.trigger('click')
    await flushPromises()

    // Enter OTP code and verify
    const otpInput = wrapper.find('input[inputmode="numeric"]')
    await otpInput.setValue('123456')

    const verifyBtn = wrapper.findAll('button').find((b) => b.text().includes('Verify'))
    await verifyBtn.trigger('click')
    await flushPromises()

    expect(twoFactorApi.verify).toHaveBeenCalledWith('123456')
    expect(wrapper.text()).toContain('Save your backup codes')
    expect(wrapper.text()).toContain('code1')
    expect(wrapper.text()).toContain('code2')
  })

  it('shows loading skeleton before profile loads', async () => {
    let resolveProfile
    profileApi.getProfile.mockReturnValueOnce(new Promise((resolve) => (resolveProfile = resolve)))

    const wrapper = mount(ProfileView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          PasswordStrength: { template: '<div />', props: ['password'] },
        },
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    resolveProfile({ data: { data: mockProfile } })
    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
  })
})
