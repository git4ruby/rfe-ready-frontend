import { defineStore } from 'pinia'
import { ref } from 'vue'
import adminApi from '../api/admin'

export const useAdminStore = defineStore('admin', () => {
  const dashboard = ref(null)
  const dashboardLoading = ref(false)

  async function fetchDashboard() {
    dashboardLoading.value = true
    try {
      const response = await adminApi.getDashboard()
      dashboard.value = response.data.data
    } finally {
      dashboardLoading.value = false
    }
  }

  const tenants = ref([])
  const tenantsLoading = ref(false)
  const tenantsPagination = ref({})
  const currentTenant = ref(null)

  async function fetchTenants(params = {}) {
    tenantsLoading.value = true
    try {
      const response = await adminApi.getTenants(params)
      tenants.value = response.data.data
      tenantsPagination.value = response.data.meta
    } finally {
      tenantsLoading.value = false
    }
  }

  async function fetchTenant(id) {
    const response = await adminApi.getTenant(id)
    currentTenant.value = response.data.data
    return response.data.data
  }

  async function createTenant(data) {
    const response = await adminApi.createTenant(data)
    return response.data.data
  }

  async function updateTenant(id, data) {
    const response = await adminApi.updateTenant(id, data)
    currentTenant.value = response.data.data
    return response.data.data
  }

  async function deleteTenant(id) {
    await adminApi.deleteTenant(id)
    tenants.value = tenants.value.filter((t) => t.id !== id)
  }

  async function changeTenantStatus(id, status) {
    const response = await adminApi.changeTenantStatus(id, status)
    const idx = tenants.value.findIndex((t) => t.id === id)
    if (idx !== -1) tenants.value[idx] = response.data.data
    if (currentTenant.value?.id === id) currentTenant.value = response.data.data
    return response.data.data
  }

  async function changeTenantPlan(id, plan) {
    const response = await adminApi.changeTenantPlan(id, plan)
    const idx = tenants.value.findIndex((t) => t.id === id)
    if (idx !== -1) tenants.value[idx] = response.data.data
    if (currentTenant.value?.id === id) currentTenant.value = response.data.data
    return response.data.data
  }

  const tenantUsers = ref([])
  const tenantUsersLoading = ref(false)
  const tenantUsersPagination = ref({})

  async function fetchTenantUsers(tenantId, params = {}) {
    tenantUsersLoading.value = true
    try {
      const response = await adminApi.getTenantUsers(tenantId, params)
      tenantUsers.value = response.data.data
      tenantUsersPagination.value = response.data.meta
    } finally {
      tenantUsersLoading.value = false
    }
  }

  async function createTenantUser(tenantId, data) {
    const response = await adminApi.createTenantUser(tenantId, data)
    return response.data.data
  }

  return {
    dashboard,
    dashboardLoading,
    fetchDashboard,
    tenants,
    tenantsLoading,
    tenantsPagination,
    currentTenant,
    fetchTenants,
    fetchTenant,
    createTenant,
    updateTenant,
    deleteTenant,
    changeTenantStatus,
    changeTenantPlan,
    tenantUsers,
    tenantUsersLoading,
    tenantUsersPagination,
    fetchTenantUsers,
    createTenantUser,
  }
})
