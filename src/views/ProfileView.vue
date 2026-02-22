<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import { usePreferencesStore } from '../stores/preferences'
import profileApi from '../api/profile'
import { availableLocales, setLocale } from '../i18n'
import { useI18n } from 'vue-i18n'
import twoFactorApi from '../api/twoFactor'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import PasswordStrength from '../components/PasswordStrength.vue'

const authStore = useAuthStore()
const notify = useNotificationStore()
const prefStore = usePreferencesStore()
const { t, locale } = useI18n()
const currentLocale = ref(locale.value)

const loading = ref(true)
const profile = ref(null)

// Profile form
const profileForm = ref({ first_name: '', last_name: '', bar_number: '' })
const savingProfile = ref(false)

// Password form
const passwordForm = ref({ current_password: '', password: '', password_confirmation: '' })
const savingPassword = ref(false)
const passwordErrors = ref({})

// Preferences form
const prefsForm = ref({
  timezone: '',
  dashboard_layout: 'expanded',
  notify_case_assigned: true,
  notify_deadline_approaching: true,
  notify_draft_ready: true,
})

const timezones = Intl.supportedValuesOf('timeZone')

async function loadProfile() {
  loading.value = true
  try {
    const response = await profileApi.getProfile()
    profile.value = response.data.data
    profileForm.value = {
      first_name: profile.value.first_name || '',
      last_name: profile.value.last_name || '',
      bar_number: profile.value.bar_number || '',
    }
    init2FA()
    const p = profile.value.preferences || {}
    if (p.locale) currentLocale.value = p.locale
    prefsForm.value = {
      timezone: p.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      dashboard_layout: p.dashboard_layout || 'expanded',
      notify_case_assigned: p.notify_case_assigned !== false,
      notify_deadline_approaching: p.notify_deadline_approaching !== false,
      notify_draft_ready: p.notify_draft_ready !== false,
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)

async function handleSaveProfile() {
  savingProfile.value = true
  try {
    const response = await profileApi.updateProfile(profileForm.value)
    profile.value = response.data.data
    // Update local auth store
    authStore.updateUser({
      first_name: profile.value.first_name,
      last_name: profile.value.last_name,
      bar_number: profile.value.bar_number,
    })
    notify.success('Profile updated successfully.')
  } catch (err) {
    const msg = err.response?.data?.details?.join(', ') || err.response?.data?.error || 'Failed to update profile.'
    notify.error(msg)
  } finally {
    savingProfile.value = false
  }
}

async function handleChangePassword() {
  passwordErrors.value = {}

  if (!passwordForm.value.current_password) {
    passwordErrors.value.current_password = 'Required'
    return
  }
  if (!passwordForm.value.password || passwordForm.value.password.length < 6) {
    passwordErrors.value.password = 'Must be at least 6 characters'
    return
  }
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
    passwordErrors.value.password_confirmation = 'Passwords do not match'
    return
  }

  savingPassword.value = true
  try {
    await profileApi.changePassword(passwordForm.value)
    notify.success('Password changed successfully.')
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (err) {
    const msg = err.response?.data?.error || 'Failed to change password.'
    notify.error(msg)
  } finally {
    savingPassword.value = false
  }
}

async function handleSavePreferences() {
  try {
    await prefStore.updatePreferences({ ...prefsForm.value, locale: currentLocale.value })
    setLocale(currentLocale.value)
    notify.success('Preferences saved successfully.')
  } catch (err) {
    notify.error('Failed to save preferences.')
  }
}

// 2FA
const twoFAEnabled = ref(false)
const twoFASetupData = ref(null)
const twoFASetupCode = ref('')
const twoFABackupCodes = ref([])
const twoFAStep = ref('idle') // idle | setup | verify | backup | disable
const twoFADisablePassword = ref('')
const twoFADisableCode = ref('')
const setting2FA = ref(false)

function init2FA() {
  twoFAEnabled.value = profile.value?.otp_required_for_login || false
}

async function startSetup2FA() {
  setting2FA.value = true
  try {
    const response = await twoFactorApi.setup()
    twoFASetupData.value = response.data.data
    twoFAStep.value = 'setup'
  } catch {
    notify.error('Failed to start 2FA setup.')
  } finally {
    setting2FA.value = false
  }
}

async function verify2FA() {
  setting2FA.value = true
  try {
    const response = await twoFactorApi.verify(twoFASetupCode.value)
    twoFABackupCodes.value = response.data.data.backup_codes
    twoFAEnabled.value = true
    twoFAStep.value = 'backup'
    authStore.updateUser({ otp_required_for_login: true })
    notify.success('Two-factor authentication enabled!')
  } catch (err) {
    notify.error(err.response?.data?.error || 'Invalid code.')
  } finally {
    setting2FA.value = false
  }
}

async function disable2FA() {
  setting2FA.value = true
  try {
    await twoFactorApi.disable(twoFADisablePassword.value, twoFADisableCode.value)
    twoFAEnabled.value = false
    twoFAStep.value = 'idle'
    twoFADisablePassword.value = ''
    twoFADisableCode.value = ''
    authStore.updateUser({ otp_required_for_login: false })
    notify.success('Two-factor authentication disabled.')
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to disable 2FA.')
  } finally {
    setting2FA.value = false
  }
}

function close2FASetup() {
  twoFAStep.value = 'idle'
  twoFASetupData.value = null
  twoFASetupCode.value = ''
  twoFABackupCodes.value = []
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('profile.title') }}</h1>
      <p class="mt-1 text-sm text-gray-500">{{ t('profile.subtitle') }}</p>
    </div>

    <SkeletonLoader v-if="loading" variant="detail" />

    <template v-else-if="profile">
      <div class="space-y-6 max-w-2xl">
        <!-- Account Info (read-only) -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('profile.account') }}</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm text-gray-500">Email</dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">{{ profile.email }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Role</dt>
              <dd class="mt-1">
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-indigo-100 text-indigo-800">
                  {{ profile.role }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Personal Info -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('profile.personalInfo') }}</h2>
          <form @submit.prevent="handleSaveProfile" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">{{ t('profile.firstName') }}</label>
                <input
                  v-model="profileForm.first_name"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">{{ t('profile.lastName') }}</label>
                <input
                  v-model="profileForm.last_name"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div v-if="profile.role === 'attorney'">
              <label class="block text-sm font-medium text-gray-700">{{ t('profile.barNumber') }}</label>
              <input
                v-model="profileForm.bar_number"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div class="flex justify-end pt-2">
              <button
                type="submit"
                :disabled="savingProfile"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ savingProfile ? t('common.loading') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Change Password -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('profile.changePassword') }}</h2>
          <form @submit.prevent="handleChangePassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ t('profile.currentPassword') }}</label>
              <input
                v-model="passwordForm.current_password"
                type="password"
                autocomplete="current-password"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p v-if="passwordErrors.current_password" class="mt-1 text-sm text-red-600">{{ passwordErrors.current_password }}</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">{{ t('profile.newPassword') }}</label>
                <input
                  v-model="passwordForm.password"
                  type="password"
                  autocomplete="new-password"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <PasswordStrength :password="passwordForm.password" />
                <p v-if="passwordErrors.password" class="mt-1 text-sm text-red-600">{{ passwordErrors.password }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">{{ t('profile.confirmPassword') }}</label>
                <input
                  v-model="passwordForm.password_confirmation"
                  type="password"
                  autocomplete="new-password"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p v-if="passwordErrors.password_confirmation" class="mt-1 text-sm text-red-600">{{ passwordErrors.password_confirmation }}</p>
              </div>
            </div>
            <div class="flex justify-end pt-2">
              <button
                type="submit"
                :disabled="savingPassword"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ savingPassword ? t('common.loading') : t('profile.changePassword') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Preferences -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('profile.preferences') }}</h2>
          <form @submit.prevent="handleSavePreferences" class="space-y-5">
            <!-- Timezone -->
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ t('profile.timezone') }}</label>
              <select
                v-model="prefsForm.timezone"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz.replace(/_/g, ' ') }}</option>
              </select>
              <p class="mt-1 text-xs text-gray-400">Used for displaying dates and deadlines throughout the app.</p>
            </div>

            <!-- Dashboard Layout -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('profile.dashboardLayout') }}</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="prefsForm.dashboard_layout"
                    type="radio"
                    value="expanded"
                    class="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="text-sm text-gray-700">{{ t('profile.expanded') }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="prefsForm.dashboard_layout"
                    type="radio"
                    value="compact"
                    class="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="text-sm text-gray-700">{{ t('profile.compact') }}</span>
                </label>
              </div>
            </div>

            <!-- Language -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Language</label>
              <select
                v-model="currentLocale"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option v-for="loc in availableLocales" :key="loc.code" :value="loc.code">{{ loc.name }}</option>
              </select>
            </div>

            <!-- Email Notifications -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">{{ t('profile.emailNotifications') }}</label>
              <div class="space-y-3">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="prefsForm.notify_case_assigned"
                    type="checkbox"
                    class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span class="text-sm text-gray-900">Case Assigned</span>
                    <p class="text-xs text-gray-400">Get notified when a case is assigned to you.</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="prefsForm.notify_deadline_approaching"
                    type="checkbox"
                    class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span class="text-sm text-gray-900">Deadline Approaching</span>
                    <p class="text-xs text-gray-400">Get reminded when a case deadline is within 7 days.</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="prefsForm.notify_draft_ready"
                    type="checkbox"
                    class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span class="text-sm text-gray-900">Draft Ready</span>
                    <p class="text-xs text-gray-400">Get notified when an AI draft response is ready for review.</p>
                  </div>
                </label>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="submit"
                :disabled="prefStore.saving"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ prefStore.saving ? 'Saving...' : 'Save Preferences' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Security — Two-Factor Authentication -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{{ t('profile.security') }}</h2>

          <!-- 2FA Status -->
          <div v-if="twoFAStep === 'idle'" class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ t('profile.twoFactor') }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ twoFAEnabled ? 'Enabled — your account is protected with an authenticator app.' : 'Add an extra layer of security to your account.' }}
              </p>
            </div>
            <button
              v-if="!twoFAEnabled"
              @click="startSetup2FA"
              :disabled="setting2FA"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {{ setting2FA ? 'Loading...' : 'Enable 2FA' }}
            </button>
            <button
              v-else
              @click="twoFAStep = 'disable'"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
            >
              Disable 2FA
            </button>
          </div>

          <!-- Setup Step: QR Code -->
          <div v-if="twoFAStep === 'setup'" class="space-y-4">
            <p class="text-sm text-gray-600">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
            <div class="flex justify-center" v-html="twoFASetupData?.qr_svg"></div>
            <div class="text-center">
              <p class="text-xs text-gray-400">Or enter this key manually:</p>
              <code class="text-sm font-mono bg-gray-100 px-3 py-1 rounded mt-1 inline-block">{{ twoFASetupData?.secret }}</code>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Enter the 6-digit code from your app</label>
              <input
                v-model="twoFASetupCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-center text-lg tracking-widest sm:text-sm"
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button @click="close2FASetup" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                @click="verify2FA"
                :disabled="setting2FA || twoFASetupCode.length < 6"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {{ setting2FA ? 'Verifying...' : 'Verify & Enable' }}
              </button>
            </div>
          </div>

          <!-- Backup Codes -->
          <div v-if="twoFAStep === 'backup'" class="space-y-4">
            <div class="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p class="text-sm font-medium text-yellow-800">Save your backup codes</p>
              <p class="text-xs text-yellow-700 mt-1">Store these codes in a safe place. Each code can only be used once if you lose access to your authenticator app.</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <code
                v-for="code in twoFABackupCodes"
                :key="code"
                class="bg-gray-100 px-3 py-2 rounded text-sm font-mono text-center"
              >{{ code }}</code>
            </div>
            <div class="flex justify-end">
              <button @click="close2FASetup" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
                Done
              </button>
            </div>
          </div>

          <!-- Disable 2FA -->
          <div v-if="twoFAStep === 'disable'" class="space-y-4">
            <p class="text-sm text-gray-600">To disable two-factor authentication, enter your password and a verification code.</p>
            <div>
              <label class="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                v-model="twoFADisablePassword"
                type="password"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Verification Code</label>
              <input
                v-model="twoFADisableCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-center text-lg tracking-widest sm:text-sm"
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button @click="twoFAStep = 'idle'" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                @click="disable2FA"
                :disabled="setting2FA || !twoFADisablePassword || twoFADisableCode.length < 6"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {{ setting2FA ? 'Disabling...' : 'Disable 2FA' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
