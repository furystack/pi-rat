import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { MovieFile, PiRatFile } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FfprobeService } from '../../../ffprobe-service.js'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { TmdbClientService } from '../metadata-services/tmdb-client-service.js'
import { linkMovie } from './link-movie.js'

const mockMovieFileStoreFind = vi.fn()
const mockMovieFileStoreAdd = vi.fn()
const mockOmdbStoreFind = vi.fn()
const mockDriveGet = vi.fn()

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
    if (name === 'Config') {
      return {
        get: vi.fn().mockResolvedValue(null),
      }
    }
    if (name === 'Drive') {
      return {
        get: (...args: unknown[]) => mockDriveGet(...args) as unknown,
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
  ensureMovieExists: vi.fn().mockResolvedValue({ imdbId: 'tt1234567' }),
}))

vi.mock('./ensure-omdb-movie-exists.js', () => ({
  ensureOmdbMovieExists: vi.fn().mockImplementation((result: unknown) => result),
}))

vi.mock('./ensure-omdb-series-exists.js', () => ({
  ensureOmdbSeriesExists: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./ensure-tmdb-movie-exists.js', () => ({
  ensureTmdbMovieExists: vi.fn().mockResolvedValue({}),
}))

vi.mock('./ensure-tmdb-series-exists.js', () => ({
  ensureTmdbSeriesExists: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./ensure-localized-metadata-exists.js', () => ({
  ensureMovieLocalizedMetadataExists: vi.fn().mockResolvedValue({}),
  ensureSeriesLocalizedMetadataExists: vi.fn().mockResolvedValue({}),
}))

vi.mock('./map-omdb-to-localized.js', () => ({
  mapOmdbMovieToLocalized: vi.fn().mockReturnValue({}),
}))

vi.mock('./map-tmdb-to-localized.js', () => ({
  mapTmdbMovieToLocalized: vi.fn().mockReturnValue({}),
}))

const mockExtractImdbIdFromFfprobeTags = vi.fn()
vi.mock('./extract-imdb-id-from-tags.js', () => ({
  extractImdbIdFromFfprobeTags: (...args: unknown[]) => mockExtractImdbIdFromFfprobeTags(...args) as unknown,
}))

const mockExtractImdbIdFromNfoFiles = vi.fn()
vi.mock('./extract-imdb-id-from-nfo.js', () => ({
  extractImdbIdFromNfoFiles: (...args: unknown[]) => mockExtractImdbIdFromNfoFiles(...args) as unknown,
}))

vi.mock('../../../utils/physical-path-utils.js', () => ({
  getPhysicalParentPath: (_drive: unknown, file: { path: string }) =>
    `/mnt/media/${file.path.split('/').slice(0, -1).join('/')}`,
}))

const mockGetFfprobeForPiratFile = vi.fn().mockResolvedValue({ format: { tags: {} }, duration: 7200 })
const mockFetchOmdbMovieMetadata = vi.fn()
const mockFetchTmdbMovieMetadata = vi.fn()

