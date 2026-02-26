<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCasesStore } from '../../stores/cases'
import { useI18n } from 'vue-i18n'
import CaseStatusBadge from '../CaseStatusBadge.vue'
import LoadingSpinner from '../LoadingSpinner.vue'

const props = defineProps({
  caseId: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const casesStore = useCasesStore()
const { t } = useI18n()

onMounted(() => {
  casesStore.fetchSimilarCases(props.caseId)
})

function similarityColor(score) {
  if (score >= 0.8) return 'bg-green-100 text-green-800'
  if (score >= 0.6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-700'
}

function navigateToCase(id) {
  router.push({ name: 'CaseDetail', params: { id } })
}
</script>

<template>
  <div class="mt-8">
    <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
      {{ t('similarCases.title') }}
    </h3>

    <div v-if="casesStore.similarLoading" class="flex justify-center py-6">
      <LoadingSpinner />
    </div>

    <div v-else-if="casesStore.similarCases.length === 0" class="text-center py-6">
      <p class="text-sm text-gray-500">{{ t('similarCases.noResults') }}</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in casesStore.similarCases"
        :key="item.id"
        @click="navigateToCase(item.id)"
        class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ item.case_number }}
            </p>
            <CaseStatusBadge :status="item.status" />
          </div>
          <p class="mt-1 text-sm text-gray-500 truncate">
            {{ item.petitioner_name }} &middot; {{ item.visa_type }}
          </p>
          <p v-if="item.matched_content" class="mt-1 text-xs text-gray-400 truncate">
            {{ item.matched_content }}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0">
          <span
            :class="similarityColor(item.similarity_score)"
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            {{ Math.round(item.similarity_score * 100) }}% {{ t('similarCases.match') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
