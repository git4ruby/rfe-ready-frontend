import { mount, flushPromises } from '@vue/test-utils'
import AuditLogView from '../AuditLogView.vue'
import { createMountOptions } from '../../test/helpers'
import { useAuditStore } from '../../stores/audit'

vi.mock('../../api/client')
import apiClient from '../../api/client'

vi.mock('../../composables/useQueryFilters', () => ({
  useQueryFilters: (defaults, { onLoad } = {}) => {
    const { ref, onMounted } = require('vue')
    const filters = ref({ ...defaults })
    const currentPage = ref(1)

    onMounted(() => {
      if (onLoad) onLoad(currentPage.value)
    })

    return {
      filters,
      currentPage,
      updateFilters: vi.fn((newFilters) => {
        Object.assign(filters.value, newFilters)
        currentPage.value = 1
        if (onLoad) onLoad(1)
      }),
      goToPage: vi.fn((page) => {
        currentPage.value = page
        if (onLoad) onLoad(page)
      }),
    }
  },
}))

const mockLogs = [
  {
    id: '1',
    action: 'create',
    auditable_type: 'RfeCase',
    auditable_name: 'RFE-2026-001',
    user_name: 'Jane Doe',
    user_email: 'jane@example.com',
    ip_address: '192.168.1.1',
    created_at: '2026-02-20T14:30:00Z',
    changes_data: { status: [null, 'draft'] },
  },
  {
    id: '2',
    action: 'update',
    auditable_type: 'User',
    auditable_name: 'John Smith',
    user_name: 'Admin User',
    user_email: 'admin@example.com',
    ip_address: '10.0.0.1',
    created_at: '2026-02-19T10:00:00Z',
    changes_data: { role: ['viewer', 'attorney'] },
  },
  {
    id: '3',
    action: 'destroy',
    auditable_type: 'KnowledgeDoc',
    auditable_name: 'Old Template',
    user_name: 'Jane Doe',
    user_email: 'jane@example.com',
    ip_address: '192.168.1.1',
    created_at: '2026-02-18T09:00:00Z',
    changes_data: {},
  },
]

const mockMeta = {
  current_page: 1,
  total_pages: 3,
  total_count: 25,
}

describe('AuditLogView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  async function mountAuditLog(logs = mockLogs, meta = mockMeta) {
    apiClient.get.mockResolvedValueOnce({ data: { data: logs, meta } })

    const wrapper = mount(AuditLogView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          EmptyState: { template: '<div data-testid="empty" />', props: ['title', 'description', 'icon'] },
          PaginationBar: {
            template: '<div data-testid="pagination" />',
            props: ['currentPage', 'totalPages', 'totalCount'],
            emits: ['page-change'],
          },
          ClipboardDocumentListIcon: { template: '<span />' },
          ChevronDownIcon: { template: '<span />' },
          ChevronUpIcon: { template: '<span />' },
          FunnelIcon: { template: '<span />' },
          ArrowDownTrayIcon: { template: '<span />' },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('fetches audit logs on mount', async () => {
    await mountAuditLog()

    expect(apiClient.get).toHaveBeenCalledWith('/audit_logs', expect.objectContaining({ params: expect.any(Object) }))
  })

  it('renders audit log table with entries', async () => {
    const wrapper = await mountAuditLog()

    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('Admin User')
    expect(wrapper.text()).toContain('RFE-2026-001')
    expect(wrapper.text()).toContain('John Smith')
  })

  it('shows column headers: Date/Time, User, Action, Resource', async () => {
    const wrapper = await mountAuditLog()

    expect(wrapper.text()).toContain('Date / Time')
    expect(wrapper.text()).toContain('User')
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Resource')
  })

  it('shows action badges (create, update, destroy)', async () => {
    const wrapper = await mountAuditLog()

    expect(wrapper.text()).toContain('create')
    expect(wrapper.text()).toContain('update')
    expect(wrapper.text()).toContain('destroy')
  })

  it('shows resource type labels', async () => {
    const wrapper = await mountAuditLog()

    expect(wrapper.text()).toContain('Case')
    expect(wrapper.text()).toContain('User')
    expect(wrapper.text()).toContain('Knowledge Doc')
  })

  it('shows pagination component', async () => {
    const wrapper = await mountAuditLog()

    expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(true)
  })

  it('shows filter dropdowns for action type and resource type', async () => {
    const wrapper = await mountAuditLog()

    const selects = wrapper.findAll('select')
    expect(selects.length).toBeGreaterThanOrEqual(2)

    // Check action filter has expected options
    const actionSelect = selects[0]
    const options = actionSelect.findAll('option')
    expect(options.length).toBeGreaterThanOrEqual(4) // All Actions, Create, Update, Destroy
  })

  it('shows export button', async () => {
    const wrapper = await mountAuditLog()

    const exportBtn = wrapper.findAll('button').find((b) => b.text().includes('Export'))
    expect(exportBtn).toBeDefined()
  })

  it('shows export dropdown with CSV and PDF options', async () => {
    const wrapper = await mountAuditLog()

    // Click export button to show dropdown
    const exportBtn = wrapper.findAll('button').find((b) => b.text().includes('Export'))
    await exportBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Export as CSV')
    expect(wrapper.text()).toContain('Export as PDF')
  })

  it('shows empty state when no logs', async () => {
    const wrapper = await mountAuditLog([], { current_page: 1, total_pages: 1, total_count: 0 })

    const store = useAuditStore()
    store.loading = false
    store.logs = []
    await flushPromises()

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  it('renders page header', async () => {
    const wrapper = await mountAuditLog()

    expect(wrapper.text()).toContain('Audit Log')
  })
})
