import { ref, watch, onMounted } from 'vue'

/**
 * Auto-saves form data to localStorage with debounce.
 * Restores draft on mount if one exists.
 *
 * Usage:
 *   const { hasDraft, draftStatus, draftSavedAt, restoreDraft, clearDraft } = useAutoSaveDraft('case_new', form)
 */
export function useAutoSaveDraft(storageKey, formRef, { debounceMs = 2000 } = {}) {
  const key = `rfe_draft_${storageKey}`
  const hasDraft = ref(false)
  const draftSavedAt = ref(null)
  const draftStatus = ref('idle') // 'idle' | 'saving' | 'saved'

  let debounceTimer = null
  let statusTimer = null

  function readDraft() {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  function restoreDraft() {
    const saved = readDraft()
    if (saved?.data) {
      Object.assign(formRef.value, saved.data)
      hasDraft.value = false
    }
  }

  function clearDraft() {
    localStorage.removeItem(key)
    hasDraft.value = false
    draftSavedAt.value = null
    draftStatus.value = 'idle'
  }

  function saveDraft() {
    draftStatus.value = 'saving'
    try {
      const payload = {
        data: { ...formRef.value },
        saved_at: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(payload))
      draftSavedAt.value = new Date()
      draftStatus.value = 'saved'
      clearTimeout(statusTimer)
      statusTimer = setTimeout(() => {
        draftStatus.value = 'idle'
      }, 2000)
    } catch {
      draftStatus.value = 'idle'
    }
  }

  // Check for existing draft on mount
  onMounted(() => {
    const saved = readDraft()
    if (saved?.data) {
      hasDraft.value = true
      draftSavedAt.value = saved.saved_at ? new Date(saved.saved_at) : null
    }
  })

  // Watch form and auto-save with debounce
  watch(
    formRef,
    () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(saveDraft, debounceMs)
    },
    { deep: true }
  )

  return { hasDraft, draftStatus, draftSavedAt, restoreDraft, clearDraft }
}
