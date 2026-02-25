import { mount, flushPromises } from '@vue/test-utils'
import KnowledgeView from '../KnowledgeView.vue'
import { createMountOptions } from '../../test/helpers'
import { useKnowledgeStore } from '../../stores/knowledge'

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

const mockDocs = [
  {
    id: '1',
    title: 'H-1B Specialty Occupation Regulation',
    doc_type: 'regulation',
    visa_type: 'H-1B',
    rfe_category: 'specialty_occupation',
    is_active: true,
    embedding_status: 'embedded',
    uploaded_by_name: 'Jane Doe',
    file_name: 'regulation.pdf',
    file_url: '/files/regulation.pdf',
    created_at: '2025-06-10T10:00:00Z',
  },
  {
    id: '2',
    title: 'Sample Response Template',
    doc_type: 'template',
    visa_type: 'L-1',
    rfe_category: null,
    is_active: true,
    embedding_status: 'pending',
    uploaded_by_name: 'John Smith',
    file_name: null,
    file_url: null,
    created_at: '2025-07-20T10:00:00Z',
  },
]

const mockMeta = {
  current_page: 1,
  total_pages: 2,
  total_count: 10,
  stats: {
    total_docs: 10,
    embedded_count: 7,
    pending_count: 3,
    by_doc_type: { regulation: 5, template: 3, firm_knowledge: 2 },
  },
}

describe('KnowledgeView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  async function mountKnowledge(docs = mockDocs, meta = mockMeta) {
    apiClient.get.mockResolvedValueOnce({ data: { data: docs, meta } })

    const wrapper = mount(KnowledgeView, {
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          SkeletonLoader: { template: '<div data-testid="skeleton" />' },
          EmptyState: { template: '<div data-testid="empty"><slot name="action" /></div>', props: ['title', 'description', 'icon'] },
          PaginationBar: {
            template: '<div data-testid="pagination" />',
            props: ['currentPage', 'totalPages', 'totalCount'],
            emits: ['page-change'],
          },
          ConfirmDialog: {
            template: '<div data-testid="confirm-dialog" />',
            props: ['show', 'title', 'message', 'confirmLabel', 'loading'],
            emits: ['confirm', 'cancel'],
          },
          BookOpenIcon: { template: '<span />' },
          PlusIcon: { template: '<span />' },
          MagnifyingGlassIcon: { template: '<span />' },
          PencilSquareIcon: { template: '<span />' },
          TrashIcon: { template: '<span />' },
          XMarkIcon: { template: '<span />' },
          DocumentTextIcon: { template: '<span />' },
          PaperClipIcon: { template: '<span />' },
          ArrowUpTrayIcon: { template: '<span />' },
          CloudArrowUpIcon: { template: '<span />' },
          CpuChipIcon: { template: '<span />' },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('fetches knowledge docs on mount', async () => {
    await mountKnowledge()

    expect(apiClient.get).toHaveBeenCalledWith('/knowledge_docs', expect.objectContaining({ params: expect.any(Object) }))
  })

  it('renders knowledge documents list', async () => {
    const wrapper = await mountKnowledge()

    expect(wrapper.text()).toContain('H-1B Specialty Occupation Regulation')
    expect(wrapper.text()).toContain('Sample Response Template')
  })

  it('shows document metadata (visa_type, doc_type)', async () => {
    const wrapper = await mountKnowledge()

    expect(wrapper.text()).toContain('Regulation')
    expect(wrapper.text()).toContain('Template')
    expect(wrapper.text()).toContain('H-1B')
    expect(wrapper.text()).toContain('L-1')
  })

  it('shows add document button', async () => {
    const wrapper = await mountKnowledge()

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Document'))
    expect(addBtn).toBeDefined()
  })

  it('opens create document modal', async () => {
    const wrapper = await mountKnowledge()

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Document'))
    await addBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Add Document')
    expect(wrapper.find('#doc-title').exists()).toBe(true)
    expect(wrapper.find('#doc-type').exists()).toBe(true)
  })

  it('shows empty state when no documents', async () => {
    const emptyMeta = { current_page: 1, total_pages: 1, total_count: 0 }
    const wrapper = await mountKnowledge([], emptyMeta)

    const store = useKnowledgeStore()
    store.loading = false
    store.docs = []
    await flushPromises()

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  it('shows pagination component', async () => {
    const wrapper = await mountKnowledge()

    expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(true)
  })

  it('shows search input for filtering documents', async () => {
    const wrapper = await mountKnowledge()

    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toContain('Search')
  })

  it('shows filter dropdowns for doc_type and visa_type', async () => {
    const wrapper = await mountKnowledge()

    const selects = wrapper.findAll('select')
    // Should have doc_type and visa_type filter selects
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })

  it('shows embedding status badges', async () => {
    const wrapper = await mountKnowledge()

    expect(wrapper.text()).toContain('Embedded')
    expect(wrapper.text()).toContain('Pending')
  })

  it('shows active/inactive status', async () => {
    const wrapper = await mountKnowledge()

    expect(wrapper.text()).toContain('Active')
  })
})
