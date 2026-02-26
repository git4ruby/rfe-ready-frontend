import { mount, flushPromises } from '@vue/test-utils'
import CaseComments from '../CaseComments.vue'
import { createMountOptions } from '../../test/helpers'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/client')
import apiClient from '../../api/client'

vi.mock('../../composables/useCable', () => ({
  useCable: () => ({
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}))

const mockComments = [
  {
    id: 'c1',
    body: 'First comment on this case',
    user_id: 'u1',
    user_name: 'Jane Doe',
    parent_id: null,
    mentioned_user_ids: [],
    created_at: '2026-02-20T14:00:00Z',
    updated_at: '2026-02-20T14:00:00Z',
    replies: [
      {
        id: 'c3',
        body: 'Reply to first comment',
        user_id: 'u2',
        user_name: 'Bob Smith',
        parent_id: 'c1',
        mentioned_user_ids: [],
        created_at: '2026-02-20T15:00:00Z',
        updated_at: '2026-02-20T15:00:00Z',
        replies: [],
      },
    ],
  },
  {
    id: 'c2',
    body: 'Second comment by another user',
    user_id: 'u2',
    user_name: 'Bob Smith',
    parent_id: null,
    mentioned_user_ids: [],
    created_at: '2026-02-20T14:30:00Z',
    updated_at: '2026-02-20T14:30:00Z',
    replies: [],
  },
]

describe('CaseComments', () => {
  let mountOptions

  beforeEach(async () => {
    vi.resetAllMocks()
    mountOptions = createMountOptions()
    const router = mountOptions.router
    await router.push('/')
    await router.isReady()

    // Set up authenticated user with edit permissions
    const authStore = useAuthStore()
    authStore.user = {
      id: 'u1',
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'admin',
      email: 'admin@test.com',
    }
    authStore.token = 'test-token'
  })

  async function mountComments(comments = mockComments) {
    apiClient.get.mockResolvedValueOnce({ data: { data: comments } })

    const wrapper = mount(CaseComments, {
      props: { caseId: 'case-1' },
      global: {
        plugins: mountOptions.plugins,
        stubs: {
          ChatBubbleLeftEllipsisIcon: { template: '<span />' },
          PaperAirplaneIcon: { template: '<span />' },
          PencilIcon: { template: '<span />' },
          TrashIcon: { template: '<span />' },
          ArrowUturnLeftIcon: { template: '<span />' },
          XMarkIcon: { template: '<span />' },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('fetches comments on mount', async () => {
    await mountComments()
    expect(apiClient.get).toHaveBeenCalledWith('/cases/case-1/comments')
  })

  it('renders comments with user names', async () => {
    const wrapper = await mountComments()
    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('Bob Smith')
  })

  it('renders comment bodies', async () => {
    const wrapper = await mountComments()
    expect(wrapper.text()).toContain('First comment on this case')
    expect(wrapper.text()).toContain('Second comment by another user')
  })

  it('renders replies nested under parent', async () => {
    const wrapper = await mountComments()
    expect(wrapper.text()).toContain('Reply to first comment')
  })

  it('shows empty state when no comments', async () => {
    const wrapper = await mountComments([])
    expect(wrapper.text()).toContain('No comments yet')
  })

  it('shows the Comments heading', async () => {
    const wrapper = await mountComments()
    expect(wrapper.text()).toContain('Comments')
  })

  it('has a comment input textarea', async () => {
    const wrapper = await mountComments()
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
  })

  it('submits a new comment on Post click', async () => {
    const wrapper = await mountComments()

    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'c4',
          body: 'New comment',
          user_id: 'u1',
          user_name: 'Jane Doe',
          parent_id: null,
          mentioned_user_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          replies: [],
        },
      },
    })

    const textarea = wrapper.find('textarea')
    await textarea.setValue('New comment')

    const postBtn = wrapper.findAll('button').find((b) => b.text().includes('Post'))
    await postBtn.trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/cases/case-1/comments', {
      comment: { body: 'New comment', parent_id: null, mentioned_user_ids: [] },
    })
  })

  it('does not submit empty comment', async () => {
    const wrapper = await mountComments()

    const postBtn = wrapper.findAll('button').find((b) => b.text().includes('Post'))
    expect(postBtn.attributes('disabled')).toBeDefined()
  })
})
