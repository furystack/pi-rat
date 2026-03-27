import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { Semaphore, sleepAsync } from '@furystack/utils'
import type { TmdbConfig, PiRatFile } from 'common'
import { Config } from 'common'

import { type ConfigWatcher, createConfigWatcher } from '../../../utils/config-watcher.js'
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

@Injectable({ lifetime: 'singleton' })
export class TmdbClientService {
  public config?: TmdbConfig

  @Injected((injector) => getLogger(injector).withScope('TMDB Client Service'))
  declare private logger: ScopedLogger

  @Injected((injector) => getDataSetFor(injector, Config, 'id'))
  declare private configDataSet: DataSet<Config, 'id'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'tmdb-service' }))
  declare private systemInjector: Injector

  private readonly semaphore = new Semaphore(1)
  private readonly pendingRequests = new Map<string, Promise<MetadataFetchResult<unknown>>>()

  private configWatcher?: ConfigWatcher

  private getLanguage(override?: string): string {
    return override ?? this.config?.value.defaultLanguage ?? 'en-US'
  }

  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize TMDB Client Service', data: { error } })
    })
  }

  private async initAsync() {
    this.configWatcher?.dispose()
    this.configWatcher = createConfigWatcher<TmdbConfig>({
      configDataSet: this.configDataSet,
      systemInjector: this.systemInjector,
      logger: this.logger,
      configId: 'TMDB_CONFIG',
      serviceName: 'TMDB Service',
      onChange: (config) => {
        this.config = config
      },
    })
    await this.configWatcher.init()
  }

  private fetchWithDedup<T>(
    key: string,
    fetcher: () => Promise<MetadataFetchResult<T>>,
  ): Promise<MetadataFetchResult<T>> {
    const pending = this.pendingRequests.get(key)
    if (pending) return pending as Promise<MetadataFetchResult<T>>

    const promise = this.semaphore.execute(fetcher)
    this.pendingRequests.set(key, promise as Promise<MetadataFetchResult<unknown>>)

    return promise.finally(() => {
      this.pendingRequests.delete(key)
    })
  }

  private async fetchJson<T>(
    path: string,
    context: { file?: PiRatFile; description: string },
  ): Promise<MetadataFetchResult<T>> {
    if (!this.config) {
      return { status: 'not-configured' }
    }

    let backoffMs = INITIAL_BACKOFF_MS

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(`${TMDB_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${this.config.value.apiKey}`,
          Accept: 'application/json',
        },
      })

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After')
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoffMs
          await this.logger.warning({
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

  // ── Low-level endpoint methods ─────────────────────────────────────

  public async searchMovie(
    title: string,
    options?: { year?: number; language?: string },
  ): Promise<MetadataFetchResult<TmdbPaginatedResponse<TmdbSearchMovieResult>>> {
    const params = new URLSearchParams({
      query: title,
      language: this.getLanguage(options?.language),
    })
    if (options?.year) params.set('year', String(options.year))

    const path = `/search/movie?${params}`
    return this.fetchWithDedup(path, () => this.fetchJson(path, { description: `search movie '${title}'` }))
  }

  public async searchTv(
    title: string,
    options?: { language?: string },
  ): Promise<MetadataFetchResult<TmdbPaginatedResponse<TmdbSearchTvResult>>> {
    const params = new URLSearchParams({
      query: title,
      language: this.getLanguage(options?.language),
    })

    const path = `/search/tv?${params}`
    return this.fetchWithDedup(path, () => this.fetchJson(path, { description: `search tv '${title}'` }))
  }

  public async getMovieDetails(
    tmdbId: number,
    options?: { language?: string },
  ): Promise<MetadataFetchResult<TmdbMovieDetailsResponse>> {
    const params = new URLSearchParams({
      language: this.getLanguage(options?.language),
      append_to_response: 'external_ids',
    })

    const path = `/movie/${tmdbId}?${params}`
    return this.fetchWithDedup(path, () => this.fetchJson(path, { description: `movie details #${tmdbId}` }))
  }

  public async getTvDetails(
    tmdbId: number,
    options?: { language?: string },
  ): Promise<MetadataFetchResult<TmdbTvDetailsResponse>> {
    const params = new URLSearchParams({
      language: this.getLanguage(options?.language),
      append_to_response: 'external_ids',
    })

    const path = `/tv/${tmdbId}?${params}`
    return this.fetchWithDedup(path, () => this.fetchJson(path, { description: `tv details #${tmdbId}` }))
  }

  public async getEpisodeDetails(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number,
    options?: { language?: string },
  ): Promise<MetadataFetchResult<TmdbEpisodeDetailsResponse>> {
    const params = new URLSearchParams({
      language: this.getLanguage(options?.language),
      append_to_response: 'external_ids',
    })

    const path = `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?${params}`
    return this.fetchWithDedup(path, () =>
      this.fetchJson(path, { description: `episode S${seasonNumber}E${episodeNumber} of tv #${tvId}` }),
    )
  }

  public async findByImdbId(imdbId: string): Promise<MetadataFetchResult<TmdbFindByIdResponse>> {
    const params = new URLSearchParams({
      external_source: 'imdb_id',
      language: this.getLanguage(),
    })

    const path = `/find/${imdbId}?${params}`
    return this.fetchWithDedup(path, () => this.fetchJson(path, { description: `find by IMDB ID '${imdbId}'` }))
  }

  // ── High-level orchestration methods ───────────────────────────────

  /**
   * Searches for a movie or episode on TMDB by title, year, season, and episode.
   * For episodes (season+episode present): searches TV -> fetches series -> fetches episode.
   * For movies: searches movie -> fetches details.
   * Skips results without an imdb_id (D1).
   */
  public async fetchTmdbMovieMetadata(
    {
      title,
      year,
      season,
      episode,
    }: {
      title: string
      year?: number
      season?: number
      episode?: number
    },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  > {
    if (!this.config) {
      return { status: 'not-configured' }
    }

    try {
      if (season != null && episode != null) {
        return await this.fetchEpisodeMetadata({ title, season, episode }, context)
      }
      return await this.fetchMovieOnlyMetadata({ title, year }, context)
    } catch (error) {
      await this.logger.warning({
        message: `❗  Failed to fetch TMDB metadata for '${title}'`,
        data: { error, title, year, season, episode, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  private async fetchEpisodeMetadata(
    { title, season, episode }: { title: string; season: number; episode: number },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  > {
    const searchResult = await this.searchTv(title)
    if (searchResult.status !== 'success') return searchResult
    if (searchResult.data.results.length === 0) return { status: 'not-found' }

    const tvId = searchResult.data.results[0].id
    const tvResult = await this.getTvDetails(tvId)
    if (tvResult.status !== 'success') return tvResult

    const seriesImdbId = tvResult.data.external_ids?.imdb_id
    if (!seriesImdbId) {
      await this.logger.debug({
        message: `TMDB TV #${tvId} has no IMDB ID, skipping (D1)`,
        data: { file: context?.file },
      })
      return { status: 'not-found' }
    }

    const episodeResult = await this.getEpisodeDetails(tvId, season, episode)
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

  private async fetchMovieOnlyMetadata(
    { title, year }: { title: string; year?: number },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  > {
    const searchResult = await this.searchMovie(title, { year })
    if (searchResult.status !== 'success') return searchResult
    if (searchResult.data.results.length === 0) return { status: 'not-found' }

    const movieId = searchResult.data.results[0].id
    const detailResult = await this.getMovieDetails(movieId)
    if (detailResult.status !== 'success') return detailResult

    const imdbId = detailResult.data.imdb_id ?? detailResult.data.external_ids?.imdb_id
    if (!imdbId) {
      await this.logger.debug({
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

  /**
   * Fetches movie/episode metadata from TMDB using an IMDB ID.
   * Uses /find to bridge IMDB -> TMDB, then fetches full details.
   * For movies: resolves via movie_results.
   * For episodes: resolves via tv_results + season/episode params.
   */
  public async fetchTmdbMovieMetadataByImdbId(
    {
      imdbId,
      season,
      episode,
    }: {
      imdbId: string
      season?: number
      episode?: number
    },
    context?: { file?: PiRatFile },
  ): Promise<
    MetadataFetchResult<{
      movie: TmdbMovieDetailsResponse
      episode?: TmdbEpisodeDetailsResponse
      series?: TmdbTvDetailsResponse
    }>
  > {
    if (!this.config) {
      return { status: 'not-configured' }
    }

    try {
      const findResult = await this.findByImdbId(imdbId)
      if (findResult.status !== 'success') return findResult

      if (findResult.data.movie_results.length > 0) {
        const tmdbId = findResult.data.movie_results[0].id
        const detailResult = await this.getMovieDetails(tmdbId)
        if (detailResult.status !== 'success') return detailResult

        return {
          status: 'success',
          data: { movie: { ...detailResult.data, imdb_id: imdbId } },
        }
      }

      if (findResult.data.tv_results.length > 0) {
        const tvId = findResult.data.tv_results[0].id
        const tvResult = await this.getTvDetails(tvId)
        if (tvResult.status !== 'success') return tvResult

        const seriesImdbId = tvResult.data.external_ids?.imdb_id ?? imdbId

        if (season != null && episode != null) {
          const episodeResult = await this.getEpisodeDetails(tvId, season, episode)
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
      await this.logger.warning({
        message: `❗  Failed to fetch TMDB metadata by IMDB ID '${imdbId}'`,
        data: { error, imdbId, season, episode, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  /**
   * Fetches series metadata from TMDB using an IMDB ID.
   * Uses /find to bridge IMDB -> TMDB, then fetches full TV details.
   */
  public async fetchTmdbSeriesMetadata(
    { imdbId }: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<MetadataFetchResult<TmdbTvDetailsResponse>> {
    if (!this.config) {
      return { status: 'not-configured' }
    }

    try {
      const findResult = await this.findByImdbId(imdbId)
      if (findResult.status !== 'success') return findResult
      if (findResult.data.tv_results.length === 0) return { status: 'not-found' }

      const tmdbId = findResult.data.tv_results[0].id
      return await this.getTvDetails(tmdbId)
    } catch (error) {
      await this.logger.warning({
        message: `❗  Failed to fetch TMDB Series metadata for '${imdbId}'`,
        data: { error, imdbId, file: context?.file },
      })
      return { status: 'error', error }
    }
  }
}
