import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Global keyboard shortcuts.
 * Only fires when no input/textarea/select is focused (unless it's Escape).
 */
export function useKeyboardShortcuts() {
  const router = useRouter()
  const showHelp = ref(false)

  function handler(e) {
    const tag = e.target.tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable

    // Escape always works — close modals, blur inputs
    if (e.key === 'Escape') {
      if (showHelp.value) {
        showHelp.value = false
        return
      }
      if (isInput) {
        e.target.blur()
        return
      }
      return // let modal components handle their own Escape
    }

    // Skip shortcuts when typing in form fields
    if (isInput) return

    // Skip if modifier keys are held (allow browser shortcuts)
    if (e.metaKey || e.ctrlKey || e.altKey) return

    switch (e.key) {
      case '/': {
        e.preventDefault()
        const searchInput = document.querySelector('[data-shortcut="search"]')
        if (searchInput) searchInput.focus()
        break
      }
      case 'n': {
        // New case — only on cases page
        if (router.currentRoute.value.path === '/cases') {
          const btn = document.querySelector('[data-shortcut="new-case"]')
          if (btn) btn.click()
        }
        break
      }
      case 'g': {
        // Wait for second key press for "go to" navigation
        waitForSecondKey()
        break
      }
      case '?': {
        showHelp.value = !showHelp.value
        break
      }
    }
  }

  let goTimer = null
  function waitForSecondKey() {
    clearTimeout(goTimer)

    function secondKey(e) {
      clearTimeout(goTimer)
      document.removeEventListener('keydown', secondKey)

      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'd': router.push('/'); break
        case 'c': router.push('/cases'); break
        case 'k': router.push('/knowledge'); break
        case 'u': router.push('/users'); break
        case 'p': router.push('/profile'); break
      }
    }

    document.addEventListener('keydown', secondKey)
    goTimer = setTimeout(() => {
      document.removeEventListener('keydown', secondKey)
    }, 1000)
  }

  onMounted(() => document.addEventListener('keydown', handler))
  onUnmounted(() => {
    document.removeEventListener('keydown', handler)
    clearTimeout(goTimer)
  })

  return { showHelp }
}
