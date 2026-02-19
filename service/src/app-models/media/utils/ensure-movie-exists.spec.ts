import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import type { OmdbMovieMetadata } from 'common'
import { ensureMovieExists } from './ensure-movie-exists.js'

const mockMovieStoreGet = vi.fn()
const mockMovieStoreAdd = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockMovieStoreGet(...args) as unknown,
    add: (...args: unknown[]) => mockMovieStoreAdd(...args) as unknown,
  }),
}))

describe('ensureMovieExists', () => {
  const createOmdbMeta = (overrides: Partial<OmdbMovieMetadata> = {}): OmdbMovieMetadata => ({
    imdbID: 'tt1234567',
    Title: 'Test Movie',
    Year: '2024',
    Type: 'movie',
    Poster: 'https://example.com/poster.jpg',
    Plot: 'A test movie plot',
    Runtime: '120 min',
    Rated: 'PG-13',
    Released: '01 Jan 2024',
    Genre: 'Action',
    Director: 'Test Director',
    Writer: 'Test Writer',
    Actors: 'Actor 1, Actor 2',
    Language: 'English',
    Country: 'USA',
    Awards: 'None',
    Ratings: [],
    Metascore: '75',
    imdbRating: '7.5',
    imdbVotes: '10000',
    Response: 'True',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  })

  it('should return existing movie if found', async () => {
    const existingMovie = {
      imdbId: 'tt1234567',
      title: 'Test Movie',
      year: 2024,
    }
    mockMovieStoreGet.mockResolvedValue(existingMovie)

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureMovieExists(createOmdbMeta(), injector)

      expect(mockMovieStoreGet).toHaveBeenCalledWith(injector, 'tt1234567')
      expect(mockMovieStoreAdd).not.toHaveBeenCalled()
      expect(result).toBe(existingMovie)
    })
  })

  it('should create new movie if not found', async () => {
    const newMovie = {
      imdbId: 'tt1234567',
      title: 'Test Movie',
      year: 2024,
    }
    mockMovieStoreGet.mockResolvedValue(null)
    mockMovieStoreAdd.mockResolvedValue({ created: [newMovie] })

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureMovieExists(createOmdbMeta(), injector)

      expect(mockMovieStoreGet).toHaveBeenCalledWith(injector, 'tt1234567')
      expect(mockMovieStoreAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          imdbId: 'tt1234567',
          title: 'Test Movie',
          year: 2024,
          type: 'movie',
        }),
      )
      expect(result).toBe(newMovie)
    })
  })

  it('should handle series episodes with season and episode', async () => {
    const newMovie = {
      imdbId: 'tt9999999',
      title: 'Episode Title',
      year: 2024,
      season: 1,
      episode: 5,
    }
    mockMovieStoreGet.mockResolvedValue(null)
    mockMovieStoreAdd.mockResolvedValue({ created: [newMovie] })

    const omdbMeta = createOmdbMeta({
      imdbID: 'tt9999999',
      Title: 'Episode Title',
      Season: '1',
      Episode: '5',
      Type: 'episode',
      seriesID: 'tt1111111',
    })

    await usingAsync(new Injector(), async (injector) => {
      await ensureMovieExists(omdbMeta, injector)

      expect(mockMovieStoreAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          imdbId: 'tt9999999',
          season: 1,
          episode: 5,
          type: 'episode',
          seriesId: 'tt1111111',
        }),
      )
    })
  })

  it('should handle missing runtime', async () => {
    mockMovieStoreGet.mockResolvedValue(null)
    mockMovieStoreAdd.mockResolvedValue({ created: [{ imdbId: 'tt1234567' }] })

    const omdbMeta = createOmdbMeta({ Runtime: undefined })

    await usingAsync(new Injector(), async (injector) => {
      await ensureMovieExists(omdbMeta, injector)

      expect(mockMovieStoreAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          duration: undefined,
        }),
      )
    })
  })
})
