import { mount, flushPromises } from '@vue/test-utils'
import CaseNewView from '../CaseNewView.vue'
import { createMountOptions } from '../../test/helpers'
import { useCasesStore } from '../../stores/cases'

vi.mock('../../api/client')

vi.mock('../../composables/useAutoSaveDraft', () => ({
  useAutoSaveDraft: () => ({
    hasDraft: { value: false },
    draftStatus: { value: 'idle' },
    draftSavedAt: { value: null },
    restoreDraft: vi.fn(),
    clearDraft: vi.fn(),
  }),
}))

describe('CaseNewView', () => {
  let wrapper
  let mountOptions
  let casesStore
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router

    await router.push('/cases/new')
    await router.isReady()

    wrapper = mount(CaseNewView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          'router-link': { template: '<a :href="to"><slot /></a>', props: ['to'] },
          ArrowLeftIcon: { template: '<span />' },
          CheckIcon: { template: '<span />' },
        },
      },
    })

    casesStore = useCasesStore()
  })

  it('renders case creation form with header', () => {
    expect(wrapper.text()).toContain('Create New Case')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('shows required fields with asterisks', () => {
    expect(wrapper.find('#case_number').exists()).toBe(true)
    expect(wrapper.find('#petitioner_name').exists()).toBe(true)
    expect(wrapper.find('#beneficiary_name').exists()).toBe(true)
    expect(wrapper.find('#visa_type').exists()).toBe(true)
    expect(wrapper.find('#rfe_received_date').exists()).toBe(true)
    expect(wrapper.find('#rfe_deadline').exists()).toBe(true)
  })

  it('submits case with valid data', async () => {
    const newCase = { id: '99', case_number: 'RFE-2026-001' }
    vi.spyOn(casesStore, 'createCase').mockResolvedValueOnce(newCase)

    await wrapper.find('#case_number').setValue('RFE-2026-001')
    await wrapper.find('#petitioner_name').setValue('Acme Corp')
    await wrapper.find('#beneficiary_name').setValue('John Doe')
    await wrapper.find('#rfe_received_date').setValue('2026-01-15')
    await wrapper.find('#rfe_deadline').setValue('2026-04-15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(casesStore.createCase).toHaveBeenCalledWith(
      expect.objectContaining({
        case_number: 'RFE-2026-001',
        petitioner_name: 'Acme Corp',
        beneficiary_name: 'John Doe',
        visa_type: 'H-1B',
      })
    )
  })

  it('shows validation errors for missing required fields', async () => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Case number is required')
    expect(wrapper.text()).toContain('Petitioner name is required')
    expect(wrapper.text()).toContain('Beneficiary name is required')
    expect(wrapper.text()).toContain('Received date is required')
    expect(wrapper.text()).toContain('Deadline is required')
  })

  it('navigates to case detail after creation', async () => {
    const newCase = { id: '99', case_number: 'RFE-2026-001' }
    vi.spyOn(casesStore, 'createCase').mockResolvedValueOnce(newCase)

    await wrapper.find('#case_number').setValue('RFE-2026-001')
    await wrapper.find('#petitioner_name').setValue('Acme Corp')
    await wrapper.find('#beneficiary_name').setValue('John Doe')
    await wrapper.find('#rfe_received_date').setValue('2026-01-15')
    await wrapper.find('#rfe_deadline').setValue('2026-04-15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/cases/99')
  })

  it('shows loading state during submission', async () => {
    let resolveCreate
    vi.spyOn(casesStore, 'createCase').mockReturnValueOnce(
      new Promise((resolve) => (resolveCreate = resolve))
    )

    await wrapper.find('#case_number').setValue('RFE-2026-001')
    await wrapper.find('#petitioner_name').setValue('Acme Corp')
    await wrapper.find('#beneficiary_name').setValue('John Doe')
    await wrapper.find('#rfe_received_date').setValue('2026-01-15')
    await wrapper.find('#rfe_deadline').setValue('2026-04-15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Creating...')
    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()

    resolveCreate({ id: '99' })
    await flushPromises()
  })

  it('handles API errors on create', async () => {
    const error = new Error('fail')
    error.response = { data: { error: 'Case number already exists' } }
    vi.spyOn(casesStore, 'createCase').mockRejectedValueOnce(error)

    await wrapper.find('#case_number').setValue('RFE-2026-001')
    await wrapper.find('#petitioner_name').setValue('Acme Corp')
    await wrapper.find('#beneficiary_name').setValue('John Doe')
    await wrapper.find('#rfe_received_date').setValue('2026-01-15')
    await wrapper.find('#rfe_deadline').setValue('2026-04-15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Error is shown via notification store, not inline
    // Verify the form remains visible (did not navigate away)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('has a cancel link back to cases list', () => {
    const cancelLink = wrapper.find('a[href="/cases"]')
    expect(cancelLink.exists()).toBe(true)
  })
})
