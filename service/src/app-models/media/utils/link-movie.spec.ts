import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PiRatFile } from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { linkMovie } from './link-movie.js'

// Mock getStoreManager
const mockMovieFileStoreFind = vi.fn()
const mockMovieFileStoreAdd = vi.fn()
const mockOmdbStoreFind = vi.fn()

vi.mock('@furystack/core', () => ({
  getStoreManager: () => ({
    getStoreFor: (model: { name: string }) => {
      if (model.name === 'MovieFile') {
        return {
          find: (...args: unknown[]) => mockMovieFileStoreFind(...args) as unknown,
          add: (...args: unknown[]) => mockMovieFileStoreAdd(...args) as unknown,
        }
      }
      if (model.name === 'OmdbMovieMetadata') {
        return {
          find: (...args: unknown[]) => mockOmdbStoreFind(...args) as unknown,
        }
      }
      return {}
    },
  }),
}))

// Mock getLogger
vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      debug: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

// Mock helper functions
vi.mock('./announce-new-movie.js', () => ({
  announceNewMovie: vi.fn().mockResolvedValue(undefined),
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

// Mock services
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

    // Mock FfprobeService
    injector.setExplicitInstance(
      { getFfprobeForPiratFile: mockGetFfprobeForPiratFile } as unknown as FfprobeService,
      FfprobeService,
    )

    // Mock OmdbClientService
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
      mockOmdbStoreFind.mockResolvedValue([
        { imdbID: 'tt1234567', Title: 'Test Movie', Year: '2024' },
      ])
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
        imdbID: 'tt1234567',
        Title: 'Test Movie',
        Year: '2024',
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

    it('should throw 404 when OMDB metadata not found', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue(null)

      await usingAsync(createTestInjector(), async (injector) => {
        await expect(
          linkMovie({
            injector,
            file: createFile('movies/Unknown.Movie.2024.mkv'),
          }),
        ).rejects.toThrow('Metadata not found')
      })
    })
  })
})
