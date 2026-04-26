import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { Movie, MovieFile } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WebsocketService } from '../../websocket-service.js'
import { announceMovieFileAdded } from './announce-movie-file-added.js'

const mockDataSetGet = vi.fn()
const mockAnnounce = vi.fn().mockResolvedValue(undefined)
const mockLoggerError = vi.fn().mockResolvedValue(undefined)

const createMockLogger = () => ({
  verbose: vi.fn().mockResolvedValue(undefined),
  error: mockLoggerError,
  information: vi.fn().mockResolvedValue(undefined),
  debug: vi.fn().mockResolvedValue(undefined),
  warning: vi.fn().mockResolvedValue(undefined),
  fatal: vi.fn().mockResolvedValue(undefined),
  withScope: vi.fn(),
})

const createMockMovieDataSet = () => ({
  get: (...args: unknown[]) => mockDataSetGet(...args) as unknown,
})

const createMovieFile = (overrides: Partial<MovieFile> = {}): MovieFile =>
  ({
    id: 'file-1',
    driveLetter: 'A',
    path: 'movies/Test.Movie.mkv',
    imdbId: 'tt1234567',
    ffprobe: {},
    ...overrides,
  }) as MovieFile

const createMovie = (overrides: Partial<Movie> = {}): Movie =>
  ({
    imdbId: 'tt1234567',
    ...overrides,
  }) as Movie

describe('announceMovieFileAdded', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should skip announcement when entity has no imdbId', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await announceMovieFileAdded({
        entity: createMovieFile({ imdbId: '' }),
        injector,
        movieDataSet: createMockMovieDataSet() as never,
        logger: createMockLogger() as never,
      })

      expect(mockDataSetGet).not.toHaveBeenCalled()
    })
  })

  it('should announce when movie exists for the entity', async () => {
    const movie = createMovie()
    mockDataSetGet.mockResolvedValue(movie)

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(WebsocketService, async () => ({ announce: mockAnnounce }))

      const entity = createMovieFile()

      await announceMovieFileAdded({
        entity,
        injector,
        movieDataSet: createMockMovieDataSet() as never,
        logger: createMockLogger() as never,
      })

      expect(mockDataSetGet).toHaveBeenCalledWith(injector, 'tt1234567')
      expect(mockAnnounce).toHaveBeenCalledWith(
        {
          type: 'add-movie',
          file: { driveLetter: 'A', path: 'movies/Test.Movie.mkv' },
          movie,
          movieFile: entity,
        },
        expect.any(Function),
      )
    })
  })

  it('should not announce when movie does not exist', async () => {
    mockDataSetGet.mockResolvedValue(undefined)

    await usingAsync(new Injector(), async (injector) => {
      await announceMovieFileAdded({
        entity: createMovieFile(),
        injector,
        movieDataSet: createMockMovieDataSet() as never,
        logger: createMockLogger() as never,
      })

      expect(mockDataSetGet).toHaveBeenCalled()
      expect(mockAnnounce).not.toHaveBeenCalled()
    })
  })

  it('should log error when announcement fails', async () => {
    mockDataSetGet.mockRejectedValue(new Error('DB connection failed'))

    await usingAsync(new Injector(), async (injector) => {
      const logger = createMockLogger()

      await announceMovieFileAdded({
        entity: createMovieFile(),
        injector,
        movieDataSet: createMockMovieDataSet() as never,
        logger: logger as never,
      })

      expect(mockLoggerError).toHaveBeenCalledWith({
        message: "Failed to announce new movie file 'movies/Test.Movie.mkv'",
        data: { error: expect.any(Error) },
      })
    })
  })
})
