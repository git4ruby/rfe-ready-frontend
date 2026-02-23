import { createI18n } from 'vue-i18n'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { vi } from 'vitest'
import en from '../i18n/locales/en.json'

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en },
    missingWarn: false,
    fallbackWarn: false,
  })
}

export function createTestRouter(routes = []) {
  const defaultRoutes = [
    { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/platform', name: 'AdminDashboard', component: { template: '<div>Admin</div>' } },
    { path: '/cases', name: 'Cases', component: { template: '<div>Cases</div>' } },
    { path: '/cases/new', name: 'NewCase', component: { template: '<div>NewCase</div>' } },
    { path: '/cases/:id', name: 'CaseDetail', component: { template: '<div>CaseDetail</div>' }, props: true },
    { path: '/forbidden', name: 'Forbidden', component: { template: '<div>Forbidden</div>' } },
    { path: '/forgot-password', name: 'ForgotPassword', component: { template: '<div>ForgotPassword</div>' } },
    { path: '/profile', name: 'Profile', component: { template: '<div>Profile</div>' } },
    ...routes,
  ]

  return createRouter({
    history: createMemoryHistory(),
    routes: defaultRoutes,
  })
}

export function createMountOptions({ piniaOptions = {}, routerRoutes = [] } = {}) {
  const i18n = createTestI18n()
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    ...piniaOptions,
  })
  const router = createTestRouter(routerRoutes)

  return {
    plugins: [pinia, router, i18n],
    router,
    pinia,
    i18n,
  }
}
