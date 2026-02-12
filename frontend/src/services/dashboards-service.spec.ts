import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { DashboardService } from './dashboards-service.js'
import { DashboardsApiClient } from './api-clients/dashboards-api-client.js'
import type { Dashboard } from 'common'

const createMockDashboard = (id = 'dashboard-1', name = 'Test Dashboard'): Dashboard => ({
  id,
  name,
  owner: 'test-user',
  description: 'Test description',
  widgets: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

describe('DashboardService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.setExplicitInstance(
      {
        call: mockCall,
      } as unknown as DashboardsApiClient,
      DashboardsApiClient,
    )
    return injector
  }

  describe('getDashboard', () => {
    it('should fetch a dashboard by id', async () => {
      const mockDashboard = createMockDashboard()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDashboard })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        const result = await service.getDashboard('dashboard-1')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/dashboards/:id',
          url: { id: 'dashboard-1' },
          query: {},
        })
        expect(result).toEqual(mockDashboard)
      })
    })

    it('should cache dashboard results', async () => {
      const mockDashboard = createMockDashboard()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDashboard })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        await service.getDashboard('dashboard-1')
        await service.getDashboard('dashboard-1')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getDashboardAsObservable', () => {
    it('should return an observable for dashboard', async () => {
      const mockDashboard = createMockDashboard()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDashboard })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        const observable = service.getDashboardAsObservable('dashboard-1')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })

    it('should share the same observable for the same dashboard id', async () => {
      const mockDashboard = createMockDashboard()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDashboard })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        const observable1 = service.getDashboardAsObservable('dashboard-1')
        const observable2 = service.getDashboardAsObservable('dashboard-1')

        expect(observable1).toBe(observable2)
      })
    })
  })

  describe('findDashboard', () => {
    it('should find dashboards with query options', async () => {
      const mockDashboards = {
        count: 2,
        entries: [createMockDashboard('dashboard-1', 'Dashboard 1'), createMockDashboard('dashboard-2', 'Dashboard 2')],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockDashboards })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        const findOptions = { top: 10 }
        const result = await service.findDashboard(findOptions)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/dashboards',
          query: {
            findOptions,
          },
        })
        expect(result).toEqual(mockDashboards)
      })
    })

    it('should cache query results', async () => {
      const mockDashboards = {
        count: 1,
        entries: [createMockDashboard()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockDashboards })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        const findOptions = { top: 10 }
        await service.findDashboard(findOptions)
        await service.findDashboard(findOptions)

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('createDashboard', () => {
    it('should create a new dashboard', async () => {
      const newDashboard = createMockDashboard()
      const mockCall = vi.fn().mockResolvedValue({ result: newDashboard })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        const body = {
          name: 'Test Dashboard',
          owner: 'test-user',
          description: 'Test description',
          widgets: [],
        }
        const result = await service.createDashboard(body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/dashboards',
          body,
        })
        expect(result).toEqual(newDashboard)
      })
    })
  })

  describe('updateDashboard', () => {
    it('should update an existing dashboard', async () => {
      const existingDashboard = createMockDashboard('dashboard-1', 'Original Dashboard')
      const updatedDashboard = createMockDashboard('dashboard-1', 'Updated Dashboard')
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: existingDashboard })
        .mockResolvedValueOnce({ result: updatedDashboard })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        // First load the dashboard to populate the cache
        await service.getDashboard('dashboard-1')

        const body = {
          name: 'Updated Dashboard',
          owner: 'test-user',
          description: 'Updated description',
          widgets: [],
        }
        const result = await service.updateDashboard('dashboard-1', body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'PATCH',
          action: '/dashboards/:id',
          url: { id: 'dashboard-1' },
          body,
        })
        expect(result).toEqual(updatedDashboard)
      })
    })
  })

  describe('deleteDashboard', () => {
    it('should delete a dashboard', async () => {
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DashboardService)

        await service.deleteDashboard('dashboard-1')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'DELETE',
          action: '/dashboards/:id',
          url: { id: 'dashboard-1' },
        })
      })
    })
  })
})
