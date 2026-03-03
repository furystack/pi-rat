import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PiRatFile } from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { linkMovie } from './link-movie.js'

const mockMovieFileStoreFind = vi.fn()
const mockMovieFileStoreAdd = vi.fn()
const mockOmdbStoreFind = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: (_injector: unknown, model: { name?: string } | ((...args: unknown[]) => unknown)) => {
    const name = typeof model === 'function' ? model.name : ''
    if (name === 'MovieFile') {
      return {
        find: (...args: unknown[]) => mockMovieFileStoreFind(...args) as unknown,
        add: (...args: unknown[]) => mockMovieFileStoreAdd(...args) as unknown,
      }
    }
    if (name === 'OmdbMovieMetadata') {
      return {
        find: (...args: unknown[]) => mockOmdbStoreFind(...args) as unknown,
      }
    }
    return {}
  },
}))

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      debug: vi.fn().mockResolvedValue(undefined),
      warning: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('./ensure-movie-exists.js', () => ({
  ensureMovieExists: vi.fn().mockResolvedValue({ imdbId: 'tt1234567', title: 'Test Movie' }),
}))

vi.mock('./ensure-omdb-movie-exists.js', () => ({
  ensureOmdbMovieExists: vi.fn().mockImplementation((result: unknown) => result),
}))

vi.mock('./ensure-omdb-series-exists.js', () => ({
  ensureOmdbSeriesExists: vi.fn().mockResolvedValue(undefined),
}))

const mockGetFfprobeForPiratFile = vi.fn().mockResolvedValue({ duration: 7200 })
const mockFetchOmdbMovieMetadata = vi.fn()

describe('linkMovie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createFile = (path: string): PiRatFile => ({
    driveLetter: 'A',
    path,
  })

  const createTestInjector = () => {
    const injector = new Injector()

    injector.setExplicitInstance(
      { getFfprobeForPiratFile: mockGetFfprobeForPiratFile } as unknown as FfprobeService,
      FfprobeService,
    )

    injector.setExplicitInstance(
      { fetchOmdbMovieMetadata: mockFetchOmdbMovieMetadata } as unknown as OmdbClientService,
      OmdbClientService,
    )

    return injector
  }

  describe('file type validation', () => {
    it('should return not-movie-file for non-movie extensions', async () => {
      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('documents/readme.txt'),
        })

        expect(result.status).toBe('not-movie-file')
        expect(mockMovieFileStoreFind).not.toHaveBeenCalled()
      })
    })

    it('should return not-movie-file for sample files', async () => {
      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/movie-sample.mkv'),
        })

        expect(result.status).toBe('not-movie-file')
      })
    })
  })

  describe('already linked files', () => {
    it('should return already-linked when file is already in database', async () => {
      mockMovieFileStoreFind.mockResolvedValue([{ id: '123', path: 'movies/test.mkv' }])

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/test.mkv'),
        })

        expect(result.status).toBe('already-linked')
      })
    })
  })

  describe('linking with existing OMDB data', () => {
    it('should link movie when OMDB data exists in store', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([{ imdbID: 'tt1234567', Title: 'Test Movie', Year: '2024' }])
      mockMovieFileStoreAdd.mockResolvedValue({
        created: [{ id: 'new-file-id', path: 'movies/test.mkv', imdbId: 'tt1234567' }],
      })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Test.Movie.2024.mkv'),
        })

        expect(result.status).toBe('linked')
        expect(mockMovieFileStoreAdd).toHaveBeenCalled()
      })
    })

    it('should throw error when multiple OMDB results found', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([
        { imdbID: 'tt1234567', Title: 'Test Movie 1' },
        { imdbID: 'tt7654321', Title: 'Test Movie 2' },
      ])

      await usingAsync(createTestInjector(), async (injector) => {
        await expect(
          linkMovie({
            injector,
            file: createFile('movies/Test.Movie.2024.mkv'),
          }),
        ).rejects.toThrow(RequestError)
      })
    })
  })

  describe('fetching new OMDB data', () => {
    it('should fetch from OMDB when not in store and link', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue({
        status: 'success',
        data: { imdbID: 'tt1234567', Title: 'Test Movie', Year: '2024' },
      })
      mockMovieFileStoreAdd.mockResolvedValue({
        created: [{ id: 'new-file-id' }],
      })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Test.Movie.2024.mkv'),
        })

        expect(result.status).toBe('linked')
        expect(mockFetchOmdbMovieMetadata).toHaveBeenCalled()
      })
    })

    it('should return metadata-not-found when OMDB returns not-found', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue({ status: 'not-found' })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Unknown.Movie.2024.mkv'),
        })

        expect(result.status).toBe('metadata-not-found')
      })
    })

    it('should return rate-limited when OMDB is rate-limited', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue({ status: 'rate-limited' })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Some.Movie.2024.mkv'),
        })

        expect(result.status).toBe('rate-limited')
      })
    })

    it('should return omdb-not-configured when OMDB is not configured', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue({ status: 'not-configured' })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Another.Movie.2024.mkv'),
        })

        expect(result.status).toBe('omdb-not-configured')
      })
    })

    it('should return omdb-error when OMDB returns an error', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue({ status: 'error', error: new Error('Network failure') })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Error.Movie.2024.mkv'),
        })

        expect(result.status).toBe('omdb-error')
      })
    })
  })
})
