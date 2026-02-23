import { mount } from '@vue/test-utils'
import CaseStatusBadge from '../CaseStatusBadge.vue'

describe('CaseStatusBadge', () => {
  it('renders Draft for draft status', () => {
    const wrapper = mount(CaseStatusBadge, { props: { status: 'draft' } })
    expect(wrapper.text()).toBe('Draft')
    expect(wrapper.find('span').classes()).toContain('bg-gray-100')
  })

  it('renders In Review for review status', () => {
    const wrapper = mount(CaseStatusBadge, { props: { status: 'review' } })
    expect(wrapper.text()).toBe('In Review')
    expect(wrapper.find('span').classes()).toContain('bg-blue-100')
  })

  it('renders Analyzing for analyzing status', () => {
    const wrapper = mount(CaseStatusBadge, { props: { status: 'analyzing' } })
    expect(wrapper.text()).toBe('Analyzing')
    expect(wrapper.find('span').classes()).toContain('bg-amber-100')
  })

  it('renders Responded for responded status', () => {
    const wrapper = mount(CaseStatusBadge, { props: { status: 'responded' } })
    expect(wrapper.text()).toBe('Responded')
    expect(wrapper.find('span').classes()).toContain('bg-green-100')
  })

  it('renders Archived for archived status', () => {
    const wrapper = mount(CaseStatusBadge, { props: { status: 'archived' } })
    expect(wrapper.text()).toBe('Archived')
    expect(wrapper.find('span').classes()).toContain('bg-gray-200')
  })

  it('falls back to raw status text for unknown statuses', () => {
    const wrapper = mount(CaseStatusBadge, { props: { status: 'custom_status' } })
    expect(wrapper.text()).toBe('custom_status')
  })
})
