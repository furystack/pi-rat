import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { MovieMetadataLocalized, SeriesMetadataLocalized } from 'common'
import { describe, expect, it, vi } from 'vitest'
import { MediaApiClient } from './api-clients/media-api-client.js'
import { LocalizedMetadataService } from './localized-metadata-service.js'

const createMockMovieLocalized = (imdbId = 'tt1234567'): MovieMetadataLocalized => ({
  id: 'localized-1',
  movieImdbId: imdbId,
  language: 'en',
  title: 'Test Movie',
  plot: 'A test movie plot.',
  posterUrl: 'https://example.com/poster.jpg',
  genre: ['Action'],
  source: 'omdb',
  sourceId: imdbId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const createMockSeriesLocalized = (imdbId = 'tt9876543'): SeriesMetadataLocalized => ({
  id: 'localized-2',
  seriesImdbId: imdbId,
  language: 'en',
  title: 'Test Series',
  plot: 'A test series plot.',
  posterUrl: 'https://example.com/series-poster.jpg',
  source: 'tmdb',
  sourceId: '67890',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

describe('LocalizedMetadataService', () => {
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

  describe('getMovieLocalized', () => {
    it('should fetch movie localized metadata by imdb id', async () => {
      const mockLocalized = createMockMovieLocalized()
      const mockCall = vi.fn().mockResolvedValue({
        result: { count: 1, entries: [mockLocalized] },
      })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LocalizedMetadataService)
        const result = await service.getMovieLocalized('tt1234567')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/movie-metadata-localized',
          query: {
            findOptions: {
              filter: {
                movieImdbId: { $eq: 'tt1234567' },
                language: { $eq: 'en' },
              },
              top: 1,
            },
          },
        })
        expect(result).toEqual(mockLocalized)
      })
    })

    it('should cache movie localized results', async () => {
      const mockLocalized = createMockMovieLocalized()
      const mockCall = vi.fn().mockResolvedValue({
        result: { count: 1, entries: [mockLocalized] },
      })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LocalizedMetadataService)

        await service.getMovieLocalized('tt1234567')
        await service.getMovieLocalized('tt1234567')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })

    it('should return undefined when no results', async () => {
      const mockCall = vi.fn().mockResolvedValue({
        result: { count: 0, entries: [] },
      })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LocalizedMetadataService)
        const result = await service.getMovieLocalized('tt0000000')

        expect(result).toBeUndefined()
      })
    })
  })

  describe('getSeriesLocalized', () => {
    it('should fetch series localized metadata by imdb id', async () => {
      const mockLocalized = createMockSeriesLocalized()
      const mockCall = vi.fn().mockResolvedValue({
        result: { count: 1, entries: [mockLocalized] },
      })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LocalizedMetadataService)
        const result = await service.getSeriesLocalized('tt9876543')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/series-metadata-localized',
          query: {
            findOptions: {
              filter: {
                seriesImdbId: { $eq: 'tt9876543' },
                language: { $eq: 'en' },
              },
              top: 1,
            },
          },
        })
        expect(result).toEqual(mockLocalized)
      })
    })

    it('should cache series localized results', async () => {
      const mockLocalized = createMockSeriesLocalized()
      const mockCall = vi.fn().mockResolvedValue({
        result: { count: 1, entries: [mockLocalized] },
      })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LocalizedMetadataService)

        await service.getSeriesLocalized('tt9876543')
        await service.getSeriesLocalized('tt9876543')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getMovieLocalizedAsObservable', () => {
    it('should return an observable', async () => {
      const mockCall = vi.fn().mockResolvedValue({
        result: { count: 1, entries: [createMockMovieLocalized()] },
      })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LocalizedMetadataService)
        const observable = service.getMovieLocalizedAsObservable('tt1234567')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })
  })

  describe('disposal', () => {
    it('should dispose both caches on dispose', async () => {
      const mockCall = vi.fn().mockResolvedValue({
        result: { count: 0, entries: [] },
      })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LocalizedMetadataService)
        const movieDisposeSpy = vi.spyOn(service.movieLocalizedCache, Symbol.dispose as never)
        const seriesDisposeSpy = vi.spyOn(service.seriesLocalizedCache, Symbol.dispose as never)

        service[Symbol.dispose]()

        expect(movieDisposeSpy).toHaveBeenCalled()
        expect(seriesDisposeSpy).toHaveBeenCalled()
      })
    })
  })
})
