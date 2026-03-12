import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { TmdbClientService, buildTmdbImageUrl } from './tmdb-client-service.js'
import type {
  TmdbMovieDetailsResponse,
  TmdbTvDetailsResponse,
  TmdbEpisodeDetailsResponse,
  TmdbFindByIdResponse,
  TmdbPaginatedResponse,
  TmdbSearchMovieResult,
  TmdbSearchTvResult,
} from './tmdb-api-types.js'

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: () => ({}),
}))

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
      warning: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      debug: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('@furystack/inject', () => ({
  Injectable: () => (target: unknown) => target,
  Injected: () => () => undefined,
}))

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: vi.fn(),
    subscribe: vi.fn(),
  }),
}))

const createMockResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : `HTTP ${status}`,
    headers: {
      get: () => null,
    },
    json: () => Promise.resolve(body),
  }) as unknown as Response

const createSearchMovieResponse = (
  results: Array<Partial<TmdbSearchMovieResult>> = [],
): TmdbPaginatedResponse<TmdbSearchMovieResult> => ({
  page: 1,
  results: results.map((r) => ({
    adult: false,
    backdrop_path: null,
    genre_ids: [],
    id: 12345,
    original_language: 'en',
    original_title: 'Test Movie',
    overview: 'A test movie',
    popularity: 10,
    poster_path: null,
    release_date: '2024-01-01',
    title: 'Test Movie',
    video: false,
    vote_average: 7.5,
    vote_count: 100,
    ...r,
  })),
  total_pages: 1,
  total_results: results.length,
})

const createSearchTvResponse = (
  results: Array<Partial<TmdbSearchTvResult>> = [],
): TmdbPaginatedResponse<TmdbSearchTvResult> => ({
  page: 1,
  results: results.map((r) => ({
    adult: false,
    backdrop_path: null,
    genre_ids: [],
    id: 67890,
    origin_country: ['US'],
    original_language: 'en',
    original_name: 'Test Series',
    overview: 'A test series',
    popularity: 10,
    poster_path: null,
    first_air_date: '2024-01-01',
    name: 'Test Series',
    vote_average: 8.0,
    vote_count: 200,
    ...r,
  })),
  total_pages: 1,
  total_results: results.length,
})

const createMovieDetailsResponse = (overrides: Partial<TmdbMovieDetailsResponse> = {}): TmdbMovieDetailsResponse => ({
  adult: false,
  backdrop_path: null,
  belongs_to_collection: null,
  budget: 1000000,
  genres: [{ id: 28, name: 'Action' }],
  homepage: '',
  id: 12345,
  imdb_id: 'tt1234567',
  origin_country: ['US'],
  original_language: 'en',
  original_title: 'Test Movie',
  overview: 'A test movie',
  popularity: 10,
  poster_path: '/poster.jpg',
  production_companies: [],
  production_countries: [],
  release_date: '2024-01-01',
  revenue: 5000000,
  runtime: 120,
  spoken_languages: [],
  status: 'Released',
  tagline: 'A tagline',
  title: 'Test Movie',
  video: false,
  vote_average: 7.5,
  vote_count: 100,
  ...overrides,
})

const createTvDetailsResponse = (overrides: Partial<TmdbTvDetailsResponse> = {}): TmdbTvDetailsResponse => ({
  adult: false,
  backdrop_path: null,
  created_by: [],
  episode_run_time: [45],
  first_air_date: '2024-01-01',
  genres: [{ id: 18, name: 'Drama' }],
  homepage: '',
  id: 67890,
  in_production: true,
  languages: ['en'],
  last_air_date: '2024-12-01',
  last_episode_to_air: null,
  name: 'Test Series',
  networks: [],
  next_episode_to_air: null,
  number_of_episodes: 10,
  number_of_seasons: 1,
  origin_country: ['US'],
  original_language: 'en',
  original_name: 'Test Series',
  overview: 'A test series',
  popularity: 10,
  poster_path: '/poster.jpg',
  production_companies: [],
  production_countries: [],
  seasons: [],
  spoken_languages: [],
  status: 'Returning Series',
  tagline: '',
  type: 'Scripted',
  vote_average: 8.0,
  vote_count: 200,
  external_ids: { imdb_id: 'tt9876543', facebook_id: null, instagram_id: null, twitter_id: null, wikidata_id: null },
  ...overrides,
})

