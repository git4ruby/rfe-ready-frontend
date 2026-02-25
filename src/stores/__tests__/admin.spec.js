import { setActivePinia, createPinia } from 'pinia'
import { useAdminStore } from '../admin'

vi.mock('../../api/admin')
import adminApi from '../../api/admin'

describe('admin store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAdminStore()
  })

  describe('fetchDashboard()', () => {
    it('fetches dashboard data and sets state', async () => {
      const mockDashboard = { total_tenants: 10, total_users: 50, active_cases: 200 }
      adminApi.getDashboard.mockResolvedValueOnce({ data: { data: mockDashboard } })

      await store.fetchDashboard()

      expect(adminApi.getDashboard).toHaveBeenCalled()
      expect(store.dashboard).toEqual(mockDashboard)
    })

    it('sets dashboardLoading true during fetch and false after', async () => {
      let resolvePromise
      adminApi.getDashboard.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchDashboard()
      expect(store.dashboardLoading).toBe(true)

      resolvePromise({ data: { data: {} } })
      await fetchPromise
      expect(store.dashboardLoading).toBe(false)
    })

    it('sets dashboardLoading false even on error', async () => {
      adminApi.getDashboard.mockRejectedValueOnce(new Error('fail'))
      await store.fetchDashboard().catch(() => {})
      expect(store.dashboardLoading).toBe(false)
    })
  })

  describe('fetchTenants()', () => {
    it('fetches tenants and sets state', async () => {
      const mockTenants = [
        { id: '1', name: 'Tenant A' },
        { id: '2', name: 'Tenant B' },
      ]
      const mockMeta = { current_page: 1, total_pages: 2 }
      adminApi.getTenants.mockResolvedValueOnce({ data: { data: mockTenants, meta: mockMeta } })

      await store.fetchTenants({ page: 1 })

      expect(adminApi.getTenants).toHaveBeenCalledWith({ page: 1 })
      expect(store.tenants).toEqual(mockTenants)
      expect(store.tenantsPagination).toEqual(mockMeta)
    })

    it('defaults to empty params', async () => {
      adminApi.getTenants.mockResolvedValueOnce({ data: { data: [], meta: {} } })

      await store.fetchTenants()

      expect(adminApi.getTenants).toHaveBeenCalledWith({})
    })

    it('sets tenantsLoading true during fetch and false after', async () => {
      let resolvePromise
      adminApi.getTenants.mockReturnValueOnce(new Promise((resolve) => (resolvePromise = resolve)))

      const fetchPromise = store.fetchTenants()
      expect(store.tenantsLoading).toBe(true)

      resolvePromise({ data: { data: [], meta: {} } })
      await fetchPromise
      expect(store.tenantsLoading).toBe(false)
    })

    it('sets tenantsLoading false even on error', async () => {
      adminApi.getTenants.mockRejectedValueOnce(new Error('fail'))
      await store.fetchTenants().catch(() => {})
      expect(store.tenantsLoading).toBe(false)
    })
  })

  describe('fetchTenant()', () => {
    it('fetches a single tenant and sets currentTenant', async () => {
      const mockTenant = { id: '1', name: 'Tenant A', plan: 'professional' }
      adminApi.getTenant.mockResolvedValueOnce({ data: { data: mockTenant } })

      const result = await store.fetchTenant('1')

      expect(adminApi.getTenant).toHaveBeenCalledWith('1')
      expect(store.currentTenant).toEqual(mockTenant)
      expect(result).toEqual(mockTenant)
    })
  })

  describe('createTenant()', () => {
    it('creates a tenant and returns the data', async () => {
      const newTenant = { id: '3', name: 'New Tenant' }
      adminApi.createTenant.mockResolvedValueOnce({ data: { data: newTenant } })

      const result = await store.createTenant({ name: 'New Tenant', plan: 'basic' })

      expect(adminApi.createTenant).toHaveBeenCalledWith({ name: 'New Tenant', plan: 'basic' })
      expect(result).toEqual(newTenant)
    })
  })

  describe('updateTenant()', () => {
    it('updates a tenant and sets currentTenant', async () => {
      const updated = { id: '1', name: 'Updated Tenant' }
      adminApi.updateTenant.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.updateTenant('1', { name: 'Updated Tenant' })

      expect(adminApi.updateTenant).toHaveBeenCalledWith('1', { name: 'Updated Tenant' })
      expect(store.currentTenant).toEqual(updated)
      expect(result).toEqual(updated)
    })
  })

  describe('deleteTenant()', () => {
    it('deletes a tenant and removes from list', async () => {
      store.tenants = [
        { id: '1', name: 'Tenant A' },
        { id: '2', name: 'Tenant B' },
      ]
      adminApi.deleteTenant.mockResolvedValueOnce({})

      await store.deleteTenant('1')

      expect(adminApi.deleteTenant).toHaveBeenCalledWith('1')
      expect(store.tenants).toHaveLength(1)
      expect(store.tenants[0].id).toBe('2')
    })
  })

  describe('changeTenantStatus()', () => {
    it('changes status and updates tenant in list', async () => {
      store.tenants = [
        { id: '1', name: 'Tenant A', status: 'active' },
        { id: '2', name: 'Tenant B', status: 'active' },
      ]
      const updated = { id: '1', name: 'Tenant A', status: 'suspended' }
      adminApi.changeTenantStatus.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.changeTenantStatus('1', 'suspended')

      expect(adminApi.changeTenantStatus).toHaveBeenCalledWith('1', 'suspended')
      expect(store.tenants[0]).toEqual(updated)
      expect(result).toEqual(updated)
    })

    it('updates currentTenant if it matches', async () => {
      store.currentTenant = { id: '1', name: 'Tenant A', status: 'active' }
      store.tenants = [{ id: '1', name: 'Tenant A', status: 'active' }]
      const updated = { id: '1', name: 'Tenant A', status: 'suspended' }
      adminApi.changeTenantStatus.mockResolvedValueOnce({ data: { data: updated } })

      await store.changeTenantStatus('1', 'suspended')

      expect(store.currentTenant).toEqual(updated)
    })

    it('does not update currentTenant if id does not match', async () => {
      store.currentTenant = { id: '2', name: 'Tenant B', status: 'active' }
      store.tenants = [{ id: '1', name: 'Tenant A', status: 'active' }]
      const updated = { id: '1', name: 'Tenant A', status: 'suspended' }
      adminApi.changeTenantStatus.mockResolvedValueOnce({ data: { data: updated } })

      await store.changeTenantStatus('1', 'suspended')

      expect(store.currentTenant.id).toBe('2')
      expect(store.currentTenant.status).toBe('active')
    })
  })

  describe('changeTenantPlan()', () => {
    it('changes plan and updates tenant in list', async () => {
      store.tenants = [{ id: '1', name: 'Tenant A', plan: 'basic' }]
      const updated = { id: '1', name: 'Tenant A', plan: 'professional' }
      adminApi.changeTenantPlan.mockResolvedValueOnce({ data: { data: updated } })

      const result = await store.changeTenantPlan('1', 'professional')

      expect(adminApi.changeTenantPlan).toHaveBeenCalledWith('1', 'professional')
      expect(store.tenants[0]).toEqual(updated)
      expect(result).toEqual(updated)
    })

    it('updates currentTenant if it matches', async () => {
      store.currentTenant = { id: '1', name: 'Tenant A', plan: 'basic' }
      store.tenants = [{ id: '1', name: 'Tenant A', plan: 'basic' }]
      const updated = { id: '1', name: 'Tenant A', plan: 'enterprise' }
      adminApi.changeTenantPlan.mockResolvedValueOnce({ data: { data: updated } })

      await store.changeTenantPlan('1', 'enterprise')

      expect(store.currentTenant).toEqual(updated)
    })
  })

  describe('fetchTenantUsers()', () => {
    it('fetches tenant users and sets state', async () => {
      const mockUsers = [{ id: '10', first_name: 'Alice' }]
      const mockMeta = { current_page: 1, total_pages: 1 }
      adminApi.getTenantUsers.mockResolvedValueOnce({ data: { data: mockUsers, meta: mockMeta } })

      await store.fetchTenantUsers('1', { page: 1 })

      expect(adminApi.getTenantUsers).toHaveBeenCalledWith('1', { page: 1 })
      expect(store.tenantUsers).toEqual(mockUsers)
      expect(store.tenantUsersPagination).toEqual(mockMeta)
    })

    it('sets tenantUsersLoading true during fetch and false after', async () => {
      let resolvePromise
      adminApi.getTenantUsers.mockReturnValueOnce(
        new Promise((resolve) => (resolvePromise = resolve))
      )

      const fetchPromise = store.fetchTenantUsers('1')
      expect(store.tenantUsersLoading).toBe(true)

      resolvePromise({ data: { data: [], meta: {} } })
      await fetchPromise
      expect(store.tenantUsersLoading).toBe(false)
    })

    it('sets tenantUsersLoading false even on error', async () => {
      adminApi.getTenantUsers.mockRejectedValueOnce(new Error('fail'))
      await store.fetchTenantUsers('1').catch(() => {})
      expect(store.tenantUsersLoading).toBe(false)
    })
  })

  describe('createTenantUser()', () => {
    it('creates a user for a tenant and returns the data', async () => {
      const newUser = { id: '20', first_name: 'Bob', role: 'attorney' }
      adminApi.createTenantUser.mockResolvedValueOnce({ data: { data: newUser } })

      const result = await store.createTenantUser('1', {
        first_name: 'Bob',
        role: 'attorney',
        email: 'bob@example.com',
      })

      expect(adminApi.createTenantUser).toHaveBeenCalledWith('1', {
        first_name: 'Bob',
        role: 'attorney',
        email: 'bob@example.com',
      })
      expect(result).toEqual(newUser)
    })
  })
})
