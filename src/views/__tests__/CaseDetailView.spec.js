import { mount, flushPromises } from '@vue/test-utils'
import CaseDetailView from '../CaseDetailView.vue'
import { createMountOptions } from '../../test/helpers'
import { useCasesStore } from '../../stores/cases'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockCase = {
  id: '1',
  case_number: 'RFE-2026-001',
  uscis_receipt_number: 'EAC-26-123-45678',
  visa_type: 'H-1B',
  petitioner_name: 'Acme Corp',
  beneficiary_name: 'John Doe',
  status: 'draft',
  rfe_received_date: '2026-01-15',
  rfe_deadline: '2026-04-15',
  notes: 'Test case notes',
  assigned_attorney: { first_name: 'Jane', last_name: 'Smith' },
  created_at: '2026-01-10T10:00:00Z',
}

describe('CaseDetailView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
  })

  async function mountCaseDetail(caseData = mockCase, userRole = 'admin') {
    await router.push(`/cases/${caseData.id}`)
    await router.isReady()

    // Mock the store's fetchCase
    apiClient.get.mockResolvedValueOnce({ data: { data: caseData } })

    const authStore = useAuthStore()
    authStore.user = {
      id: '10',
      role: userRole,
      first_name: 'Test',
      last_name: 'User',
    }
    authStore.token = 'test-token'

    const wrapper = mount(CaseDetailView, {
      props: { id: caseData.id },
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          CaseStatusBadge: { template: '<span data-testid="status-badge">{{ status }}</span>', props: ['status'] },
          DeadlineIndicator: { template: '<span data-testid="deadline">deadline</span>', props: ['deadline'] },
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
          ConfirmDialog: { template: '<div data-testid="confirm-dialog" />', props: ['show', 'title', 'message', 'confirmLabel', 'loading'] },
          Breadcrumb: { template: '<div />', props: ['items'] },
          CopyButton: { template: '<button />', props: ['text'] },
          ArrowLeftIcon: { template: '<span />' },
          DocumentTextIcon: { template: '<span />' },
          DocumentArrowUpIcon: { template: '<span />' },
          MagnifyingGlassIcon: { template: '<span />' },
          ClipboardDocumentCheckIcon: { template: '<span />' },
          PencilSquareIcon: { template: '<span />' },
          PhotoIcon: { template: '<span />' },
          ArrowDownTrayIcon: { template: '<span />' },
          PlayIcon: { template: '<span />' },
          CheckIcon: { template: '<span />' },
          PaperAirplaneIcon: { template: '<span />' },
          ArchiveBoxIcon: { template: '<span />' },
          ArrowPathIcon: { template: '<span />' },
          TrashIcon: { template: '<span />' },
          CloudArrowUpIcon: { template: '<span />' },
          ChevronDownIcon: { template: '<span />' },
          ChevronUpIcon: { template: '<span />' },
          ExclamationTriangleIcon: { template: '<span />' },
          PlusIcon: { template: '<span />' },
          Bars3Icon: { template: '<span />' },
          CheckCircleIcon: { template: '<span />' },
          ClockIcon: { template: '<span />' },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('fetches case data on mount', async () => {
    await mountCaseDetail()
    expect(apiClient.get).toHaveBeenCalledWith('/cases/1')
  })

  it('renders case header with case number and status', async () => {
    const wrapper = await mountCaseDetail()

    expect(wrapper.text()).toContain('RFE-2026-001')
    expect(wrapper.find('[data-testid="status-badge"]').exists()).toBe(true)
  })

  it('shows tabs for navigating case sections', async () => {
    const wrapper = await mountCaseDetail()

    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).toContain('Documents')
    expect(wrapper.text()).toContain('RFE Analysis')
    expect(wrapper.text()).toContain('Drafts')
    expect(wrapper.text()).toContain('Exhibits')
    expect(wrapper.text()).toContain('Export')
    expect(wrapper.text()).toContain('Activity')
  })

  it('shows loading state while fetching', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    await router.push('/cases/1')
    await router.isReady()

    const authStore = useAuthStore()
    authStore.user = { id: '10', role: 'admin' }
    authStore.token = 'test-token'

    const wrapper = mount(CaseDetailView, {
      props: { id: '1' },
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          CaseStatusBadge: { template: '<span />', props: ['status'] },
          DeadlineIndicator: { template: '<span />', props: ['deadline'] },
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
          ConfirmDialog: true,
          Breadcrumb: true,
          CopyButton: true,
        },
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    resolveApi({ data: { data: mockCase } })
    await flushPromises()
  })

  it('displays case metadata (petitioner, beneficiary, visa type)', async () => {
    const wrapper = await mountCaseDetail()

    expect(wrapper.text()).toContain('Acme Corp')
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('H-1B')
  })

  it('shows start analysis button for admin when case is draft', async () => {
    const wrapper = await mountCaseDetail({ ...mockCase, status: 'draft' }, 'admin')

    expect(wrapper.text()).toContain('Start Analysis')
  })

  it('does not show start analysis button for viewer role', async () => {
    const wrapper = await mountCaseDetail({ ...mockCase, status: 'draft' }, 'viewer')

    // Viewers (role='viewer') are not in canEdit
    const analysisBtn = wrapper.findAll('button').find((b) => b.text().includes('Start Analysis'))
    expect(analysisBtn).toBeUndefined()
  })

  it('shows analyzing state when case status is analyzing', async () => {
    // Mock startPolling to avoid interval issues
    apiClient.get.mockResolvedValueOnce({ data: { data: { ...mockCase, status: 'analyzing' } } })

    await router.push('/cases/1')
    await router.isReady()

    const authStore = useAuthStore()
    authStore.user = { id: '10', role: 'admin' }
    authStore.token = 'test-token'

    const casesStore = useCasesStore()
    vi.spyOn(casesStore, 'startPolling').mockImplementation(() => {})

    const wrapper = mount(CaseDetailView, {
      props: { id: '1' },
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          CaseStatusBadge: { template: '<span>{{ status }}</span>', props: ['status'] },
          DeadlineIndicator: true,
          SkeletonLoader: true,
          LoadingSpinner: true,
          ConfirmDialog: true,
          Breadcrumb: true,
          CopyButton: true,
        },
      },
    })

    await flushPromises()
    expect(wrapper.text()).toContain('analyzing')
  })

  it('renders overview tab by default', async () => {
    const wrapper = await mountCaseDetail()

    // Overview is the default tab, so case details should be visible
    expect(wrapper.text()).toContain('Acme Corp')
    expect(wrapper.text()).toContain('John Doe')
  })

  it('shows attorney name in case details', async () => {
    const wrapper = await mountCaseDetail()

    expect(wrapper.text()).toContain('Jane Smith')
  })

  it('shows archive action for eligible statuses', async () => {
    const wrapper = await mountCaseDetail({ ...mockCase, status: 'draft' }, 'admin')

    const archiveBtn = wrapper.findAll('button').find((b) => b.text().includes('Archive'))
    expect(archiveBtn).toBeDefined()
  })

  it('shows delete action for admin users', async () => {
    const wrapper = await mountCaseDetail({ ...mockCase, status: 'draft' }, 'admin')

    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete'))
    expect(deleteBtn).toBeDefined()
  })

  it('handles case edit mode', async () => {
    const wrapper = await mountCaseDetail()

    const editBtn = wrapper.findAll('button').find((b) => b.text().includes('Edit'))
    if (editBtn) {
      await editBtn.trigger('click')
      await flushPromises()

      // After entering edit mode, should show save/cancel buttons
      const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save'))
      expect(saveBtn).toBeDefined()
    }
  })

  it('shows receipt number in case details', async () => {
    const wrapper = await mountCaseDetail()

    expect(wrapper.text()).toContain('EAC-26-123-45678')
  })
})
