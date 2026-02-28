<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCasesStore } from '../stores/cases'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import { useCable } from '../composables/useCable'
import {
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  caseId: { type: String, required: true },
})

const casesStore = useCasesStore()
const authStore = useAuthStore()
const notify = useNotificationStore()
const { subscribe } = useCable()

const newCommentBody = ref('')
const submitting = ref(false)
const replyingTo = ref(null)
const replyBody = ref('')
const editingComment = ref(null)
const editBody = ref('')

let cableSubscription = null

onMounted(async () => {
  await loadComments()
  setupWebSocket()
})

onUnmounted(() => {
  if (cableSubscription) {
    cableSubscription.unsubscribe()
    cableSubscription = null
  }
})

async function loadComments() {
  try {
    await casesStore.fetchComments(props.caseId)
  } catch {
    notify.error('Failed to load comments.')
  }
}

function setupWebSocket() {
  cableSubscription = subscribe('CaseUpdatesChannel', {}, {
    received(data) {
      if (data.type === 'comment_added' && data.case_id === props.caseId) {
        loadComments()
      }
    },
  })
}

async function submitComment() {
  if (!newCommentBody.value.trim()) return
  submitting.value = true
  try {
    await casesStore.createComment(props.caseId, newCommentBody.value.trim())
    newCommentBody.value = ''
  } catch {
    notify.error('Failed to post comment.')
  } finally {
    submitting.value = false
  }
}

async function submitReply(parentId) {
  if (!replyBody.value.trim()) return
  submitting.value = true
  try {
    await casesStore.createComment(props.caseId, replyBody.value.trim(), parentId)
    replyBody.value = ''
    replyingTo.value = null
  } catch {
    notify.error('Failed to post reply.')
  } finally {
    submitting.value = false
  }
}

function startReply(commentId) {
  replyingTo.value = commentId
  replyBody.value = ''
  editingComment.value = null
}

function cancelReply() {
  replyingTo.value = null
  replyBody.value = ''
}

function startEdit(comment) {
  editingComment.value = comment.id
  editBody.value = comment.body
  replyingTo.value = null
}

function cancelEdit() {
  editingComment.value = null
  editBody.value = ''
}

async function saveEdit(commentId) {
  if (!editBody.value.trim()) return
  try {
    await casesStore.updateComment(props.caseId, commentId, editBody.value.trim())
    editingComment.value = null
    editBody.value = ''
  } catch {
    notify.error('Failed to update comment.')
  }
}

async function removeComment(commentId) {
  try {
    await casesStore.deleteComment(props.caseId, commentId)
    notify.success('Comment deleted.')
  } catch {
    notify.error('Failed to delete comment.')
  }
}

function canModify(comment) {
  return authStore.isAdmin || comment.user_id === authStore.user?.id
}

function formatTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Comments</h3>

    <!-- New comment form -->
    <div v-if="authStore.canEdit" class="mb-6">
      <div class="flex gap-3">
        <div class="shrink-0">
          <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
            {{ authStore.user?.first_name?.charAt(0) }}{{ authStore.user?.last_name?.charAt(0) }}
          </div>
        </div>
        <div class="flex-1">
          <textarea
            v-model="newCommentBody"
            rows="3"
            placeholder="Add a comment..."
            class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-none"
            @keydown.meta.enter="submitComment"
            @keydown.ctrl.enter="submitComment"
          />
          <div class="mt-2 flex justify-between items-center">
            <p class="text-xs text-gray-400">Press Cmd+Enter to submit</p>
            <button
              @click="submitComment"
              :disabled="submitting || !newCommentBody.trim()"
              class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon class="h-4 w-4" />
              Post
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="casesStore.commentsLoading && casesStore.comments.length === 0" class="flex justify-center py-8">
      <div class="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>

    <!-- Comments list -->
    <div v-else-if="casesStore.comments.length > 0" class="space-y-4">
      <div
        v-for="comment in casesStore.comments"
        :key="comment.id"
        class="border border-gray-200 rounded-lg p-4"
      >
        <!-- Comment header -->
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <div class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
              {{ comment.user_name?.split(' ').map(n => n.charAt(0)).join('') }}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900">{{ comment.user_name }}</span>
                <span class="text-xs text-gray-400" :title="new Date(comment.created_at).toLocaleString()">
                  {{ formatTime(comment.created_at) }}
                </span>
                <span v-if="comment.updated_at !== comment.created_at" class="text-xs text-gray-400 italic">(edited)</span>
              </div>
              <div v-if="canModify(comment)" class="flex items-center gap-1">
                <button @click="startEdit(comment)" class="p-1 text-gray-400 hover:text-gray-600 rounded" title="Edit">
                  <PencilIcon class="h-3.5 w-3.5" />
                </button>
                <button @click="removeComment(comment.id)" class="p-1 text-gray-400 hover:text-red-500 rounded" title="Delete">
                  <TrashIcon class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <!-- Edit mode -->
            <div v-if="editingComment === comment.id" class="mt-2">
              <textarea
                v-model="editBody"
                rows="3"
                class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-none"
              />
              <div class="mt-2 flex gap-2 justify-end">
                <button @click="cancelEdit" class="px-2 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button
                  @click="saveEdit(comment.id)"
                  :disabled="!editBody.trim()"
                  class="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            <!-- Comment body -->
            <p v-else class="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">{{ comment.body }}</p>

            <!-- Reply button -->
            <div class="mt-2">
              <button
                v-if="authStore.canEdit && replyingTo !== comment.id"
                @click="startReply(comment.id)"
                class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600"
              >
                <ArrowUturnLeftIcon class="h-3.5 w-3.5" />
                Reply
              </button>
            </div>

            <!-- Replies -->
            <div v-if="comment.replies && comment.replies.length > 0" class="mt-3 ml-4 space-y-3 border-l-2 border-gray-100 pl-4">
              <div v-for="reply in comment.replies" :key="reply.id" class="flex items-start gap-2">
                <div class="shrink-0">
                  <div class="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                    {{ reply.user_name?.split(' ').map(n => n.charAt(0)).join('') }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-gray-900">{{ reply.user_name }}</span>
                      <span class="text-xs text-gray-400">{{ formatTime(reply.created_at) }}</span>
                    </div>
                    <div v-if="canModify(reply)" class="flex items-center gap-1">
                      <button @click="startEdit(reply)" class="p-0.5 text-gray-400 hover:text-gray-600 rounded" title="Edit">
                        <PencilIcon class="h-3 w-3" />
                      </button>
                      <button @click="removeComment(reply.id)" class="p-0.5 text-gray-400 hover:text-red-500 rounded" title="Delete">
                        <TrashIcon class="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div v-if="editingComment === reply.id" class="mt-1">
                    <textarea
                      v-model="editBody"
                      rows="2"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs resize-none"
                    />
                    <div class="mt-1 flex gap-2 justify-end">
                      <button @click="cancelEdit" class="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-800">Cancel</button>
                      <button
                        @click="saveEdit(reply.id)"
                        :disabled="!editBody.trim()"
                        class="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <p v-else class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ reply.body }}</p>
                </div>
              </div>
            </div>

            <!-- Reply form -->
            <div v-if="replyingTo === comment.id" class="mt-3 ml-4 border-l-2 border-indigo-200 pl-4">
              <textarea
                v-model="replyBody"
                rows="2"
                placeholder="Write a reply..."
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-none"
                @keydown.meta.enter="submitReply(comment.id)"
                @keydown.ctrl.enter="submitReply(comment.id)"
              />
              <div class="mt-2 flex gap-2 justify-end">
                <button @click="cancelReply" class="px-2 py-1 text-sm text-gray-600 hover:text-gray-800">
                  Cancel
                </button>
                <button
                  @click="submitReply(comment.id)"
                  :disabled="submitting || !replyBody.trim()"
                  class="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <ChatBubbleLeftEllipsisIcon class="mx-auto h-10 w-10 text-gray-400" />
      <h4 class="mt-3 text-sm font-medium text-gray-900">No comments yet</h4>
      <p class="mt-1 text-xs text-gray-500">Be the first to add a comment to this case.</p>
    </div>
  </div>
</template>
