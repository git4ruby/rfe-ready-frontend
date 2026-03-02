import { mount, flushPromises } from '@vue/test-utils'
import CaseTemplatesView from '../CaseTemplatesView.vue'
import { createMountOptions } from '../../test/helpers'
import { useTemplatesStore } from '../../stores/templates'

vi.mock('../../api/client')
import apiClient from '../../api/client'

const mockTemplates = [
  {
    id: 'tpl-001',
    name: 'H-1B Specialty Occupation',
    description: 'Standard RFE for H-1B specialty occupation cases',
    visa_category: 'H-1B',
    default_sections: [
      { title: 'Education', description: 'Educational qualifications' },
      { title: 'Experience', description: 'Work experience details' },
    ],
    default_checklist: [
      { name: 'Degree evaluation', required: true },
      { name: 'Employment letter', required: true },
      { name: 'Pay stubs', required: false },
    ],
    default_notes: 'Review all documents before submission.',
  },
  {
    id: 'tpl-002',
    name: 'O-1 Extraordinary Ability',
    description: 'Template for O-1A/O-1B RFE responses',
    visa_category: 'O-1',
    default_sections: [
      { title: 'Awards', description: 'National or international awards' },
    ],
    default_checklist: [
      { name: 'Award certificates', required: true },
    ],
    default_notes: '',
  },
]