describe('linkMovie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExtractImdbIdFromFfprobeTags.mockReturnValue(undefined)
    mockExtractImdbIdFromNfoFiles.mockResolvedValue({ nfoFiles: [] })
    mockDriveGet.mockResolvedValue({ letter: 'A', physicalPath: '/mnt/media' })
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

    injector.setExplicitInstance(
      { fetchTmdbMovieMetadata: mockFetchTmdbMovieMetadata, config: undefined } as unknown as TmdbClientService,
      TmdbClientService,
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

    it('should return failed when multiple OMDB results found', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([
        { imdbID: 'tt1234567', Title: 'Test Movie 1' },
        { imdbID: 'tt7654321', Title: 'Test Movie 2' },
      ])

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Test.Movie.2024.mkv'),
        })

        expect(result.status).toBe('failed')
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
      mockFetchTmdbMovieMetadata.mockResolvedValue({ status: 'not-found' })

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

    it('should return metadata-not-found when all providers are not configured', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue({ status: 'not-configured' })
      mockFetchTmdbMovieMetadata.mockResolvedValue({ status: 'not-configured' })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Another.Movie.2024.mkv'),
        })

        expect(result.status).toBe('metadata-not-found')
      })
    })

    it('should return metadata-not-found when all providers return errors', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockOmdbStoreFind.mockResolvedValue([])
      mockFetchOmdbMovieMetadata.mockResolvedValue({ status: 'error', error: new Error('Network failure') })
      mockFetchTmdbMovieMetadata.mockResolvedValue({ status: 'error', error: new Error('Network failure') })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Error.Movie.2024.mkv'),
        })

        expect(result.status).toBe('metadata-not-found')
      })
    })
  })

  describe('linking via ffprobe tags', () => {
    it('should link directly when ffprobe tags contain IMDB ID', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockExtractImdbIdFromFfprobeTags.mockReturnValue('tt9999999')
      mockMovieFileStoreAdd.mockResolvedValue({
        created: [{ id: 'new-file-id', path: 'movies/Tagged.Movie.2024.mkv', imdbId: 'tt9999999' }],
      })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Tagged.Movie.2024.mkv'),
        })

        expect(result.status).toBe('linked')
        expect(mockMovieFileStoreAdd).toHaveBeenCalled()
        expect(mockOmdbStoreFind).not.toHaveBeenCalled()
        expect(mockFetchOmdbMovieMetadata).not.toHaveBeenCalled()
        expect(mockFetchTmdbMovieMetadata).not.toHaveBeenCalled()
      })
    })

    it('should skip .nfo scanning when ffprobe tags already have IMDB ID', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockExtractImdbIdFromFfprobeTags.mockReturnValue('tt8888888')
      mockMovieFileStoreAdd.mockResolvedValue({
        created: [{ id: 'new-file-id' }],
      })

      await usingAsync(createTestInjector(), async (injector) => {
        await linkMovie({
          injector,
          file: createFile('movies/Tagged.Movie.2024.mkv'),
        })

        expect(mockExtractImdbIdFromNfoFiles).not.toHaveBeenCalled()
      })
    })
  })

  describe('linking via .nfo files', () => {
    it('should link when .nfo file contains IMDB ID', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockExtractImdbIdFromNfoFiles.mockResolvedValue({
        imdbId: 'tt5555555',
        nfoFiles: ['movies/movie.nfo'],
      })
      mockMovieFileStoreAdd.mockResolvedValue({
        created: [{ id: 'new-file-id', path: 'movies/Nfo.Movie.2024.mkv', imdbId: 'tt5555555' }],
      })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Nfo.Movie.2024.mkv'),
        })

        expect(result.status).toBe('linked')
        expect(mockMovieFileStoreAdd).toHaveBeenCalled()
        expect(mockOmdbStoreFind).not.toHaveBeenCalled()
        expect(mockFetchOmdbMovieMetadata).not.toHaveBeenCalled()
      })
    })

    it('should store .nfo files in relatedFiles when linking via .nfo', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockExtractImdbIdFromNfoFiles.mockResolvedValue({
        imdbId: 'tt4444444',
        nfoFiles: ['movies/movie.nfo', 'movies/extra.nfo'],
      })
      mockMovieFileStoreAdd.mockResolvedValue({
        created: [{ id: 'new-file-id' }],
      })

      await usingAsync(createTestInjector(), async (injector) => {
        await linkMovie({
          injector,
          file: createFile('movies/Nfo.Movie.2024.mkv'),
        })

        const addCall = mockMovieFileStoreAdd.mock.calls[0]
        const addedEntity = addCall[1] as unknown as MovieFile
        expect(addedEntity.relatedFiles).toEqual([
          { type: 'info', path: 'movies/movie.nfo' },
          { type: 'info', path: 'movies/extra.nfo' },
        ])
      })
    })

    it('should fall back to OMDB/TMDB when .nfo has no IMDB ID', async () => {
      mockMovieFileStoreFind.mockResolvedValue([])
      mockExtractImdbIdFromNfoFiles.mockResolvedValue({
        nfoFiles: ['movies/movie.nfo'],
      })
      mockOmdbStoreFind.mockResolvedValue([{ imdbID: 'tt1234567', Title: 'Test Movie', Year: '2024' }])
      mockMovieFileStoreAdd.mockResolvedValue({
        created: [{ id: 'new-file-id' }],
      })

      await usingAsync(createTestInjector(), async (injector) => {
        const result = await linkMovie({
          injector,
          file: createFile('movies/Test.Movie.2024.mkv'),
        })

        expect(result.status).toBe('linked')
        expect(mockOmdbStoreFind).toHaveBeenCalled()
      })
    })
  })
})
