import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import type { TmdbMovieDetailsResponse } from '../metadata-services/tmdb-api-types.js'
import { ensureTmdbMovieExists } from './ensure-tmdb-movie-exists.js'

const mockGet = vi.fn()
const mockAdd = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockGet(...args) as unknown,
    add: (...args: unknown[]) => mockAdd(...args) as unknown,
  }),
}))

const createTmdbMovie = (overrides: Partial<TmdbMovieDetailsResponse> = {}): TmdbMovieDetailsResponse =>
  ({
    id: 12345,
    imdb_id: 'tt1234567',
    title: 'Test Movie',
    original_title: 'Test Movie Original',
    overview: 'A test movie.',
    release_date: '2024-06-15',
    runtime: 120,
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    genres: [{ id: 28, name: 'Action' }],
    vote_average: 7.5,
    vote_count: 100,
    popularity: 50.0,
    original_language: 'en',
    spoken_languages: [{ iso_639_1: 'en', name: 'English' }],
    production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
    status: 'Released',
    tagline: 'A tagline',
    budget: 1000000,
    revenue: 5000000,
    ...overrides,
  }) as TmdbMovieDetailsResponse

describe('ensureTmdbMovieExists', () => {
  it('should return existing record when found', async () => {
    const existing = { id: 12345, title: 'Test Movie' }
    mockGet.mockResolvedValue(existing)

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureTmdbMovieExists(createTmdbMovie(), 'en', injector)

      expect(mockGet).toHaveBeenCalledWith(injector, 12345)
      expect(mockAdd).not.toHaveBeenCalled()
      expect(result).toBe(existing)
    })
  })

  it('should create new record when not found', async () => {
    const newRecord = { id: 12345, title: 'Test Movie' }
    mockGet.mockResolvedValue(null)
    mockAdd.mockResolvedValue({ created: [newRecord] })

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureTmdbMovieExists(createTmdbMovie(), 'en', injector)

      expect(mockGet).toHaveBeenCalledWith(injector, 12345)
      expect(mockAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          id: 12345,
          imdbId: 'tt1234567',
          title: 'Test Movie',
          originalTitle: 'Test Movie Original',
          language: 'en',
        }),
      )
      expect(result).toBe(newRecord)
    })
  })

  it('should handle null imdb_id', async () => {
    mockGet.mockResolvedValue(null)
    mockAdd.mockResolvedValue({ created: [{ id: 99999 }] })

    await usingAsync(new Injector(), async (injector) => {
      await ensureTmdbMovieExists(createTmdbMovie({ imdb_id: null }), 'en', injector)

      expect(mockAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          imdbId: undefined,
        }),
      )
    })
  })

  it('should use provided language', async () => {
    mockGet.mockResolvedValue(null)
    mockAdd.mockResolvedValue({ created: [{ id: 12345 }] })

    await usingAsync(new Injector(), async (injector) => {
      await ensureTmdbMovieExists(createTmdbMovie(), 'fr', injector)

      expect(mockAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          language: 'fr',
        }),
      )
    })
  })
})
