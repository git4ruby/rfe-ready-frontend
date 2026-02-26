import apiClient from './client'

const adminApi = {
  getDashboard() {
    return apiClient.get('/admin/dashboard')
  },

  getTenants(params = {}) {
    return apiClient.get('/admin/tenants', { params })
  },

  getTenant(id) {
    return apiClient.get(`/admin/tenants/${id}`)
  },

  createTenant(data) {
    return apiClient.post('/admin/tenants', { tenant: data })
  },

  updateTenant(id, data) {
    return apiClient.patch(`/admin/tenants/${id}`, { tenant: data })
  },

  deleteTenant(id) {
    return apiClient.delete(`/admin/tenants/${id}`)
  },

  changeTenantStatus(id, status) {
    return apiClient.patch(`/admin/tenants/${id}/change_status`, { status })
  },

  changeTenantPlan(id, plan) {
    return apiClient.patch(`/admin/tenants/${id}/change_plan`, { plan })
  },

  getTenantUsers(tenantId, params = {}) {
    return apiClient.get(`/admin/tenants/${tenantId}/users`, { params })
  },

  createTenantUser(tenantId, data) {
    return apiClient.post(`/admin/tenants/${tenantId}/users`, { user: data })
  },

  updateTenantUser(tenantId, userId, data) {
    return apiClient.patch(`/admin/tenants/${tenantId}/users/${userId}`, { user: data })
  },

  deactivateTenantUser(tenantId, userId) {
    return apiClient.delete(`/admin/tenants/${tenantId}/users/${userId}`)
  },
}

export default adminApi
