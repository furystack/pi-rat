import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OmdbMovieMetadata, OmdbSeriesMetadata, PiRatFile } from 'common'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'

const mockOmdbSeriesGet = vi.fn()
const mockOmdbSeriesAdd = vi.fn()
const mockEnsureSeriesExists = vi.fn().mockResolvedValue(undefined)
const mockFetchOmdbSeriesMetadata = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockOmdbSeriesGet(...args) as unknown,
    add: (...args: unknown[]) => mockOmdbSeriesAdd(...args) as unknown,
  }),
}))

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      warning: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('./ensure-series-exists.js', () => ({
  ensureSeriesExists: (...args: unknown[]) => mockEnsureSeriesExists(...args) as unknown,
}))

vi.mock('./ensure-localized-metadata-exists.js', () => ({
  ensureSeriesLocalizedMetadataExists: vi.fn().mockResolvedValue({}),
}))

vi.mock('./map-omdb-to-localized.js', () => ({
  mapOmdbSeriesToLocalized: vi.fn().mockReturnValue({}),
}))

const { ensureOmdbSeriesExists } = await import('./ensure-omdb-series-exists.js')

const createMeta = (overrides?: Partial<OmdbMovieMetadata>): OmdbMovieMetadata =>
  ({
    imdbID: 'tt1234567',
    Title: 'Test Episode',
    Year: '2024',
    seriesID: 'tt9999999',
    ...overrides,
  }) as OmdbMovieMetadata

const createTestInjector = () => {
  const injector = new Injector()
  injector.setExplicitInstance(
    { fetchOmdbSeriesMetadata: mockFetchOmdbSeriesMetadata } as unknown as OmdbClientService,
    OmdbClientService,
  )
  return injector
}

describe('ensureOmdbSeriesExists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return early when seriesID is missing', async () => {
    await usingAsync(createTestInjector(), async (injector) => {
      await ensureOmdbSeriesExists(createMeta({ seriesID: undefined }), injector)

      expect(mockOmdbSeriesGet).not.toHaveBeenCalled()
      expect(mockFetchOmdbSeriesMetadata).not.toHaveBeenCalled()
    })
  })

  it('should call ensureSeriesExists with stored result when series is already in database', async () => {
    const storedSeries = {
      imdbID: 'tt9999999',
      Title: 'Stored Series',
      Year: '2024',
      totalSeasons: '3',
    } as OmdbSeriesMetadata
    mockOmdbSeriesGet.mockResolvedValue(storedSeries)

    await usingAsync(createTestInjector(), async (injector) => {
      await ensureOmdbSeriesExists(createMeta(), injector)

      expect(mockOmdbSeriesGet).toHaveBeenCalled()
      expect(mockFetchOmdbSeriesMetadata).not.toHaveBeenCalled()
      expect(mockEnsureSeriesExists).toHaveBeenCalledWith(
        { imdbId: 'tt9999999', year: '2024', numberOfSeasons: 3 },
        injector,
      )
    })
  })

  it('should fetch from OMDB, add to dataset, and call ensureSeriesExists when not stored', async () => {
    const fetchedSeries = {
      imdbID: 'tt9999999',
      Title: 'Fetched Series',
      Year: '2023',
      totalSeasons: '5',
    } as OmdbSeriesMetadata
    mockOmdbSeriesGet.mockResolvedValue(undefined)
    mockFetchOmdbSeriesMetadata.mockResolvedValue({ status: 'success', data: fetchedSeries })
    mockOmdbSeriesAdd.mockResolvedValue({ created: [fetchedSeries] })

    await usingAsync(createTestInjector(), async (injector) => {
      await ensureOmdbSeriesExists(createMeta(), injector)

      expect(mockFetchOmdbSeriesMetadata).toHaveBeenCalledWith({ imdbId: 'tt9999999' }, { file: undefined })
      expect(mockOmdbSeriesAdd).toHaveBeenCalledWith(injector, fetchedSeries)
      expect(mockEnsureSeriesExists).toHaveBeenCalledWith(
        { imdbId: 'tt9999999', year: '2023', numberOfSeasons: 5 },
        injector,
      )
    })
  })

  it('should pass context file to fetchOmdbSeriesMetadata', async () => {
    const file: PiRatFile = { driveLetter: 'A', path: 'movies/episode.mkv' }
    mockOmdbSeriesGet.mockResolvedValue(undefined)
    mockFetchOmdbSeriesMetadata.mockResolvedValue({ status: 'success', data: { imdbID: 'tt9999999' } })
    mockOmdbSeriesAdd.mockResolvedValue({ created: [{ imdbID: 'tt9999999' }] })

    await usingAsync(createTestInjector(), async (injector) => {
      await ensureOmdbSeriesExists(createMeta(), injector, { file })

      expect(mockFetchOmdbSeriesMetadata).toHaveBeenCalledWith({ imdbId: 'tt9999999' }, { file })
    })
  })

  it('should return without adding when OMDB fetch returns non-success status', async () => {
    mockOmdbSeriesGet.mockResolvedValue(undefined)
    mockFetchOmdbSeriesMetadata.mockResolvedValue({ status: 'rate-limited' })

    await usingAsync(createTestInjector(), async (injector) => {
      await ensureOmdbSeriesExists(createMeta(), injector)

      expect(mockOmdbSeriesAdd).not.toHaveBeenCalled()
      expect(mockEnsureSeriesExists).not.toHaveBeenCalled()
    })
  })

  it('should return without adding when OMDB returns not-configured', async () => {
    mockOmdbSeriesGet.mockResolvedValue(undefined)
    mockFetchOmdbSeriesMetadata.mockResolvedValue({ status: 'not-configured' })

    await usingAsync(createTestInjector(), async (injector) => {
      await ensureOmdbSeriesExists(createMeta(), injector)

      expect(mockOmdbSeriesAdd).not.toHaveBeenCalled()
      expect(mockEnsureSeriesExists).not.toHaveBeenCalled()
    })
  })
})
