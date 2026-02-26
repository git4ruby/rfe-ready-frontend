<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShieldExclamationIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const { t } = useI18n()
const show = ref(false)

onMounted(() => {
  show.value = localStorage.getItem('2fa_enforcement_required') === 'true'
})

function goToSetup() {
  router.push({ name: 'Profile', query: { setup_2fa: 'true' } })
}

function dismiss() {
  show.value = false
}
</script>

<template>
  <div v-if="show" class="bg-amber-50 border-b border-amber-200 px-4 py-3">
    <div class="mx-auto max-w-7xl flex items-center justify-between">
      <div class="flex items-center gap-3">
        <ShieldExclamationIcon class="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p class="text-sm text-amber-800">
          {{ t('twoFactor.enforcementBanner') }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="goToSetup"
          class="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
        >
          {{ t('twoFactor.setupNow') }}
        </button>
        <button @click="dismiss" class="text-amber-400 hover:text-amber-500">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
