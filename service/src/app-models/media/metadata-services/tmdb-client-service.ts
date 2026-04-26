import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger, type ScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { Semaphore, sleepAsync } from '@furystack/utils'
import type { TmdbConfig, PiRatFile } from 'common'

import { createConfigWatcher } from '../../../utils/config-watcher.js'
import { ConfigDataSet } from '../../config/setup-config-store.js'
import type {
  TmdbMovieDetailsResponse,
  TmdbTvDetailsResponse,
  TmdbEpisodeDetailsResponse,
  TmdbFindByIdResponse,
  TmdbPaginatedResponse,
  TmdbSearchMovieResult,
  TmdbSearchTvResult,
} from './tmdb-api-types.js'
import { buildSyntheticMovieFromEpisode } from './build-synthetic-movie.js'
import type { MetadataFetchResult } from './metadata-fetch-result.js'

const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 2_000
const MAX_BACKOFF_MS = 30_000
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
const DEFAULT_POSTER_SIZE = 'w500'

export const buildTmdbImageUrl = (path: string | null, size = DEFAULT_POSTER_SIZE): string | undefined => {
  if (!path) return undefined
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}

export interface TmdbClientService {
  config?: TmdbConfig
  searchMovie(
    title: string,
    options?: { year?: number; language?: string },
  ): Promise<MetadataFetchResult<TmdbPaginatedResponse<TmdbSearchMovieResult>>>
  searchTv(
    title: string,
    options?: { language?: string },
  ): Promise<MetadataFetchResult<TmdbPaginatedResponse<TmdbSearchTvResult>>>
  getMovieDetails(
    tmdbId: number,
    options?: { language?: string },
  ): Promise<MetadataFetchResult<TmdbMovieDetailsResponse>>
  getTvDetails(tmdbId: number, options?: { language?: string }): Promise<MetadataFetchResult<TmdbTvDetailsResponse>>
  getEpisodeDetails(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number,
    options?: { language?: string },
  ): Promise<MetadataFetchResult<TmdbEpisodeDetailsResponse>>
  findByImdbId(imdbId: string): Promise<MetadataFetchResult<TmdbFindByIdResponse>>
  fetchTmdbMovieMetadata(
    args: { title: string; year?: number; season?: number; episode?: number },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  >
  fetchTmdbMovieMetadataByImdbId(
    args: { imdbId: string; season?: number; episode?: number },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  >
  fetchTmdbSeriesMetadata(
    args: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<MetadataFetchResult<TmdbTvDetailsResponse>>
}

export type CreateTmdbClientServiceOptions = {
  logger: ScopedLogger
  systemInjector?: Injector
  semaphore?: Pick<Semaphore, 'execute'>
  initialConfig?: TmdbConfig
}

export const createTmdbClientService = (options: CreateTmdbClientServiceOptions): TmdbClientService & Disposable => {
  const { logger } = options
  const semaphore = options.semaphore ?? new Semaphore(1)
  const pendingRequests = new Map<string, Promise<MetadataFetchResult<unknown>>>()

  const service: TmdbClientService & Disposable = {
    config: options.initialConfig,
    searchMovie: async () => ({ status: 'not-configured' }),
    searchTv: async () => ({ status: 'not-configured' }),
    getMovieDetails: async () => ({ status: 'not-configured' }),
    getTvDetails: async () => ({ status: 'not-configured' }),
    getEpisodeDetails: async () => ({ status: 'not-configured' }),
    findByImdbId: async () => ({ status: 'not-configured' }),
    fetchTmdbMovieMetadata: async () => ({ status: 'not-configured' }),
    fetchTmdbMovieMetadataByImdbId: async () => ({ status: 'not-configured' }),
    fetchTmdbSeriesMetadata: async () => ({ status: 'not-configured' }),
    [Symbol.dispose]: () => {},
  }

  const getLanguage = (override?: string): string => {
    return override ?? service.config?.value.defaultLanguage ?? 'en-US'
  }

  const fetchWithDedup = <T>(
    key: string,
    fetcher: () => Promise<MetadataFetchResult<T>>,
  ): Promise<MetadataFetchResult<T>> => {
    const pending = pendingRequests.get(key)
    if (pending) return pending as Promise<MetadataFetchResult<T>>

    const promise = semaphore.execute(fetcher)
    pendingRequests.set(key, promise)

    return promise.finally(() => {
      pendingRequests.delete(key)
    })
  }

  const fetchJson = async <T>(
    path: string,
    context: { file?: PiRatFile; description: string },
  ): Promise<MetadataFetchResult<T>> => {
    if (!service.config) {
      return { status: 'not-configured' }
    }

    let backoffMs = INITIAL_BACKOFF_MS

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(`${TMDB_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${service.config.value.apiKey}`,
          Accept: 'application/json',
        },
      })

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After')
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoffMs
          await logger.warning({
            message: `⏳  TMDB rate limit reached for ${context.description}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            data: { file: context.file },
          })
          await sleepAsync(waitMs)
          backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
          continue
        }
        return { status: 'rate-limited' }
      }

      if (response.status === 404) {
        return { status: 'not-found' }
      }

      if (!response.ok) {
        return { status: 'error', error: new Error(`HTTP ${response.status}: ${response.statusText}`) }
      }

      const body = (await response.json()) as T
      return { status: 'success', data: body }
    }

    return { status: 'rate-limited' }
  }

  service.searchMovie = async (title, opts) => {
    const params = new URLSearchParams({
      query: title,
      language: getLanguage(opts?.language),
    })
    if (opts?.year) params.set('year', String(opts.year))

    const path = `/search/movie?${params}`
    return fetchWithDedup(path, () => fetchJson(path, { description: `search movie '${title}'` }))
  }

  service.searchTv = async (title, opts) => {
    const params = new URLSearchParams({
      query: title,
      language: getLanguage(opts?.language),
    })

    const path = `/search/tv?${params}`
    return fetchWithDedup(path, () => fetchJson(path, { description: `search tv '${title}'` }))
  }

  service.getMovieDetails = async (tmdbId, opts) => {
    const params = new URLSearchParams({
      language: getLanguage(opts?.language),
      append_to_response: 'external_ids',
    })

    const path = `/movie/${tmdbId}?${params}`
    return fetchWithDedup(path, () => fetchJson(path, { description: `movie details #${tmdbId}` }))
  }

  service.getTvDetails = async (tmdbId, opts) => {
    const params = new URLSearchParams({
      language: getLanguage(opts?.language),
      append_to_response: 'external_ids',
    })

    const path = `/tv/${tmdbId}?${params}`
    return fetchWithDedup(path, () => fetchJson(path, { description: `tv details #${tmdbId}` }))
  }

  service.getEpisodeDetails = async (tvId, seasonNumber, episodeNumber, opts) => {
    const params = new URLSearchParams({
      language: getLanguage(opts?.language),
      append_to_response: 'external_ids',
    })

    const path = `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?${params}`
    return fetchWithDedup(path, () =>
      fetchJson(path, { description: `episode S${seasonNumber}E${episodeNumber} of tv #${tvId}` }),
    )
  }

  service.findByImdbId = async (imdbId) => {
    const params = new URLSearchParams({
      external_source: 'imdb_id',
      language: getLanguage(),
    })

    const path = `/find/${imdbId}?${params}`
    return fetchWithDedup(path, () => fetchJson(path, { description: `find by IMDB ID '${imdbId}'` }))
  }

  const fetchEpisodeMetadata = async (
    { title, season, episode }: { title: string; season: number; episode: number },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  > => {
    const searchResult = await service.searchTv(title)
    if (searchResult.status !== 'success') return searchResult
    if (searchResult.data.results.length === 0) return { status: 'not-found' }

    const tvId = searchResult.data.results[0].id
    const tvResult = await service.getTvDetails(tvId)
    if (tvResult.status !== 'success') return tvResult

    const seriesImdbId = tvResult.data.external_ids?.imdb_id
    if (!seriesImdbId) {
      await logger.debug({
        message: `TMDB TV #${tvId} has no IMDB ID, skipping (D1)`,
        data: { file: context?.file },
      })
      return { status: 'not-found' }
    }

    const episodeResult = await service.getEpisodeDetails(tvId, season, episode)
    if (episodeResult.status !== 'success') return episodeResult

    const episodeImdbId = episodeResult.data.external_ids?.imdb_id ?? seriesImdbId

    return {
      status: 'success',
      data: {
        movie: buildSyntheticMovieFromEpisode(tvResult.data, episodeResult.data, episodeImdbId),
        episode: episodeResult.data,
        series: tvResult.data,
      },
    }
  }

  const fetchMovieOnlyMetadata = async (
    { title, year }: { title: string; year?: number },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  > => {
    const searchResult = await service.searchMovie(title, { year })
    if (searchResult.status !== 'success') return searchResult
    if (searchResult.data.results.length === 0) return { status: 'not-found' }

    const movieId = searchResult.data.results[0].id
    const detailResult = await service.getMovieDetails(movieId)
    if (detailResult.status !== 'success') return detailResult

    const imdbId = detailResult.data.imdb_id ?? detailResult.data.external_ids?.imdb_id
    if (!imdbId) {
      await logger.debug({
        message: `TMDB movie #${movieId} has no IMDB ID, skipping (D1)`,
        data: { file: context?.file },
      })
      return { status: 'not-found' }
    }

    return {
      status: 'success',
      data: { movie: { ...detailResult.data, imdb_id: imdbId } },
    }
  }

  service.fetchTmdbMovieMetadata = async ({ title, year, season, episode }, context) => {
    if (!service.config) {
      return { status: 'not-configured' }
    }

    try {
      if (season != null && episode != null) {
        return await fetchEpisodeMetadata({ title, season, episode }, context)
      }
      return await fetchMovieOnlyMetadata({ title, year }, context)
    } catch (error) {
      await logger.warning({
        message: `❗  Failed to fetch TMDB metadata for '${title}'`,
        data: { error, title, year, season, episode, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  service.fetchTmdbMovieMetadataByImdbId = async ({ imdbId, season, episode }, context) => {
    if (!service.config) {
      return { status: 'not-configured' }
    }

    try {
      const findResult = await service.findByImdbId(imdbId)
      if (findResult.status !== 'success') return findResult

      if (findResult.data.movie_results.length > 0) {
        const tmdbId = findResult.data.movie_results[0].id
        const detailResult = await service.getMovieDetails(tmdbId)
        if (detailResult.status !== 'success') return detailResult

        return {
          status: 'success',
          data: { movie: { ...detailResult.data, imdb_id: imdbId } },
        }
      }

      if (findResult.data.tv_results.length > 0) {
        const tvId = findResult.data.tv_results[0].id
        const tvResult = await service.getTvDetails(tvId)
        if (tvResult.status !== 'success') return tvResult

        const seriesImdbId = tvResult.data.external_ids?.imdb_id ?? imdbId

        if (season != null && episode != null) {
          const episodeResult = await service.getEpisodeDetails(tvId, season, episode)
          if (episodeResult.status !== 'success') return episodeResult

          const episodeImdbId = episodeResult.data.external_ids?.imdb_id ?? seriesImdbId

          return {
            status: 'success',
            data: {
              movie: buildSyntheticMovieFromEpisode(tvResult.data, episodeResult.data, episodeImdbId),
              episode: episodeResult.data,
              series: tvResult.data,
            },
          }
        }

        return {
          status: 'success',
          data: {
            movie: buildSyntheticMovieFromEpisode(
              tvResult.data,
              {
                air_date: tvResult.data.first_air_date,
                episode_number: 0,
                id: tvResult.data.id,
                name: tvResult.data.name,
                overview: tvResult.data.overview,
                production_code: '',
                runtime: tvResult.data.episode_run_time[0] ?? null,
                season_number: 0,
                still_path: tvResult.data.backdrop_path,
                vote_average: tvResult.data.vote_average,
                vote_count: tvResult.data.vote_count,
                crew: [],
                guest_stars: [],
              },
              seriesImdbId,
            ),
            series: tvResult.data,
          },
        }
      }

      return { status: 'not-found' }
    } catch (error) {
      await logger.warning({
        message: `❗  Failed to fetch TMDB metadata by IMDB ID '${imdbId}'`,
        data: { error, imdbId, season, episode, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  service.fetchTmdbSeriesMetadata = async ({ imdbId }, context) => {
    if (!service.config) {
      return { status: 'not-configured' }
    }

    try {
      const findResult = await service.findByImdbId(imdbId)
      if (findResult.status !== 'success') return findResult
      if (findResult.data.tv_results.length === 0) return { status: 'not-found' }

      const tmdbId = findResult.data.tv_results[0].id
      return await service.getTvDetails(tmdbId)
    } catch (error) {
      await logger.warning({
        message: `❗  Failed to fetch TMDB Series metadata for '${imdbId}'`,
        data: { error, imdbId, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  if (options.systemInjector) {
    const { systemInjector } = options
    const configWatcher = createConfigWatcher<TmdbConfig>({
      configDataSet: getDataSetFor(systemInjector, ConfigDataSet),
      systemInjector,
      logger,
      configId: 'TMDB_CONFIG',
      serviceName: 'TMDB Service',
      onChange: (config) => {
        service.config = config
      },
    })

    void configWatcher.init().catch((error) => {
      void logger.error({ message: 'Failed to initialize TMDB Client Service', data: { error } })
    })

    service[Symbol.dispose] = () => configWatcher.dispose()
  }

  return service
}

export const TmdbClientService: Token<TmdbClientService, 'singleton'> = defineService({
  name: 'pi-rat/TmdbClientService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'tmdb-service' })
    const service = createTmdbClientService({ logger, systemInjector })

    onDispose(() => service[Symbol.dispose]())
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    return service
  },
})
