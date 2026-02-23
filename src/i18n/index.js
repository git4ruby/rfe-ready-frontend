import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'
import zh from './locales/zh.json'
import hi from './locales/hi.json'

const savedLocale = localStorage.getItem('rfe_locale') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, es, zh, hi },
})

export const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'hi', name: 'हिन्दी' },
]

export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('rfe_locale', locale)
  document.documentElement.setAttribute('lang', locale)
}

export default i18n
