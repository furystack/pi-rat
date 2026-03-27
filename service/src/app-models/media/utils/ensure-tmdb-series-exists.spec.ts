import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TmdbTvDetailsResponse } from '../metadata-services/tmdb-api-types.js'
import { TmdbClientService } from '../metadata-services/tmdb-client-service.js'
import { ensureTmdbSeriesExists } from './ensure-tmdb-series-exists.js'

const mockTmdbSeriesGet = vi.fn()
const mockTmdbSeriesAdd = vi.fn()
const mockFetchTmdbSeriesMetadata = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockTmdbSeriesGet(...args) as unknown,
    add: (...args: unknown[]) => mockTmdbSeriesAdd(...args) as unknown,
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
  ensureSeriesExists: vi.fn().mockResolvedValue({ imdbId: 'tt9876543' }),
}))

vi.mock('./ensure-localized-metadata-exists.js', () => ({
  ensureSeriesLocalizedMetadataExists: vi.fn().mockResolvedValue({}),
}))

vi.mock('./map-tmdb-to-localized.js', () => ({
  mapTmdbSeriesToLocalized: vi.fn().mockReturnValue({}),
}))

const createTmdbSeries = (): TmdbTvDetailsResponse =>
  ({
    id: 67890,
    name: 'Test Series',
    original_name: 'Test Series',
    overview: 'A test series.',
    first_air_date: '2024-01-15',
    poster_path: '/poster.jpg',
    backdrop_path: null,
    genres: [{ id: 18, name: 'Drama' }],
    vote_average: 8.0,
    vote_count: 200,
    number_of_seasons: 3,
    number_of_episodes: 30,
    status: 'Returning Series',
    original_language: 'en',
    languages: ['en'],
    external_ids: { imdb_id: 'tt9876543', facebook_id: null, instagram_id: null, twitter_id: null, wikidata_id: null },
  }) as TmdbTvDetailsResponse

describe('ensureTmdbSeriesExists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTmdbSeriesGet.mockResolvedValue(null)
    mockTmdbSeriesAdd.mockResolvedValue({ created: [{ id: 67890 }] })
  })

  it('should store provided series data without fetching', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await ensureTmdbSeriesExists('tt9876543', createTmdbSeries(), 'en', injector)

      expect(mockTmdbSeriesAdd).toHaveBeenCalled()
      expect(mockFetchTmdbSeriesMetadata).not.toHaveBeenCalled()
    })
  })

  it('should return early when TMDB series record already exists', async () => {
    mockTmdbSeriesGet.mockResolvedValue({ id: 67890, name: 'Test Series' })

    await usingAsync(new Injector(), async (injector) => {
      await ensureTmdbSeriesExists('tt9876543', createTmdbSeries(), 'en', injector)

      expect(mockTmdbSeriesAdd).not.toHaveBeenCalled()
    })
  })

  it('should fetch from TMDB when no series data is provided', async () => {
    mockFetchTmdbSeriesMetadata.mockResolvedValue({
      status: 'success',
      data: createTmdbSeries(),
    })

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { fetchTmdbSeriesMetadata: mockFetchTmdbSeriesMetadata } as unknown as TmdbClientService,
        TmdbClientService,
      )

      await ensureTmdbSeriesExists('tt9876543', undefined, 'en', injector)

      expect(mockFetchTmdbSeriesMetadata).toHaveBeenCalledWith({ imdbId: 'tt9876543' }, { file: undefined })
      expect(mockTmdbSeriesAdd).toHaveBeenCalled()
    })
  })

  it('should handle fetch failure gracefully', async () => {
    mockFetchTmdbSeriesMetadata.mockResolvedValue({ status: 'not-found' })

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { fetchTmdbSeriesMetadata: mockFetchTmdbSeriesMetadata } as unknown as TmdbClientService,
        TmdbClientService,
      )

      await ensureTmdbSeriesExists('tt9876543', undefined, 'en', injector)

      expect(mockTmdbSeriesAdd).not.toHaveBeenCalled()
    })
  })
})
