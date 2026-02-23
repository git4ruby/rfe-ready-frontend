import { mount, flushPromises } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'
import { createMountOptions } from '../../test/helpers'

vi.mock('../../api/client')
import apiClient from '../../api/client'

vi.mock('../../composables/useOnboarding', () => ({
  useOnboarding: () => ({
    checkAndStart: vi.fn(),
    restartTour: vi.fn(),
  }),
}))

// Stub chart components (canvas not available in happy-dom)
vi.mock('../../components/charts/DoughnutChart.vue', () => ({
  default: { template: '<div data-testid="doughnut-chart" />' },
}))
vi.mock('../../components/charts/BarChart.vue', () => ({
  default: { template: '<div data-testid="bar-chart" />' },
}))
vi.mock('../../components/charts/LineChart.vue', () => ({
  default: { template: '<div data-testid="line-chart" />' },
}))

const mockDashboardData = {
  total_cases: 42,
  approaching_deadlines: 5,
  cases_by_status: { draft: 10, review: 12, analyzing: 3, responded: 15, archived: 2 },
  cases_by_visa_type: { 'H-1B': 20, 'L-1': 10, 'O-1': 12 },
  cases_over_time: { '2025-01': 5, '2025-02': 10 },
  recent_cases: [{ id: '1', case_number: 'RFE-001', petitioner_name: 'Acme Corp', status: 'review', rfe_deadline: '2025-06-01' }],
  recent_activity: [
    {
      id: '1',
      action: 'create',
      user_name: 'Jane',
      auditable_type: 'RfeCase',
      auditable_name: 'RFE-001',
      created_at: new Date().toISOString(),
    },
  ],
}

describe('DashboardView', () => {
  let mountOptions

  beforeEach(async () => {
    mountOptions = createMountOptions()
    const router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  async function mountDashboard(data = mockDashboardData) {
    apiClient.get.mockResolvedValueOnce({ data: { data } })

    const wrapper = mount(DashboardView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          CaseStatusBadge: { template: '<span>{{ status }}</span>', props: ['status'] },
          DeadlineIndicator: { template: '<span>deadline</span>', props: ['deadline'] },
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('calls /dashboard API on mount with default period', async () => {
    await mountDashboard()
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', { params: { period: '30d' } })
  })

  it('renders stat cards with correct values', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('15')
  })

  it('renders recent cases table', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.text()).toContain('RFE-001')
    expect(wrapper.text()).toContain('Acme Corp')
  })

  it('renders recent activity', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('Created')
  })

  it('renders period selector with correct options', async () => {
    const wrapper = await mountDashboard()
    const select = wrapper.find('select')
    const options = select.findAll('option')
    expect(options).toHaveLength(4)
  })

  it('reloads dashboard when period changes', async () => {
    const wrapper = await mountDashboard()
    apiClient.get.mockClear()
    apiClient.get.mockResolvedValueOnce({ data: { data: mockDashboardData } })

    await wrapper.find('select').setValue('7d')
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', { params: { period: '7d' } })
  })

  it('shows loading skeleton before data loads', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const wrapper = mount(DashboardView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          CaseStatusBadge: true,
          DeadlineIndicator: true,
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
        },
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    resolveApi({ data: { data: mockDashboardData } })
    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
  })
})
