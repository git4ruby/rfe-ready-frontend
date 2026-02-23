import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useQueryFilters } from '../useQueryFilters'

function createTestSetup(defaults = {}) {
  const onLoad = vi.fn()

  const TestComponent = defineComponent({
    setup() {
      const result = useQueryFilters(defaults, { onLoad })
      return { ...result }
    },
    template: '<div />',
  })

  const routes = [
    { path: '/', component: { template: '<div />' } },
    { path: '/cases', component: { template: '<div />' } },
  ]

  const router = createRouter({ history: createMemoryHistory(), routes })

  return { TestComponent, router, onLoad }
}

describe('useQueryFilters', () => {
  it('initializes filters from defaults', async () => {
    const { TestComponent, router } = createTestSetup({ q: '', status: '' })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(TestComponent, { global: { plugins: [router] } })
    expect(wrapper.vm.filters).toEqual({ q: '', status: '' })
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('calls onLoad on mount with page 1', async () => {
    const { TestComponent, router, onLoad } = createTestSetup({ q: '' })
    await router.push('/')
    await router.isReady()

    mount(TestComponent, { global: { plugins: [router] } })
    await flushPromises()
    expect(onLoad).toHaveBeenCalledWith(1)
  })

  it('reads page from URL query on mount', async () => {
    const { TestComponent, router, onLoad } = createTestSetup({ q: '' })
    await router.push('/?page=3')
    await router.isReady()

    const wrapper = mount(TestComponent, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.vm.currentPage).toBe(3)
    expect(onLoad).toHaveBeenCalledWith(3)
  })

  it('reads filter values from URL query on mount', async () => {
    const { TestComponent, router } = createTestSetup({ q: '', status: '' })
    await router.push('/?q=hello&status=review')
    await router.isReady()

    const wrapper = mount(TestComponent, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.vm.filters.q).toBe('hello')
    expect(wrapper.vm.filters.status).toBe('review')
  })

  it('updateFilters resets page to 1 and calls onLoad', async () => {
    const { TestComponent, router, onLoad } = createTestSetup({ q: '' })
    await router.push('/?page=5')
    await router.isReady()

    const wrapper = mount(TestComponent, { global: { plugins: [router] } })
    await flushPromises()
    onLoad.mockClear()

    wrapper.vm.updateFilters({ q: 'search-term' })
    await flushPromises()

    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.filters.q).toBe('search-term')
    expect(onLoad).toHaveBeenCalledWith(1)
  })

  it('goToPage updates page and calls onLoad', async () => {
    const { TestComponent, router, onLoad } = createTestSetup({ q: '' })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(TestComponent, { global: { plugins: [router] } })
    await flushPromises()
    onLoad.mockClear()

    wrapper.vm.goToPage(4)
    await flushPromises()

    expect(wrapper.vm.currentPage).toBe(4)
    expect(onLoad).toHaveBeenCalledWith(4)
  })

  it('updateFilters writes non-default filter values to URL query', async () => {
    const { TestComponent, router } = createTestSetup({ q: '', status: '' })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(TestComponent, { global: { plugins: [router] } })
    await flushPromises()

    wrapper.vm.updateFilters({ q: 'test' })
    await flushPromises()

    expect(router.currentRoute.value.query).toMatchObject({ q: 'test' })
  })
})
