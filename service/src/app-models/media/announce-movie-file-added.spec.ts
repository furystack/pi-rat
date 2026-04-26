import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { Movie, MovieFile } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WebsocketService } from '../../websocket-service.js'
import { announceMovieFileAdded } from './announce-movie-file-added.js'

vi.mock('@furystack/core', () => ({
  isAuthorized: vi.fn().mockResolvedValue(true),
}))

describe('announceMovieFileAdded', () => {
  const mockAnnounce = vi.fn().mockResolvedValue(undefined)
  const mockGet = vi.fn()
  const mockLogger = {
    error: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createEntity = (overrides?: Partial<MovieFile>): MovieFile =>
    ({
      id: 'file-1',
      driveLetter: 'A',
      path: 'movies/test.mkv',
      imdbId: 'tt1234567',
      ffprobe: {},
      ...overrides,
    }) as MovieFile

  const createMovieDataSet = () => ({
    get: (...args: unknown[]) => mockGet(...args) as unknown,
  })

  it('should return early when entity has no imdbId', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await announceMovieFileAdded({
        entity: createEntity({ imdbId: undefined }),
        injector,
        movieDataSet: createMovieDataSet() as never,
        logger: mockLogger as never,
      })

      expect(mockGet).not.toHaveBeenCalled()
      expect(mockAnnounce).not.toHaveBeenCalled()
    })
  })

  it('should announce via websocket when movie exists', async () => {
    const movie: Movie = { imdbId: 'tt1234567', createdAt: '', updatedAt: '' }
    mockGet.mockResolvedValue(movie)

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(WebsocketService, async () => ({ announce: mockAnnounce }))

      await announceMovieFileAdded({
        entity: createEntity(),
        injector,
        movieDataSet: createMovieDataSet() as never,
        logger: mockLogger as never,
      })

      expect(mockGet).toHaveBeenCalledWith(injector, 'tt1234567')
      expect(mockAnnounce).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'add-movie',
          file: { driveLetter: 'A', path: 'movies/test.mkv' },
          movie,
        }),
        expect.any(Function),
      )
    })
  })

  it('should not announce when movie is not found', async () => {
    mockGet.mockResolvedValue(null)

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(WebsocketService, async () => ({ announce: mockAnnounce }))

      await announceMovieFileAdded({
        entity: createEntity(),
        injector,
        movieDataSet: createMovieDataSet() as never,
        logger: mockLogger as never,
      })

      expect(mockAnnounce).not.toHaveBeenCalled()
    })
  })

  it('should log error when movie lookup fails', async () => {
    mockGet.mockRejectedValue(new Error('DB error'))

    await usingAsync(new Injector(), async (injector) => {
      await announceMovieFileAdded({
        entity: createEntity(),
        injector,
        movieDataSet: createMovieDataSet() as never,
        logger: mockLogger as never,
      })

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to announce'),
        }),
      )
    })
  })
})
