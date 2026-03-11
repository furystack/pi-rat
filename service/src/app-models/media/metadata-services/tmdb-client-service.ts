import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { Semaphore, sleepAsync } from '@furystack/utils'
import type { TmdbConfig, PiRatFile } from 'common'
import { Config } from 'common'

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

export type TmdbFetchResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found' }
  | { status: 'rate-limited' }
  | { status: 'not-configured' }
  | { status: 'error'; error: unknown }

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

  private getLanguage(override?: string): string {
    return override ?? this.config?.value.defaultLanguage ?? 'en-US'
  }

  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize TMDB Client Service', data: { error } })
    })
  }

  private configSubscriptions: Disposable[] = []

  private async initAsync() {
    for (const sub of this.configSubscriptions) {
      sub[Symbol.dispose]()
    }
    this.configSubscriptions = []

    const config = await this.configDataSet.get(this.systemInjector, 'TMDB_CONFIG')
    if (!config) {
      this.config = undefined
      await this.logger.information({
        message: '🚫   No config found, TMDB Service will not be initialized',
      })
    } else {
      this.config = config as TmdbConfig
      await this.logger.verbose({
        message: '✅   TMDB Service initialized',
      })
    }

    this.configSubscriptions.push(
      this.configDataSet.subscribe('onEntityAdded', ({ entity }) => {
        if (entity.id === 'TMDB_CONFIG') {
          this.config = entity as TmdbConfig
          void this.logger.information({
            message: `🎬   TMDB Service config added`,
          })
        }
      }),
      this.configDataSet.subscribe('onEntityUpdated', ({ change }) => {
        if (change.id === 'TMDB_CONFIG') {
          this.config = {
            ...this.config,
            ...change,
          } as TmdbConfig
          void this.logger.information({
            message: `🎬   TMDB Service config updated`,
            data: change,
          })
        }
      }),
      this.configDataSet.subscribe('onEntityRemoved', ({ key }) => {
        if (key === 'TMDB_CONFIG') {
          this.config = undefined
          void this.logger.information({
            message: '🚫   TMDB Service config removed, service will not be able to fetch metadata',
          })
        }
      }),
    )
  }

  private async fetchJson<T>(
    path: string,
    context: { file?: PiRatFile; description: string },
  ): Promise<TmdbFetchResult<T>> {
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
  ): Promise<TmdbFetchResult<TmdbPaginatedResponse<TmdbSearchMovieResult>>> {
    const params = new URLSearchParams({
      query: title,
      language: this.getLanguage(options?.language),
    })
    if (options?.year) params.set('year', String(options.year))

    return this.semaphore.execute(() =>
      this.fetchJson(`/search/movie?${params}`, { description: `search movie '${title}'` }),
    )
  }

  public async searchTv(
    title: string,
    options?: { language?: string },
  ): Promise<TmdbFetchResult<TmdbPaginatedResponse<TmdbSearchTvResult>>> {
    const params = new URLSearchParams({
      query: title,
      language: this.getLanguage(options?.language),
    })

    return this.semaphore.execute(() => this.fetchJson(`/search/tv?${params}`, { description: `search tv '${title}'` }))
  }

  public async getMovieDetails(
    tmdbId: number,
    options?: { language?: string },
  ): Promise<TmdbFetchResult<TmdbMovieDetailsResponse>> {
    const params = new URLSearchParams({
      language: this.getLanguage(options?.language),
      append_to_response: 'external_ids',
    })

    return this.semaphore.execute(() =>
      this.fetchJson(`/movie/${tmdbId}?${params}`, { description: `movie details #${tmdbId}` }),
    )
  }

  public async getTvDetails(
    tmdbId: number,
    options?: { language?: string },
  ): Promise<TmdbFetchResult<TmdbTvDetailsResponse>> {
    const params = new URLSearchParams({
      language: this.getLanguage(options?.language),
      append_to_response: 'external_ids',
    })

    return this.semaphore.execute(() =>
      this.fetchJson(`/tv/${tmdbId}?${params}`, { description: `tv details #${tmdbId}` }),
    )
  }

  public async getEpisodeDetails(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number,
    options?: { language?: string },
  ): Promise<TmdbFetchResult<TmdbEpisodeDetailsResponse>> {
    const params = new URLSearchParams({
      language: this.getLanguage(options?.language),
    })

    return this.semaphore.execute(() =>
      this.fetchJson(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?${params}`, {
        description: `episode S${seasonNumber}E${episodeNumber} of tv #${tvId}`,
      }),
    )
  }

  public async findByImdbId(imdbId: string): Promise<TmdbFetchResult<TmdbFindByIdResponse>> {
    const params = new URLSearchParams({
      external_source: 'imdb_id',
      language: this.getLanguage(),
    })

    return this.semaphore.execute(() =>
      this.fetchJson(`/find/${imdbId}?${params}`, { description: `find by IMDB ID '${imdbId}'` }),
    )
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
    TmdbFetchResult<{
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
    TmdbFetchResult<{
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

    const imdbId = tvResult.data.external_ids?.imdb_id
    if (!imdbId) {
      await this.logger.debug({
        message: `TMDB TV #${tvId} has no IMDB ID, skipping (D1)`,
        data: { file: context?.file },
      })
      return { status: 'not-found' }
    }

    const episodeResult = await this.getEpisodeDetails(tvId, season, episode)
    if (episodeResult.status !== 'success') return episodeResult

    return {
      status: 'success',
      data: {
        movie: buildSyntheticMovieFromEpisode(tvResult.data, episodeResult.data, imdbId),
        episode: episodeResult.data,
        series: tvResult.data,
      },
    }
  }

  private async fetchMovieOnlyMetadata(
    { title, year }: { title: string; year?: number },
    context?: { file?: PiRatFile },
  ): Promise<
    TmdbFetchResult<{
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
   * Fetches series metadata from TMDB using an IMDB ID.
   * Uses /find to bridge IMDB -> TMDB, then fetches full TV details.
   */
  public async fetchTmdbSeriesMetadata(
    { imdbId }: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<TmdbFetchResult<TmdbTvDetailsResponse>> {
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
