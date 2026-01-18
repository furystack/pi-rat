import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { InstallService } from './install-service.js'
import { InstallApiClient } from './api-clients/install-api-client.js'
import type { ServiceStatus } from 'common'

const createMockServiceStatus = (): ServiceStatus => 'installed'

describe('InstallService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.setExplicitInstance(
      {
        call: mockCall,
      } as unknown as InstallApiClient,
      InstallApiClient,
    )
    return injector
  }

  describe('getServiceStatus', () => {
    it('should fetch service status', async () => {
      const mockStatus = createMockServiceStatus()
      const mockCall = vi.fn().mockResolvedValue({ result: mockStatus })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(InstallService)

        const result = await service.getServiceStatus()

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/serviceStatus',
        })
        expect(result).toEqual(mockStatus)
      })
    })

    it('should cache service status results', async () => {
      const mockStatus = createMockServiceStatus()
      const mockCall = vi.fn().mockResolvedValue({ result: mockStatus })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(InstallService)

        await service.getServiceStatus()
        await service.getServiceStatus()

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getServiceStatusAsObservable', () => {
    it('should return an observable for service status', async () => {
      const mockStatus = createMockServiceStatus()
      const mockCall = vi.fn().mockResolvedValue({ result: mockStatus })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(InstallService)

        const observable = service.getServiceStatusAsObservable()

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })

    it('should share the same observable for multiple calls', async () => {
      const mockStatus = createMockServiceStatus()
      const mockCall = vi.fn().mockResolvedValue({ result: mockStatus })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(InstallService)

        const observable1 = service.getServiceStatusAsObservable()
        const observable2 = service.getServiceStatusAsObservable()

        expect(observable1).toBe(observable2)
      })
    })
  })
})
