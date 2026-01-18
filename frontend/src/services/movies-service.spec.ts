import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { MoviesService } from './movies-service.js'
import { MediaApiClient } from './api-clients/media-api-client.js'
import type { Movie } from 'common'

const createMockMovie = (imdbId = 'tt1234567', title = 'Test Movie'): Movie => ({
  imdbId,
  title,
  year: 2024,
  type: 'movie',
  genre: ['Action'],
  plot: 'Test plot',
  thumbnailImageUrl: 'https://example.com/poster.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

describe('MoviesService', () => {
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

  describe('getMovie', () => {
    it('should fetch a movie by id', async () => {
      const mockMovie = createMockMovie()
      const mockCall = vi.fn().mockResolvedValue({ result: mockMovie })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        const result = await service.getMovie('tt1234567')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/movies/:id',
          url: { id: 'tt1234567' },
          query: {},
        })
        expect(result).toEqual(mockMovie)
      })
    })

    it('should cache movie results', async () => {
      const mockMovie = createMockMovie()
      const mockCall = vi.fn().mockResolvedValue({ result: mockMovie })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        await service.getMovie('tt1234567')
        await service.getMovie('tt1234567')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getMovieAsObservable', () => {
    it('should return an observable for movie', async () => {
      const mockMovie = createMockMovie()
      const mockCall = vi.fn().mockResolvedValue({ result: mockMovie })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        const observable = service.getMovieAsObservable('tt1234567')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })

    it('should share the same observable for the same movie id', async () => {
      const mockMovie = createMockMovie()
      const mockCall = vi.fn().mockResolvedValue({ result: mockMovie })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        const observable1 = service.getMovieAsObservable('tt1234567')
        const observable2 = service.getMovieAsObservable('tt1234567')

        expect(observable1).toBe(observable2)
      })
    })
  })

  describe('findMovie', () => {
    it('should find movies with query options', async () => {
      const mockMovies = {
        count: 2,
        entries: [createMockMovie('tt1234567', 'Movie 1'), createMockMovie('tt7654321', 'Movie 2')],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockMovies })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        const findOptions = { top: 10 }
        const result = await service.findMovie(findOptions)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/movies',
          query: {
            findOptions,
          },
        })
        expect(result).toEqual(mockMovies)
      })
    })

    it('should cache query results', async () => {
      const mockMovies = {
        count: 1,
        entries: [createMockMovie()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockMovies })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        const findOptions = { top: 10 }
        await service.findMovie(findOptions)
        await service.findMovie(findOptions)

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })

    it('should pre-populate individual movie cache from query results', async () => {
      const movie1 = createMockMovie('tt1234567', 'Movie 1')
      const movie2 = createMockMovie('tt7654321', 'Movie 2')
      const mockMovies = {
        count: 2,
        entries: [movie1, movie2],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockMovies })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        // First call should populate both query cache and individual movie cache
        await service.findMovie({ top: 10 })

        // Second call to get individual movie should not trigger API call (cache hit)
        const result = await service.getMovie('tt1234567')

        // Only one API call should have been made (the findMovie call)
        expect(mockCall).toHaveBeenCalledTimes(1)
        expect(result).toEqual(movie1)
      })
    })
  })

  describe('createMovie', () => {
    it('should create a new movie', async () => {
      const newMovie = createMockMovie()
      const mockCall = vi.fn().mockResolvedValue({ result: newMovie })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        const body = {
          imdbId: 'tt1234567',
          title: 'Test Movie',
          year: 2024,
          type: 'movie' as const,
          genre: ['Action'],
          plot: 'Test plot',
          thumbnailImageUrl: 'https://example.com/poster.jpg',
        }
        const result = await service.createMovie(body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/movies',
          body,
        })
        expect(result).toEqual(newMovie)
      })
    })
  })

  describe('updateMovie', () => {
    it('should update an existing movie', async () => {
      const existingMovie = createMockMovie('tt1234567', 'Original Movie')
      const updatedMovie = createMockMovie('tt1234567', 'Updated Movie')
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: existingMovie })
        .mockResolvedValueOnce({ result: updatedMovie })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        // First load the movie to populate the cache
        await service.getMovie('tt1234567')

        const body = {
          title: 'Updated Movie',
          year: 2024,
          type: 'movie' as const,
          genre: ['Drama'],
          plot: 'Updated plot',
          thumbnailImageUrl: 'https://example.com/updated-poster.jpg',
        }
        const result = await service.updateMovie('tt1234567', body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'PATCH',
          action: '/movies/:id',
          url: { id: 'tt1234567' },
          body,
        })
        expect(result).toEqual(updatedMovie)
      })
    })
  })

  describe('deleteMovie', () => {
    it('should delete a movie', async () => {
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(MoviesService)

        await service.deleteMovie('tt1234567')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'DELETE',
          action: '/movies/:id',
          url: { id: 'tt1234567' },
        })
      })
    })
  })
})
