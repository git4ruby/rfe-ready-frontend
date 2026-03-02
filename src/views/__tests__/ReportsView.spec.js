import { mount, flushPromises } from '@vue/test-utils'
import ReportsView from '../ReportsView.vue'
import { createMountOptions } from '../../test/helpers'
import { useReportsStore } from '../../stores/reports'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockReportData = {
  total_cases: 42,
  completion_rate: 78,
  avg_response_time: 5,
  evidence_collection_rate: 91,
  cases_by_status: {
    draft: 10,
    analyzing: 8,
    review: 12,
    responded: 9,
    archived: 3,
  },
  cases_by_visa_type: {
    'H-1B': 20,
    'L-1': 10,
    'O-1': 7,
    'EB-1': 5,
  },
  attorney_performance: [
    { attorney_name: 'Jane Doe', case_count: 15, avg_resolution_days: 4.2 },
    { attorney_name: 'John Smith', case_count: 10, avg_resolution_days: 6.1 },
  ],
  cases_over_time: {
    '2026-02-01': 3,
    '2026-02-08': 5,
    '2026-02-15': 7,
  },
  draft_approval_stats: { approved: 30, total: 40 },
}

describe('ReportsView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  async function mountReports(reportData = mockReportData) {
    apiClient.get.mockResolvedValueOnce({ data: { data: reportData } })

    const wrapper = mount(ReportsView, {
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

  it('renders page header', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Reports')
    expect(wrapper.text()).toContain('Analytics and insights for your RFE cases.')
  })

  it('fetches report dashboard on mount', async () => {
    await mountReports()

    expect(apiClient.get).toHaveBeenCalledWith('/reports/dashboard', { params: { period: '30d' } })
  })

  it('shows loading spinner while fetching data', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const wrapper = mount(ReportsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
        },
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)

    resolveApi({ data: { data: mockReportData } })
    await flushPromises()
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(false)
  })

  it('shows no data state when reportData is null', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: null } })

    const store = useReportsStore()

    const wrapper = mount(ReportsView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
        },
      },
    })

    await flushPromises()

    // Store sets reportData to null since the response data is null
    store.reportData = null
    store.loading = false
    await flushPromises()

    expect(wrapper.text()).toContain('No report data available for this period.')
  })

  it('renders stat cards with correct values', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('78%')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('91%')
  })

  it('renders stat card labels', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Total Cases')
    expect(wrapper.text()).toContain('Completion Rate')
    expect(wrapper.text()).toContain('Avg Response Time')
    expect(wrapper.text()).toContain('Evidence Collection')
  })

  it('renders cases by status chart', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Cases by Status')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('12')
  })

  it('renders cases by visa type chart', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Cases by Visa Type')
    expect(wrapper.text()).toContain('H-1B')
    expect(wrapper.text()).toContain('L-1')
    expect(wrapper.text()).toContain('O-1')
  })

  it('renders attorney performance table', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Attorney Performance')
    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('15')
    expect(wrapper.text()).toContain('4.2')
    expect(wrapper.text()).toContain('John Smith')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('6.1')
  })

  it('renders attorney performance table headers', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Attorney')
    expect(wrapper.text()).toContain('Cases')
    expect(wrapper.text()).toContain('Avg Resolution (days)')
  })

  it('renders draft approval stats', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Draft Approval')
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.text()).toContain('30')
    expect(wrapper.text()).toContain('40')
  })

  it('renders period selector buttons', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('7 Days')
    expect(wrapper.text()).toContain('30 Days')
    expect(wrapper.text()).toContain('90 Days')
    expect(wrapper.text()).toContain('All Time')
  })

  it('changes period and re-fetches data on button click', async () => {
    const wrapper = await mountReports()

    apiClient.get.mockResolvedValueOnce({ data: { data: mockReportData } })

    const periodBtn = wrapper.findAll('button').find((b) => b.text().includes('7 Days'))
    await periodBtn.trigger('click')
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/reports/dashboard', { params: { period: '7d' } })
  })

  it('renders cases over time chart', async () => {
    const wrapper = await mountReports()

    expect(wrapper.text()).toContain('Cases Over Time')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('7')
  })
})
