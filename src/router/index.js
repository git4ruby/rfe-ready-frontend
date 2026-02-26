import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { guest: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { guest: true },
  },
  {
    path: '/sso/callback',
    name: 'SSOCallback',
    component: () => import('../views/SSOCallbackView.vue'),
    meta: { guest: true },
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('../views/ForbiddenView.vue'),
  },
  {
    path: '/platform',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/AdminDashboardView.vue'),
        meta: { title: 'Platform Dashboard' },
      },
      {
        path: 'tenants',
        name: 'AdminTenants',
        component: () => import('../views/admin/AdminTenantsView.vue'),
        meta: { title: 'Tenant Management' },
      },
      {
        path: 'tenants/:id',
        name: 'AdminTenantDetail',
        component: () => import('../views/admin/AdminTenantDetailView.vue'),
        meta: { title: 'Tenant Detail' },
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('../views/ProfileView.vue'),
        meta: { title: 'Profile' },
      },
    ],
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
      },
      {
        path: 'cases',
        name: 'Cases',
        component: () => import('../views/CasesListView.vue'),
      },
      {
        path: 'cases/new',
        name: 'NewCase',
        component: () => import('../views/CaseNewView.vue'),
      },
      {
        path: 'cases/:id',
        name: 'CaseDetail',
        component: () => import('../views/CaseDetailView.vue'),
        props: true,
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('../views/KnowledgeView.vue'),
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/ReportsView.vue'),
        meta: { requiresAuth: true, roles: ['admin', 'attorney'] },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/SettingsView.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/UsersView.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'audit-log',
        name: 'AuditLog',
        component: () => import('../views/AuditLogView.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'feature-flags',
        name: 'FeatureFlags',
        component: () => import('../views/FeatureFlagsView.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'backups',
        name: 'Backups',
        component: () => import('../views/BackupsView.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/ProfileView.vue'),
        meta: { title: 'Profile' },
      },
      {
        path: 'help',
        name: 'Help',
        component: () => import('../views/HelpView.vue'),
        meta: { title: 'Help Center' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next(authStore.isSuperAdmin ? '/platform' : '/')
  } else if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
    next('/')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else if (authStore.isAuthenticated && authStore.isSuperAdmin && !to.path.startsWith('/platform') && !to.meta.guest && to.path !== '/forbidden') {
    next('/platform')
  } else {
    next()
  }
})

export default router
