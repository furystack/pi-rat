import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { Semaphore, sleepAsync } from '@furystack/utils'
import type { OmdbConfig, OmdbMovieMetadata, OmdbSeriesMetadata, PiRatFile } from 'common'
import { Config } from 'common'

import { type ConfigWatcher, createConfigWatcher } from '../../../utils/config-watcher.js'
import type { MetadataFetchResult } from './metadata-fetch-result.js'

const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 5_000
const MAX_BACKOFF_MS = 60_000

const isRateLimitResponse = (body: Record<string, unknown>): boolean =>
  body.Response === 'False' && typeof body.Error === 'string' && body.Error.includes('limit reached')

const isNotFoundResponse = (body: Record<string, unknown>): boolean =>
  body.Response === 'False' &&
  typeof body.Error === 'string' &&
  (body.Error.includes('not found') || body.Error.includes('Not found') || body.Error.includes('Incorrect IMDb ID'))

const isErrorResponse = (body: Record<string, unknown>): boolean =>
  body.Response === 'False' && typeof body.Error === 'string' && !isRateLimitResponse(body) && !isNotFoundResponse(body)

@Injectable({ lifetime: 'singleton' })
export class OmdbClientService {
  public config?: OmdbConfig

  @Injected((injector) => getLogger(injector).withScope('OMDB Client Service'))
  declare private logger: ScopedLogger

  @Injected((injector) => getDataSetFor(injector, Config, 'id'))
  declare private configDataSet: DataSet<Config, 'id'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'omdb-service' }))
  declare private systemInjector: Injector

  private readonly semaphore = new Semaphore(1)
  private readonly pendingRequests = new Map<string, Promise<MetadataFetchResult<unknown>>>()

  private configWatcher?: ConfigWatcher

  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize OMDB Client Service', data: { error } })
    })
  }

  private async initAsync() {
    this.configWatcher?.dispose()
    this.configWatcher = createConfigWatcher<OmdbConfig>({
      configDataSet: this.configDataSet,
      systemInjector: this.systemInjector,
      logger: this.logger,
      configId: 'OMDB_CONFIG',
      serviceName: 'OMDB Service',
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
    this.pendingRequests.set(key, promise)

    return promise.finally(() => {
      this.pendingRequests.delete(key)
    })
  }

  private async fetchWithRetry(
    url: string,
    context: { file?: PiRatFile; description: string },
  ): Promise<MetadataFetchResult<Record<string, unknown>>> {
    let backoffMs = INITIAL_BACKOFF_MS

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url)
      if (!response.ok) {
        return { status: 'error', error: new Error(`HTTP ${response.status}: ${response.statusText}`) }
      }
      const body = (await response.json()) as Record<string, unknown>

      if (isRateLimitResponse(body)) {
        if (attempt < MAX_RETRIES) {
          await this.logger.warning({
            message: `⏳  OMDB rate limit reached for ${context.description}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            data: { file: context.file },
          })
          await sleepAsync(backoffMs)
          backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
          continue
        }
        await this.logger.warning({
          message: `🚫  OMDB rate limit reached for ${context.description}, all retries exhausted`,
          data: { file: context.file },
        })
        return { status: 'rate-limited' }
      }

      if (isNotFoundResponse(body)) {
        return { status: 'not-found' }
      }

      if (isErrorResponse(body)) {
        return { status: 'error', error: new Error(`OMDB API error: ${String(body.Error)}`) }
      }

      return { status: 'success', data: body }
    }

    return { status: 'rate-limited' }
  }

  public async fetchOmdbMovieMetadata(
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
  ): Promise<MetadataFetchResult<OmdbMovieMetadata>> {
    if (!this.config) {
      await this.logger.error({
        message: '🚫   OMDB Service is not initialized, cannot fetch movie metadata',
        data: { file: context?.file },
      })
      return { status: 'not-configured' }
    }

    const query = [
      `t=${encodeURIComponent(title)}`,
      ...(year ? [`y=${year}`] : []),
      ...(season ? [`Season=${season}`] : []),
      ...(episode ? [`Episode=${episode}`] : []),
      'plot=full',
    ].join('&')

    const url = `http://www.omdbapi.com/?apikey=${this.config.value.apiKey}&${query}`
    const description = `movie '${title}'${year ? ` (${year})` : ''}`

    try {
      return await this.fetchWithDedup<OmdbMovieMetadata>(url, async () => {
        const result = await this.fetchWithRetry(url, { file: context?.file, description })
        if (result.status === 'success') {
          if (typeof result.data.imdbID !== 'string') {
            return { status: 'error', error: new Error(`Invalid OMDB response: missing imdbID`) }
          }
          return { status: 'success' as const, data: result.data as unknown as OmdbMovieMetadata }
        }
        return result
      })
    } catch (error) {
      await this.logger.warning({
        message: `❗  Failed to fetch OMDB Movie metadata for ${description}`,
        data: { error, title, year, season, episode, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  public async fetchOmdbMovieMetadataByImdbId(
    { imdbId }: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<MetadataFetchResult<OmdbMovieMetadata>> {
    if (!this.config) {
      await this.logger.error({
        message: '🚫   OMDB Service is not initialized, cannot fetch movie metadata',
        data: { file: context?.file },
      })
      return { status: 'not-configured' }
    }

    const query = [`i=${imdbId}`, 'plot=full'].join('&')
    const url = `http://www.omdbapi.com/?apikey=${this.config.value.apiKey}&${query}`
    const description = `movie by IMDB ID '${imdbId}'`

    try {
      return await this.fetchWithDedup<OmdbMovieMetadata>(url, async () => {
        const result = await this.fetchWithRetry(url, { file: context?.file, description })
        if (result.status === 'success') {
          if (typeof result.data.imdbID !== 'string') {
            return { status: 'error', error: new Error(`Invalid OMDB response: missing imdbID`) }
          }
          return { status: 'success' as const, data: result.data as unknown as OmdbMovieMetadata }
        }
        return result
      })
    } catch (error) {
      await this.logger.warning({
        message: `❗  Failed to fetch OMDB Movie metadata for ${description}`,
        data: { error, imdbId, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  public async fetchOmdbSeriesMetadata(
    { imdbId }: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<MetadataFetchResult<OmdbSeriesMetadata>> {
    if (!this.config) {
      await this.logger.error({
        message: '🚫   OMDB Service is not initialized, cannot fetch series metadata',
        data: { file: context?.file },
      })
      return { status: 'not-configured' }
    }
    const query = [`i=${imdbId}`, 'plot=full'].join('&')
    const url = `http://www.omdbapi.com/?apikey=${this.config.value.apiKey}&${query}`
    const description = `series '${imdbId}'`

    try {
      return await this.fetchWithDedup<OmdbSeriesMetadata>(url, async () => {
        const result = await this.fetchWithRetry(url, { file: context?.file, description })
        if (result.status === 'success') {
          if (typeof result.data.imdbID !== 'string') {
            return { status: 'error', error: new Error(`Invalid OMDB response: missing imdbID`) }
          }
          return { status: 'success' as const, data: result.data as unknown as OmdbSeriesMetadata }
        }
        return result
      })
    } catch (error) {
      await this.logger.warning({
        message: `❗  Failed to fetch OMDB Series metadata for ${description}`,
        data: { error, imdbId, file: context?.file },
      })
      return { status: 'error', error }
    }
  }
}
