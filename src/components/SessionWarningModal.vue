<script setup>
import { ClockIcon } from '@heroicons/vue/24/outline'

defineProps({
  show: Boolean,
  secondsLeft: {
    type: Number,
    default: 60,
  },
})

const emit = defineEmits(['continue'])
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" />

        <!-- Modal -->
        <div class="relative bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
          <!-- Warning bar -->
          <div class="bg-amber-500 h-1">
            <div
              class="bg-amber-600 h-full transition-all duration-1000 ease-linear"
              :style="{ width: `${(secondsLeft / 60) * 100}%` }"
            />
          </div>

          <div class="p-6 text-center">
            <!-- Icon -->
            <div class="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <ClockIcon class="h-6 w-6 text-amber-600" />
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Session Expiring
            </h3>

            <!-- Message -->
            <p class="text-sm text-gray-600 mb-1">
              You've been inactive for a while. For security, you'll be logged out in:
            </p>

            <!-- Countdown -->
            <p class="text-3xl font-bold text-amber-600 my-4">
              {{ secondsLeft }}<span class="text-base font-normal text-gray-500 ml-1">seconds</span>
            </p>

            <!-- Button -->
            <button
              @click="emit('continue')"
              class="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              I'm still here — Keep me logged in
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
