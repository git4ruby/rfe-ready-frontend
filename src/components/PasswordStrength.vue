<script setup>
import { computed } from 'vue'
import { passwordStrength } from '../composables/useFormValidation'

const props = defineProps({
  password: {
    type: String,
    default: '',
  },
})

const strength = computed(() => passwordStrength(props.password))
</script>

<template>
  <div v-if="password" class="mt-1.5">
    <div class="flex gap-1">
      <div
        v-for="i in 5"
        :key="i"
        class="h-1 flex-1 rounded-full transition-colors duration-200"
        :class="i <= strength.score ? strength.color : 'bg-gray-200'"
      />
    </div>
    <p class="text-xs mt-1" :class="strength.score <= 2 ? 'text-red-500' : 'text-gray-500'">
      {{ strength.label }}
    </p>
  </div>
</template>
