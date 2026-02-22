import { computed } from 'vue'
import { useFeaturesStore } from '../stores/features'

export function useFeatureFlag(name) {
  const store = useFeaturesStore()
  return computed(() => store.isEnabled(name))
}
