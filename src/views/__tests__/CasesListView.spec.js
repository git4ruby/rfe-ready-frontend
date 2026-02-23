import { mount, flushPromises } from '@vue/test-utils'
import CasesListView from '../CasesListView.vue'
import { createMountOptions } from '../../test/helpers'
import { useCasesStore } from '../../stores/cases'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockCases = [
  {
    id: '1',
    case_number: 'RFE-001',
    petitioner_name: 'Acme Corp',
    beneficiary_name: 'John Doe',
    visa_type: 'H-1B',
    status: 'review',
    rfe_deadline: '2025-06-01',
  },
  {
    id: '2',
    case_number: 'RFE-002',
    petitioner_name: 'Beta Inc',
    beneficiary_name: 'Jane Smith',
    visa_type: 'L-1',
    status: 'draft',
    rfe_deadline: null,
  },
]

describe('CasesListView', () => {
  let wrapper
  let mountOptions

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    const router = mountOptions.router
    await router.push('/cases')
    await router.isReady()

    apiClient.get.mockResolvedValue({
      data: { data: mockCases, meta: { current_page: 1, total_pages: 1, total_count: 2 } },
    })

    wrapper = mount(CasesListView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          CaseStatusBadge: { template: '<span>{{ status }}</span>', props: ['status'] },
          DeadlineIndicator: { template: '<span>deadline</span>', props: ['deadline'] },
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          EmptyState: { template: '<div data-testid="empty"><slot name="action" /></div>', props: ['title', 'description'] },
          PaginationBar: {
            template: '<div data-testid="pagination" />',
            props: ['currentPage', 'totalPages', 'totalCount'],
            emits: ['page-change'],
          },
        },
      },
    })

    await flushPromises()
  })

  it('fetches cases on mount', () => {
    expect(apiClient.get).toHaveBeenCalledWith('/cases', { params: { page: 1 } })
  })

  it('renders case rows in the table', () => {
    expect(wrapper.text()).toContain('RFE-001')
    expect(wrapper.text()).toContain('Acme Corp')
    expect(wrapper.text()).toContain('RFE-002')
    expect(wrapper.text()).toContain('Beta Inc')
  })

  it('renders new case button', () => {
    const newCaseLink = wrapper.find('a[href="/cases/new"]')
    expect(newCaseLink.exists()).toBe(true)
  })

  it('shows empty state when no cases exist', async () => {
    const casesStore = useCasesStore()
    casesStore.cases = []
    casesStore.loading = false
    await flushPromises()

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  it('filters cases by search query', async () => {
    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('Acme')
    await flushPromises()

    // The mobile cards should only show the matching case
    const mobileCards = wrapper.findAll('.md\\:hidden .bg-white')
    const cardTexts = mobileCards.map((c) => c.text())
    const matchingCards = cardTexts.filter((t) => t.includes('RFE-001'))
    expect(matchingCards.length).toBeGreaterThan(0)
  })
})
