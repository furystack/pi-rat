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
    injector.bind(
      InstallApiClient,
      () =>
        ({
          call: mockCall,
        }) as never,
    )
    return injector
  }

  describe('getServiceStatus', () => {
    it('should fetch service status', async () => {
      const mockStatus = createMockServiceStatus()
      const mockCall = vi.fn().mockResolvedValue({ result: mockStatus })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(InstallService)

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
        const service = i.get(InstallService)

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
        const service = i.get(InstallService)

        const observable = service.getServiceStatusAsObservable()

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })

    it('should share the same observable for multiple calls', async () => {
      const mockStatus = createMockServiceStatus()
      const mockCall = vi.fn().mockResolvedValue({ result: mockStatus })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(InstallService)

        const observable1 = service.getServiceStatusAsObservable()
        const observable2 = service.getServiceStatusAsObservable()

        expect(observable1).toBe(observable2)
      })
    })
  })
})
