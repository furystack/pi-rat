import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { SeriesService } from './series-service.js'
import { MediaApiClient } from './api-clients/media-api-client.js'
import type { Series } from 'common'

const createMockSeries = (imdbId = 'tt9876543', title = 'Test Series'): Series => ({
  imdbId,
  title,
  year: '2024',
  plot: 'Test series plot',
  thumbnailImageUrl: 'https://example.com/series-poster.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

describe('SeriesService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.setExplicitInstance(
      {
        call: mockCall,
      } as unknown as MediaApiClient,
      MediaApiClient,
    )
    return injector
  }

  describe('getSeries', () => {
    it('should fetch a series by id', async () => {
      const mockSeries = createMockSeries()
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        const result = await service.getSeries('tt9876543')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/series/:id',
          url: { id: 'tt9876543' },
          query: {},
        })
        expect(result).toEqual(mockSeries)
      })
    })

    it('should cache series results', async () => {
      const mockSeries = createMockSeries()
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        await service.getSeries('tt9876543')
        await service.getSeries('tt9876543')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getSeriesAsObservable', () => {
    it('should return an observable for series', async () => {
      const mockSeries = createMockSeries()
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        const observable = service.getSeriesAsObservable('tt9876543')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })

    it('should share the same observable for the same series id', async () => {
      const mockSeries = createMockSeries()
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        const observable1 = service.getSeriesAsObservable('tt9876543')
        const observable2 = service.getSeriesAsObservable('tt9876543')

        expect(observable1).toBe(observable2)
      })
    })
  })

  describe('findSeries', () => {
    it('should find series with query options', async () => {
      const mockSeriesCollection = {
        count: 2,
        entries: [createMockSeries('tt9876543', 'Series 1'), createMockSeries('tt3456789', 'Series 2')],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeriesCollection })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        const findOptions = { top: 10 }
        const result = await service.findSeries(findOptions)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/series',
          query: {
            findOptions,
          },
        })
        expect(result).toEqual(mockSeriesCollection)
      })
    })

    it('should cache query results', async () => {
      const mockSeriesCollection = {
        count: 1,
        entries: [createMockSeries()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeriesCollection })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        const findOptions = { top: 10 }
        await service.findSeries(findOptions)
        await service.findSeries(findOptions)

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })

    it('should pre-populate individual series cache from query results', async () => {
      const series1 = createMockSeries('tt9876543', 'Series 1')
      const series2 = createMockSeries('tt3456789', 'Series 2')
      const mockSeriesCollection = {
        count: 2,
        entries: [series1, series2],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeriesCollection })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        // First call should populate both query cache and individual series cache
        await service.findSeries({ top: 10 })

        // Second call to get individual series should not trigger API call (cache hit)
        const result = await service.getSeries('tt9876543')

        // Only one API call should have been made (the findSeries call)
        expect(mockCall).toHaveBeenCalledTimes(1)
        expect(result).toEqual(series1)
      })
    })
  })

  describe('findSeriesAsObservable', () => {
    it('should return an observable for series query', async () => {
      const mockSeriesCollection = {
        count: 1,
        entries: [createMockSeries()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockSeriesCollection })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SeriesService)

        const findOptions = { top: 10 }
        const observable = service.findSeriesAsObservable(findOptions)

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })
  })
})
