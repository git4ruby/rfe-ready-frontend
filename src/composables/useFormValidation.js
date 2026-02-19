import { ref, computed } from 'vue'

/**
 * Simple form validation composable
 *
 * Usage:
 *   const { errors, validate, validateField, clearError, isValid } = useFormValidation(rules)
 *   rules = { fieldName: [(value) => errorMessage | null] }
 */
export function useFormValidation(rules) {
  const errors = ref({})
  const touched = ref({})

  function validateField(field, value) {
    touched.value[field] = true
    const fieldRules = rules[field]
    if (!fieldRules) return true

    for (const rule of fieldRules) {
      const error = rule(value)
      if (error) {
        errors.value[field] = error
        return false
      }
    }
    delete errors.value[field]
    errors.value = { ...errors.value } // trigger reactivity
    return true
  }

  function validate(formData) {
    let valid = true
    for (const field of Object.keys(rules)) {
      touched.value[field] = true
      if (!validateField(field, formData[field])) {
        valid = false
      }
    }
    return valid
  }

  function clearError(field) {
    delete errors.value[field]
    errors.value = { ...errors.value }
  }

  function clearAll() {
    errors.value = {}
    touched.value = {}
  }

  const isValid = computed(() => Object.keys(errors.value).length === 0)

  return { errors, touched, validate, validateField, clearError, clearAll, isValid }
}

// Common validation rules
export const required = (label) => (value) =>
  !value || (typeof value === 'string' && !value.trim()) ? `${label} is required` : null

export const email = () => (value) =>
  value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email address' : null

export const minLength = (label, min) => (value) =>
  value && value.length < min ? `${label} must be at least ${min} characters` : null

export const matches = (label, getOtherValue) => (value) =>
  value !== getOtherValue() ? `${label} does not match` : null

export function passwordStrength(value) {
  if (!value) return { score: 0, label: '', color: '' }
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++

  const levels = [
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-lime-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ]

  const level = levels[Math.min(score, levels.length) - 1] || levels[0]
  return { score, ...level }
}
