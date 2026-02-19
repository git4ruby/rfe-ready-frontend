<script setup>
defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const shortcuts = [
  { keys: ['/'], description: 'Focus search' },
  { keys: ['n'], description: 'New case (on cases page)' },
  { keys: ['g', 'd'], description: 'Go to Dashboard' },
  { keys: ['g', 'c'], description: 'Go to Cases' },
  { keys: ['g', 'k'], description: 'Go to Knowledge Base' },
  { keys: ['g', 'u'], description: 'Go to Users' },
  { keys: ['g', 'p'], description: 'Go to Profile' },
  { keys: ['Esc'], description: 'Close modal / blur input' },
  { keys: ['?'], description: 'Show this help' },
]
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/50" @click="emit('close')" />
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 class="text-base font-semibold text-gray-900">Keyboard Shortcuts</h3>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-500 text-sm">Esc</button>
        </div>
        <div class="px-5 py-3 space-y-2">
          <div
            v-for="(s, i) in shortcuts"
            :key="i"
            class="flex items-center justify-between py-1.5"
          >
            <span class="text-sm text-gray-600">{{ s.description }}</span>
            <div class="flex items-center gap-1">
              <kbd
                v-for="(key, j) in s.keys"
                :key="j"
                class="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded"
              >{{ key }}</kbd>
            </div>
          </div>
        </div>
        <div class="px-5 py-3 bg-gray-50 border-t border-gray-200">
          <p class="text-xs text-gray-400 text-center">Shortcuts are disabled while typing in inputs</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
