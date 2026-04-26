import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createOmdbClientService, type OmdbClientService } from './omdb-client-service.js'

const createMockResponse = (body: Record<string, unknown>, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Internal Server Error',
    json: () => Promise.resolve(body),
  }) as unknown as Response

describe('OmdbClientService', () => {
  let service: OmdbClientService
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    const noopLogger = {
      verbose: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
      warning: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }
    service = createOmdbClientService({
      logger: noopLogger as never,
      semaphore: {
        execute: <T>(task: (options: { signal: AbortSignal }) => Promise<T>) =>
          task({ signal: new AbortController().signal }),
      },
      initialConfig: { id: 'OMDB_CONFIG', value: { apiKey: 'test-key' } } as never,
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('fetchOmdbMovieMetadata', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.fetchOmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('not-configured')
    })

    it('should return success with movie metadata', async () => {
      expect.assertions(2)

      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          imdbID: 'tt1234567',
          Title: 'Test Movie',
          Year: '2024',
        }),
      )

      const result = await service.fetchOmdbMovieMetadata({ title: 'Test Movie', year: 2024 })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.imdbID).toBe('tt1234567')
      }
    })

    it('should return not-found when OMDB says not found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'False',
          Error: 'Movie not found!',
        }),
      )

      const result = await service.fetchOmdbMovieMetadata({ title: 'Nonexistent' })
      expect(result.status).toBe('not-found')
    })

    it('should return error when OMDB returns a non-rate-limit error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'False',
          Error: 'Invalid API key!',
        }),
      )

      const result = await service.fetchOmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('error')
    })

    it('should return error when response is missing imdbID', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          Title: 'Test Movie',
        }),
      )

      const result = await service.fetchOmdbMovieMetadata({ title: 'Test Movie' })
      expect(result.status).toBe('error')
    })

    it('should return error when HTTP response is not ok', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse({}, false))

      const result = await service.fetchOmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('error')
    })

    it('should return error when fetch throws', async () => {
      expect.assertions(2)

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await service.fetchOmdbMovieMetadata({ title: 'Test' })
      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect((result.error as Error).message).toBe('Network error')
      }
    })

    it('should build query with optional parameters', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ Response: 'True', imdbID: 'tt1234567', Title: 'Test' }))
      globalThis.fetch = mockFetch

      await service.fetchOmdbMovieMetadata({ title: 'Test', year: 2024, season: 1, episode: 5 })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('t=Test')
      expect(calledUrl).toContain('y=2024')
      expect(calledUrl).toContain('Season=1')
      expect(calledUrl).toContain('Episode=5')
    })
  })

  describe('fetchOmdbMovieMetadataByImdbId', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      expect(result.status).toBe('not-configured')
    })

    it('should return success with movie metadata', async () => {
      expect.assertions(2)

      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          imdbID: 'tt1234567',
          Title: 'Test Movie',
          Year: '2024',
          Type: 'movie',
        }),
      )

      const result = await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.imdbID).toBe('tt1234567')
      }
    })

    it('should use i= parameter in the URL', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ Response: 'True', imdbID: 'tt1234567', Title: 'Test' }))
      globalThis.fetch = mockFetch

      await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('i=tt1234567')
      expect(calledUrl).toContain('plot=full')
      expect(calledUrl).not.toContain('&t=')
    })

    it('should return not-found for Incorrect IMDb ID', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'False',
          Error: 'Incorrect IMDb ID.',
        }),
      )

      const result = await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'invalid' })
      expect(result.status).toBe('not-found')
    })

    it('should return error when response is missing imdbID', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          Title: 'Test Movie',
        }),
      )

      const result = await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      expect(result.status).toBe('error')
    })

    it('should return error when fetch throws', async () => {
      expect.assertions(2)

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect((result.error as Error).message).toBe('Network error')
      }
    })
  })

  describe('fetchOmdbSeriesMetadata', () => {
    it('should return not-configured when config is missing', async () => {
      service.config = undefined
      const result = await service.fetchOmdbSeriesMetadata({ imdbId: 'tt1234567' })
      expect(result.status).toBe('not-configured')
    })

    it('should return success with series metadata', async () => {
      expect.assertions(2)

      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          imdbID: 'tt1234567',
          Title: 'Test Series',
          Type: 'series',
        }),
      )

      const result = await service.fetchOmdbSeriesMetadata({ imdbId: 'tt1234567' })
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data.imdbID).toBe('tt1234567')
      }
    })

    it('should return not-found for Incorrect IMDb ID', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'False',
          Error: 'Incorrect IMDb ID.',
        }),
      )

      const result = await service.fetchOmdbSeriesMetadata({ imdbId: 'invalid' })
      expect(result.status).toBe('not-found')
    })
  })

  describe('request deduplication', () => {
    it('should deduplicate concurrent requests for the same URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          imdbID: 'tt1234567',
          Title: 'Test Movie',
        }),
      )
      globalThis.fetch = mockFetch

      const [result1, result2] = await Promise.all([
        service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' }),
        service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' }),
      ])

      expect(result1.status).toBe('success')
      expect(result2.status).toBe('success')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should make separate requests for different URLs', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          imdbID: 'tt1234567',
          Title: 'Test Movie',
        }),
      )
      globalThis.fetch = mockFetch

      await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1111111' })
      await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt2222222' })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should make a fresh request after the previous one completes', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          Response: 'True',
          imdbID: 'tt1234567',
          Title: 'Test Movie',
        }),
      )
      globalThis.fetch = mockFetch

      await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })
      await service.fetchOmdbMovieMetadataByImdbId({ imdbId: 'tt1234567' })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('rate limit handling', () => {
    it('should return rate-limited after exhausting retries', async () => {
      vi.useFakeTimers()

      const rateLimitResponse = createMockResponse({
        Response: 'False',
        Error: 'Request limit reached!',
      })

      globalThis.fetch = vi.fn().mockResolvedValue(rateLimitResponse)

      const resultPromise = service.fetchOmdbMovieMetadata({ title: 'Test' })

      // Advance past all retry backoff timers
      for (let i = 0; i < 4; i++) {
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

      const rateLimitResponse = createMockResponse({
        Response: 'False',
        Error: 'Request limit reached!',
      })
      const successResponse = createMockResponse({
        Response: 'True',
        imdbID: 'tt1234567',
        Title: 'Test',
      })

      const mockFetch = vi.fn().mockResolvedValueOnce(rateLimitResponse).mockResolvedValueOnce(successResponse)

      globalThis.fetch = mockFetch

      const resultPromise = service.fetchOmdbMovieMetadata({ title: 'Test' })

      await vi.advanceTimersByTimeAsync(10_000)

      const result = await resultPromise
      expect(result.status).toBe('success')
      expect(mockFetch).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })
})
