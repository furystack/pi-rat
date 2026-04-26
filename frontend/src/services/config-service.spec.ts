import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { ConfigService } from './config-service.js'
import { ConfigApiClient } from './api-clients/config-api-client.js'
import type { OmdbConfig, MoviesConfig } from 'common'

const createMockOmdbConfig = () => ({
  id: 'OMDB_CONFIG' as const,
  value: {
    apiKey: 'test-api-key',
    trySearchMovieFromTitle: true,
    autoDownloadMetadata: false,
  } satisfies OmdbConfig['value'],
  createdAt: new Date(),
  updatedAt: new Date(),
})

const createMockMoviesConfig = () => ({
  id: 'MOVIES_CONFIG' as const,
  value: {
    autoExtractSubtitles: true,
    fullSyncOnStartup: false,
    preset: 'medium' as const,
    threads: 4,
    watchFiles: 'all' as const,
  } satisfies MoviesConfig['value'],
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('ConfigService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.bind(
      ConfigApiClient,
      () =>
        ({
          call: mockCall,
        }) as never,
    )
    return injector
  }

  describe('getConfig', () => {
    it('should fetch a config by id', async () => {
      const mockConfig = createMockOmdbConfig()
      const mockCall = vi.fn().mockResolvedValue({ result: mockConfig })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        const result = await service.getConfig('OMDB_CONFIG')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/config/:id',
          url: { id: 'OMDB_CONFIG' },
          query: {},
        })
        expect(result).toEqual(mockConfig)
      })
    })

    it('should cache config results', async () => {
      const mockConfig = createMockOmdbConfig()
      const mockCall = vi.fn().mockResolvedValue({ result: mockConfig })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        await service.getConfig('OMDB_CONFIG')
        await service.getConfig('OMDB_CONFIG')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getConfigAsObservable', () => {
    it('should return an observable for config', async () => {
      const mockConfig = createMockOmdbConfig()
      const mockCall = vi.fn().mockResolvedValue({ result: mockConfig })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        const observable = service.getConfigAsObservable('OMDB_CONFIG')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })

    it('should share the same observable for the same config id', async () => {
      const mockConfig = createMockOmdbConfig()
      const mockCall = vi.fn().mockResolvedValue({ result: mockConfig })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        const observable1 = service.getConfigAsObservable('OMDB_CONFIG')
        const observable2 = service.getConfigAsObservable('OMDB_CONFIG')

        expect(observable1).toBe(observable2)
      })
    })
  })

  describe('saveConfig', () => {
    it('should create a new config when it does not exist', async () => {
      const newConfig = createMockOmdbConfig()
      const mockCall = vi
        .fn()
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({ result: newConfig })
        .mockResolvedValueOnce({ result: newConfig })

      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        const result = await service.saveConfig('OMDB_CONFIG', newConfig.value)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/config',
          body: { id: 'OMDB_CONFIG', value: newConfig.value },
        })
        expect(result).toEqual(newConfig)
      })
    })

    it('should update an existing config', async () => {
      const existingConfig = createMockOmdbConfig()
      const updatedValue: OmdbConfig['value'] = {
        apiKey: 'new-api-key',
        trySearchMovieFromTitle: false,
        autoDownloadMetadata: true,
      }
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: existingConfig })
        .mockResolvedValueOnce({ result: { ...existingConfig, value: updatedValue } })
        .mockResolvedValueOnce({ result: { ...existingConfig, value: updatedValue } })

      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        await service.saveConfig('OMDB_CONFIG', updatedValue)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'PATCH',
          action: '/config/:id',
          url: { id: 'OMDB_CONFIG' },
          body: { value: updatedValue },
        })
      })
    })
  })

  describe('deleteConfig', () => {
    it('should delete a config', async () => {
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        await service.deleteConfig('OMDB_CONFIG')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'DELETE',
          action: '/config/:id',
          url: { id: 'OMDB_CONFIG' },
        })
      })
    })
  })

  describe('invalidateCache', () => {
    it('should invalidate a specific config cache', async () => {
      const mockConfig = createMockOmdbConfig()
      const mockCall = vi.fn().mockResolvedValue({ result: mockConfig })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        // First call populates the cache
        await service.getConfig('OMDB_CONFIG')
        expect(mockCall).toHaveBeenCalledTimes(1)

        // Invalidate the cache
        service.invalidateCache('OMDB_CONFIG')

        // Second call should fetch again
        await service.getConfig('OMDB_CONFIG')
        expect(mockCall).toHaveBeenCalledTimes(2)
      })
    })

    it('should invalidate all caches when no id provided', async () => {
      const omdbConfig = createMockOmdbConfig()
      const moviesConfig = createMockMoviesConfig()
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: omdbConfig })
        .mockResolvedValueOnce({ result: moviesConfig })
        .mockResolvedValueOnce({ result: omdbConfig })
        .mockResolvedValueOnce({ result: moviesConfig })

      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.get(ConfigService)

        // First calls populate the cache
        await service.getConfig('OMDB_CONFIG')
        await service.getConfig('MOVIES_CONFIG')
        expect(mockCall).toHaveBeenCalledTimes(2)

        // Invalidate all caches
        service.invalidateCache()

        // Second calls should fetch again
        await service.getConfig('OMDB_CONFIG')
        await service.getConfig('MOVIES_CONFIG')
        expect(mockCall).toHaveBeenCalledTimes(4)
      })
    })
  })
})