describe('CaseTemplatesView', () => {
  let mountOptions
  let router

  beforeEach(async () => {
    vi.clearAllMocks()
    mountOptions = createMountOptions({ piniaOptions: { stubActions: false } })
    router = mountOptions.router
    await router.push('/')
    await router.isReady()
  })

  const stubs = {
    SkeletonLoader: { template: '<div data-testid="skeleton" />' },
    EmptyState: { template: '<div data-testid="empty"><slot name="action" /></div>', props: ['title', 'description', 'icon'] },
    ConfirmDialog: { template: '<div data-testid="confirm-dialog" />', props: ['show', 'title', 'message', 'confirmLabel', 'loading'], emits: ['confirm', 'cancel'] },
    DocumentDuplicateIcon: { template: '<span />' },
    PlusIcon: { template: '<span />' },
    PencilSquareIcon: { template: '<span />' },
    TrashIcon: { template: '<span />' },
    XMarkIcon: { template: '<span />' },
  }

  async function mountTemplates(templates = mockTemplates) {
    apiClient.get.mockResolvedValueOnce({ data: { data: templates } })

    const wrapper = mount(CaseTemplatesView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    // Ensure store is populated with expected data (reset any stale state)
    const store = useTemplatesStore()
    store.templates = [...templates]
    store.loading = false
    await flushPromises()

    return wrapper
  }

  it('renders page header', async () => {
    const wrapper = await mountTemplates()

    expect(wrapper.text()).toContain('Case Templates')
    expect(wrapper.text()).toContain('Create and manage reusable templates for common RFE case types.')
  })

  it('fetches templates on mount', async () => {
    await mountTemplates()

    expect(apiClient.get).toHaveBeenCalledWith('/case_templates')
  })

  it('shows loading skeleton while fetching templates', async () => {
    let resolveApi
    apiClient.get.mockReturnValueOnce(new Promise((resolve) => (resolveApi = resolve)))

    const wrapper = mount(CaseTemplatesView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    resolveApi({ data: { data: mockTemplates } })
    await flushPromises()
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
  })

  it('shows empty state when no templates', async () => {
    const wrapper = await mountTemplates([])

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  it('renders template names in table', async () => {
    const wrapper = await mountTemplates()

    expect(wrapper.text()).toContain('H-1B Specialty Occupation')
    expect(wrapper.text()).toContain('O-1 Extraordinary Ability')
  })

  it('renders template descriptions in table', async () => {
    const wrapper = await mountTemplates()

    expect(wrapper.text()).toContain('Standard RFE for H-1B specialty occupation cases')
    expect(wrapper.text()).toContain('Template for O-1A/O-1B RFE responses')
  })

  it('renders visa category badges', async () => {
    const wrapper = await mountTemplates()

    expect(wrapper.text()).toContain('H-1B')
    expect(wrapper.text()).toContain('O-1')
  })

  it('renders sections and checklist counts', async () => {
    const wrapper = await mountTemplates()

    // H-1B template has 2 sections and 3 checklist items
    // O-1 template has 1 section and 1 checklist item
    const cells = wrapper.findAll('td')
    const cellTexts = cells.map((c) => c.text())

    expect(cellTexts).toContain('2')
    expect(cellTexts).toContain('3')
    expect(cellTexts).toContain('1')
  })

  it('shows table headers', async () => {
    const wrapper = await mountTemplates()

    expect(wrapper.text()).toContain('Template Name')
    expect(wrapper.text()).toContain('Visa Category')
    expect(wrapper.text()).toContain('Default Sections')
    expect(wrapper.text()).toContain('Default Checklist')
    expect(wrapper.text()).toContain('Actions')
  })

  it('shows create template button', async () => {
    const wrapper = await mountTemplates()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Template'))
    expect(createBtn).toBeDefined()
  })

  it('opens create modal on button click', async () => {
    const wrapper = await mountTemplates()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Template'))
    await createBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Create Template')
    expect(wrapper.find('#template-name').exists()).toBe(true)
    expect(wrapper.find('#template-description').exists()).toBe(true)
    expect(wrapper.find('#template-visa-category').exists()).toBe(true)
  })

  it('shows visa category options in modal form', async () => {
    const wrapper = await mountTemplates()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Template'))
    await createBtn.trigger('click')
    await flushPromises()

    const select = wrapper.find('#template-visa-category')
    const options = select.findAll('option')
    const optionValues = options.map((o) => o.element.value)

    expect(optionValues).toContain('H-1B')
    expect(optionValues).toContain('L-1')
    expect(optionValues).toContain('O-1')
    expect(optionValues).toContain('EB-1')
    expect(optionValues).toContain('EB-2')
    expect(optionValues).toContain('EB-3')
    expect(optionValues).toContain('Other')
  })

  it('submits create form successfully', async () => {
    const wrapper = await mountTemplates()

    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'tpl-003',
          name: 'EB-2 NIW Template',
          description: 'National Interest Waiver',
          visa_category: 'EB-2',
          default_sections: [],
          default_checklist: [],
          default_notes: '',
        },
      },
    })

    // Open modal
    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Template'))
    await createBtn.trigger('click')
    await flushPromises()

    // Fill form
    await wrapper.find('#template-name').setValue('EB-2 NIW Template')
    await wrapper.find('#template-description').setValue('National Interest Waiver')
    await wrapper.find('#template-visa-category').setValue('EB-2')

    // Submit
    const form = wrapper.find('form')
    await form.trigger('submit')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/case_templates', {
      case_template: expect.objectContaining({
        name: 'EB-2 NIW Template',
        description: 'National Interest Waiver',
        visa_category: 'EB-2',
      }),
    })
  })

  it('opens edit modal with pre-filled data', async () => {
    const wrapper = await mountTemplates()

    // First row's first action button is the edit button
    const firstRow = wrapper.findAll('tbody tr')[0]
    const editBtn = firstRow.findAll('button')[0]
    await editBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Edit Template')
    expect(wrapper.find('#template-name').element.value).toBe('H-1B Specialty Occupation')
  })

  it('shows edit and delete buttons for each template row', async () => {
    const wrapper = await mountTemplates()

    // Each template row has action buttons in the last cell
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(2)

    // Each row should have 2 action buttons (edit + delete)
    rows.forEach((row) => {
      const actionButtons = row.findAll('button')
      expect(actionButtons.length).toBe(2)
    })
  })

  it('shows add section button in modal', async () => {
    const wrapper = await mountTemplates()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Template'))
    await createBtn.trigger('click')
    await flushPromises()

    const addSectionBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Section'))
    expect(addSectionBtn).toBeDefined()
  })

  it('shows add checklist item button in modal', async () => {
    const wrapper = await mountTemplates()

    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Template'))
    await createBtn.trigger('click')
    await flushPromises()

    const addItemBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Item'))
    expect(addItemBtn).toBeDefined()
  })

  it('handles API error on load', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network error'))

    mount(CaseTemplatesView, {
      global: {
        plugins: mountOptions.plugins,
        stubs,
      },
    })

    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/case_templates')
  })
})