const createEpisodeDetailsResponse = (
  overrides: Partial<TmdbEpisodeDetailsResponse> = {},
): TmdbEpisodeDetailsResponse => ({
  air_date: '2024-03-01',
  episode_number: 5,
  id: 111222,
  name: 'Test Episode',
  overview: 'A test episode',
  production_code: '',
  runtime: 45,
  season_number: 1,
  still_path: '/still.jpg',
  vote_average: 8.5,
  vote_count: 50,
  crew: [],
  guest_stars: [],
  ...overrides,
})

const createFindByIdResponse = (overrides: Partial<TmdbFindByIdResponse> = {}): TmdbFindByIdResponse => ({
  movie_results: [],
  tv_results: [],
  person_results: [],
  tv_episode_results: [],
  tv_season_results: [],
  ...overrides,
})

describe('TmdbClientService', () => {
  let service: TmdbClientService
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    service = new TmdbClientService()

    Object.defineProperty(service, 'logger', {
      value: {
        verbose: vi.fn().mockResolvedValue(undefined),
        information: vi.fn().mockResolvedValue(undefined),
        warning: vi.fn().mockResolvedValue(undefined),
        error: vi.fn().mockResolvedValue(undefined),
        debug: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    })

    Object.defineProperty(service, 'semaphore', {
      value: { execute: <T>(fn: () => Promise<T>) => fn() },
      writable: true,
    })

    service.config = {
      id: 'TMDB_CONFIG',
      value: { apiKey: 'test-api-key', defaultLanguage: 'en-US' },
    } as never
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('buildTmdbImageUrl', () => {
    it('should return undefined for null path', () => {
      expect(buildTmdbImageUrl(null)).toBeUndefined()
    })

    it('should build URL with default size', () => {
      expect(buildTmdbImageUrl('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
    })

    it('should build URL with custom size', () => {
      expect(buildTmdbImageUrl('/poster.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/poster.jpg')
    })
  })

  describe('searchMovie', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.searchMovie('Test')
      expect(result.status).toBe('not-configured')
    })

    it('should return success with search results', async () => {
      expect.assertions(2)

      const searchResponse = createSearchMovieResponse([{ id: 12345, title: 'Test Movie' }])
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(searchResponse))

      const result = await service.searchMovie('Test Movie')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.results[0].title).toBe('Test Movie')
      }
    })

    it('should include year in query when provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([])))
      globalThis.fetch = mockFetch

      await service.searchMovie('Test', { year: 2024 })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('year=2024')
    })

    it('should return not-found for 404 response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse({}, 404))

      const result = await service.searchMovie('Nonexistent')
      expect(result.status).toBe('not-found')
    })

    it('should return error for non-ok response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse({}, 500))

      const result = await service.searchMovie('Test')
      expect(result.status).toBe('error')
    })
  })

  describe('searchTv', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.searchTv('Test')
      expect(result.status).toBe('not-configured')
    })

    it('should return success with search results', async () => {
      expect.assertions(2)

      const searchResponse = createSearchTvResponse([{ id: 67890, name: 'Test Series' }])
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(searchResponse))

      const result = await service.searchTv('Test Series')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.results[0].name).toBe('Test Series')
      }
    })
  })

  describe('getMovieDetails', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.getMovieDetails(12345)
      expect(result.status).toBe('not-configured')
    })

    it('should return success with movie details', async () => {
      expect.assertions(2)

      const details = createMovieDetailsResponse()
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(details))

      const result = await service.getMovieDetails(12345)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.imdb_id).toBe('tt1234567')
      }
    })

    it('should include append_to_response for external_ids', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createMovieDetailsResponse()))
      globalThis.fetch = mockFetch

      await service.getMovieDetails(12345)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('append_to_response=external_ids')
    })
  })

  describe('getTvDetails', () => {
    it('should return success with TV details', async () => {
      expect.assertions(2)

      const details = createTvDetailsResponse()
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(details))

      const result = await service.getTvDetails(67890)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.name).toBe('Test Series')
      }
    })
  })

  describe('getEpisodeDetails', () => {
    it('should return success with episode details', async () => {
      expect.assertions(2)

      const details = createEpisodeDetailsResponse()
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(details))

      const result = await service.getEpisodeDetails(67890, 1, 5)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.name).toBe('Test Episode')
      }
    })

    it('should construct correct URL for episode', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createEpisodeDetailsResponse()))
      globalThis.fetch = mockFetch

      await service.getEpisodeDetails(67890, 2, 3)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('/tv/67890/season/2/episode/3')
    })
  })

  describe('findByImdbId', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.findByImdbId('tt1234567')
      expect(result.status).toBe('not-configured')
    })

    it('should return success with find results', async () => {
      expect.assertions(2)

      const findResponse = createFindByIdResponse({
        tv_results: [
          {
            id: 67890,
            name: 'Test Series',
          } as TmdbSearchTvResult,
        ],
      })
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(findResponse))

      const result = await service.findByImdbId('tt1234567')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.tv_results[0].id).toBe(67890)
      }
    })

    it('should include external_source=imdb_id in URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createFindByIdResponse()))
      globalThis.fetch = mockFetch

      await service.findByImdbId('tt1234567')

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('/find/tt1234567')
      expect(calledUrl).toContain('external_source=imdb_id')
    })
  })

  describe('request deduplication', () => {
    it('should deduplicate concurrent requests for the same endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([{ id: 1 }])))
      globalThis.fetch = mockFetch

      const [result1, result2] = await Promise.all([
        service.searchMovie('Test Movie'),
        service.searchMovie('Test Movie'),
      ])

      expect(result1.status).toBe('success')
      expect(result2.status).toBe('success')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should make separate requests for different endpoints', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([{ id: 1 }])))
      globalThis.fetch = mockFetch

      await service.searchMovie('Movie A')
      await service.searchMovie('Movie B')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should make a fresh request after the previous one completes', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([{ id: 1 }])))
      globalThis.fetch = mockFetch

      await service.searchMovie('Test Movie')
      await service.searchMovie('Test Movie')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('rate limit handling', () => {
    it('should return rate-limited after exhausting retries', async () => {
      vi.useFakeTimers()

      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse({}, 429))

      const resultPromise = service.searchMovie('Test')

      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(60_000)
      }

      const result = await resultPromise
      expect(result.status).toBe('rate-limited')
      // 1 initial + 3 retries = 4 total calls
      expect(globalThis.fetch).toHaveBeenCalledTimes(4)

      vi.useRealTimers()
    })

    it('should succeed after transient rate limit', async () => {
      vi.useFakeTimers()

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse({}, 429))
        .mockResolvedValueOnce(createMockResponse(createSearchMovieResponse([{ id: 1 }])))

      globalThis.fetch = mockFetch

      const resultPromise = service.searchMovie('Test')
      await vi.advanceTimersByTimeAsync(10_000)

      const result = await resultPromise
      expect(result.status).toBe('success')
      expect(mockFetch).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })

    it('should use Retry-After header when present', async () => {
      vi.useFakeTimers()

      const rateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: { get: (name: string) => (name === 'Retry-After' ? '5' : null) },
        json: () => Promise.resolve({}),
      } as unknown as Response

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(createMockResponse(createSearchMovieResponse([{ id: 1 }])))

      globalThis.fetch = mockFetch

      const resultPromise = service.searchMovie('Test')

      // 5 seconds from Retry-After header
      await vi.advanceTimersByTimeAsync(5_000)

      const result = await resultPromise
      expect(result.status).toBe('success')

      vi.useRealTimers()
    })
  })

  describe('fetchTmdbMovieMetadata', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.fetchTmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('not-configured')
    })

    it('should return success for a movie search', async () => {
      expect.assertions(2)

      const searchResponse = createSearchMovieResponse([{ id: 12345 }])
      const detailsResponse = createMovieDetailsResponse({ imdb_id: 'tt1234567' })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(searchResponse))
        .mockResolvedValueOnce(createMockResponse(detailsResponse))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Test Movie', year: 2024 })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.movie.imdb_id).toBe('tt1234567')
      }
    })

    it('should return not-found when search returns empty results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([])))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Nonexistent' })
      expect(result.status).toBe('not-found')
    })

    it('should return not-found when movie has no IMDB ID', async () => {
      const searchResponse = createSearchMovieResponse([{ id: 12345 }])
      const detailsResponse = createMovieDetailsResponse({ imdb_id: null, external_ids: undefined })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(searchResponse))
        .mockResolvedValueOnce(createMockResponse(detailsResponse))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('not-found')
    })

    it('should use external_ids.imdb_id as fallback', async () => {
      expect.assertions(2)

      const searchResponse = createSearchMovieResponse([{ id: 12345 }])
      const detailsResponse = createMovieDetailsResponse({
        imdb_id: null,
        external_ids: {
          imdb_id: 'tt7777777',
          facebook_id: null,
          instagram_id: null,
          twitter_id: null,
          wikidata_id: null,
        },
      })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(searchResponse))
        .mockResolvedValueOnce(createMockResponse(detailsResponse))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.movie.imdb_id).toBe('tt7777777')
      }
    })

    it('should return error when fetch throws', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('error')
    })
  })

  describe('fetchTmdbMovieMetadata - episode flow', () => {
    it('should fetch episode metadata when season and episode are provided', async () => {
      expect.assertions(4)

      const searchTvResponse = createSearchTvResponse([{ id: 67890 }])
      const tvDetailsResponse = createTvDetailsResponse()
      const episodeResponse = createEpisodeDetailsResponse()

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(searchTvResponse))
        .mockResolvedValueOnce(createMockResponse(tvDetailsResponse))
        .mockResolvedValueOnce(createMockResponse(episodeResponse))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Test Series', season: 1, episode: 5 })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.movie.imdb_id).toBe('tt9876543')
        expect(result.data.episode?.name).toBe('Test Episode')
        expect(result.data.series?.name).toBe('Test Series')
      }
    })

    it('should return not-found when TV search returns no results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(createSearchTvResponse([])))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Nonexistent', season: 1, episode: 1 })
      expect(result.status).toBe('not-found')
    })

    it('should return not-found when TV series has no IMDB ID', async () => {
      const searchTvResponse = createSearchTvResponse([{ id: 67890 }])
      const tvDetailsResponse = createTvDetailsResponse({
        external_ids: {
          imdb_id: null,
          facebook_id: null,
          instagram_id: null,
          twitter_id: null,
          wikidata_id: null,
        },
      })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(searchTvResponse))
        .mockResolvedValueOnce(createMockResponse(tvDetailsResponse))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Test', season: 1, episode: 1 })
      expect(result.status).toBe('not-found')
    })

    it('should build synthetic movie from episode data', async () => {
      expect.assertions(3)

      const searchTvResponse = createSearchTvResponse([{ id: 67890 }])
      const tvDetailsResponse = createTvDetailsResponse()
      const episodeResponse = createEpisodeDetailsResponse({ name: 'Pilot', runtime: 60 })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(searchTvResponse))
        .mockResolvedValueOnce(createMockResponse(tvDetailsResponse))
        .mockResolvedValueOnce(createMockResponse(episodeResponse))

      const result = await service.fetchTmdbMovieMetadata({ title: 'Test', season: 1, episode: 1 })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.movie.title).toBe('Pilot')
        expect(result.data.movie.runtime).toBe(60)
      }
    })
  })

  describe('fetchTmdbMovieMetadataByImdbId', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.fetchTmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      expect(result.status).toBe('not-configured')
    })

    it('should resolve a movie via movie_results', async () => {
      expect.assertions(2)

      const findResponse = createFindByIdResponse({
        movie_results: [{ id: 12345 } as TmdbSearchMovieResult],
      })
      const detailsResponse = createMovieDetailsResponse({ imdb_id: 'tt1234567' })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(findResponse))
        .mockResolvedValueOnce(createMockResponse(detailsResponse))

      const result = await service.fetchTmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.movie.imdb_id).toBe('tt1234567')
      }
    })

    it('should resolve an episode via tv_results when season and episode are provided', async () => {
      expect.assertions(4)

      const findResponse = createFindByIdResponse({
        tv_results: [{ id: 67890 } as TmdbSearchTvResult],
      })
      const tvDetailsResponse = createTvDetailsResponse()
      const episodeResponse = createEpisodeDetailsResponse({ season_number: 1, episode_number: 5 })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(findResponse))
        .mockResolvedValueOnce(createMockResponse(tvDetailsResponse))
        .mockResolvedValueOnce(createMockResponse(episodeResponse))

      const result = await service.fetchTmdbMovieMetadataByImdbId({ imdbId: 'tt9876543', season: 1, episode: 5 })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.series?.name).toBe('Test Series')
        expect(result.data.episode?.season_number).toBe(1)
        expect(result.data.episode?.episode_number).toBe(5)
      }
    })

    it('should handle tv_results without season/episode by building synthetic movie from series', async () => {
      expect.assertions(2)

      const findResponse = createFindByIdResponse({
        tv_results: [{ id: 67890 } as TmdbSearchTvResult],
      })
      const tvDetailsResponse = createTvDetailsResponse({ name: 'Test Series' })

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(findResponse))
        .mockResolvedValueOnce(createMockResponse(tvDetailsResponse))

      const result = await service.fetchTmdbMovieMetadataByImdbId({ imdbId: 'tt9876543' })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.series?.name).toBe('Test Series')
      }
    })

    it('should return not-found when no movie or tv results', async () => {
      const findResponse = createFindByIdResponse()
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(findResponse))

      const result = await service.fetchTmdbMovieMetadataByImdbId({ imdbId: 'tt0000000' })
      expect(result.status).toBe('not-found')
    })

    it('should return error when fetch throws', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await service.fetchTmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      expect(result.status).toBe('error')
    })
  })

  describe('fetchTmdbSeriesMetadata', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.fetchTmdbSeriesMetadata({ imdbId: 'tt1234567' })
      expect(result.status).toBe('not-configured')
    })

    it('should return success with series details', async () => {
      expect.assertions(2)

      const findResponse = createFindByIdResponse({
        tv_results: [{ id: 67890 } as TmdbSearchTvResult],
      })
      const tvDetailsResponse = createTvDetailsResponse()

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(findResponse))
        .mockResolvedValueOnce(createMockResponse(tvDetailsResponse))

      const result = await service.fetchTmdbSeriesMetadata({ imdbId: 'tt1234567' })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.name).toBe('Test Series')
      }
    })

    it('should return not-found when IMDB ID has no TV results', async () => {
      const findResponse = createFindByIdResponse({ tv_results: [] })
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(findResponse))

      const result = await service.fetchTmdbSeriesMetadata({ imdbId: 'tt9999999' })
      expect(result.status).toBe('not-found')
    })

    it('should return error when fetch throws', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await service.fetchTmdbSeriesMetadata({ imdbId: 'tt1234567' })
      expect(result.status).toBe('error')
    })
  })

  describe('authorization header', () => {
    it('should send Bearer token in Authorization header', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([])))
      globalThis.fetch = mockFetch

      await service.searchMovie('Test')

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit
      expect((calledOptions.headers as Record<string, string>).Authorization).toBe('Bearer test-api-key')
    })
  })

  describe('language defaults', () => {
    it('should use config defaultLanguage', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([])))
      globalThis.fetch = mockFetch

      await service.searchMovie('Test')

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('language=en-US')
    })

    it('should use explicit language override', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([])))
      globalThis.fetch = mockFetch

      await service.searchMovie('Test', { language: 'fr-FR' })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('language=fr-FR')
    })

    it('should fall back to en-US when config has no defaultLanguage', async () => {
      service.config = {
        id: 'TMDB_CONFIG',
        value: { apiKey: 'test-api-key' },
      } as never

      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(createSearchMovieResponse([])))
      globalThis.fetch = mockFetch

      await service.searchMovie('Test')

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('language=en-US')
    })
  })
})
