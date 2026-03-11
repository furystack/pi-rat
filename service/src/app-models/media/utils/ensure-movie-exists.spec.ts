import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
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
  it('should return existing movie if found', async () => {
    const existingMovie = {
      imdbId: 'tt1234567',
      year: 2024,
    }
    mockMovieStoreGet.mockResolvedValue(existingMovie)

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureMovieExists({ imdbId: 'tt1234567', year: 2024, type: 'movie' }, injector)

      expect(mockMovieStoreGet).toHaveBeenCalledWith(injector, 'tt1234567')
      expect(mockMovieStoreAdd).not.toHaveBeenCalled()
      expect(result).toBe(existingMovie)
    })
  })

  it('should create new movie if not found', async () => {
    const newMovie = {
      imdbId: 'tt1234567',
      year: 2024,
    }
    mockMovieStoreGet.mockResolvedValue(null)
    mockMovieStoreAdd.mockResolvedValue({ created: [newMovie] })

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureMovieExists({ imdbId: 'tt1234567', year: 2024, type: 'movie' }, injector)

      expect(mockMovieStoreGet).toHaveBeenCalledWith(injector, 'tt1234567')
      expect(mockMovieStoreAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          imdbId: 'tt1234567',
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
      year: 2024,
      season: 1,
      episode: 5,
    }
    mockMovieStoreGet.mockResolvedValue(null)
    mockMovieStoreAdd.mockResolvedValue({ created: [newMovie] })

    await usingAsync(new Injector(), async (injector) => {
      await ensureMovieExists(
        {
          imdbId: 'tt9999999',
          year: 2024,
          season: 1,
          episode: 5,
          type: 'episode',
          seriesId: 'tt1111111',
        },
        injector,
      )

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

  it('should handle missing duration', async () => {
    mockMovieStoreGet.mockResolvedValue(null)
    mockMovieStoreAdd.mockResolvedValue({ created: [{ imdbId: 'tt1234567' }] })

    await usingAsync(new Injector(), async (injector) => {
      await ensureMovieExists({ imdbId: 'tt1234567', year: 2024, type: 'movie' }, injector)

      expect(mockMovieStoreAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          duration: undefined,
        }),
      )
    })
  })
})
