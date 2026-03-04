import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { Semaphore, sleepAsync } from '@furystack/utils'
import type { OmdbConfig, OmdbMovieMetadata, OmdbSeriesMetadata, PiRatFile } from 'common'
import { Config } from 'common'

export type OmdbFetchResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found' }
  | { status: 'rate-limited' }
  | { status: 'not-configured' }
  | { status: 'error'; error: unknown }

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

  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize OMDB Client Service', data: { error } })
    })
  }

  private async initAsync() {
    const config = await this.configDataSet.get(this.systemInjector, 'OMDB_CONFIG')
    if (!config) {
      this.config = undefined
      await this.logger.information({
        message: '🚫   No config found, OMDB Service will not be initialized',
      })
    } else {
      this.config = config as OmdbConfig
      await this.logger.verbose({
        message: '✅   OMDB Service initialized',
      })
    }

    this.configDataSet.subscribe('onEntityAdded', ({ entity }) => {
      if (entity.id === 'OMDB_CONFIG') {
        this.config = entity as OmdbConfig
      }
      void this.logger.information({
        message: `🎬   OMDB Service config added`,
      })
    })
    this.configDataSet.subscribe('onEntityUpdated', ({ change }) => {
      if (change.id === 'OMDB_CONFIG') {
        this.config = {
          ...this.config,
          ...change,
        } as OmdbConfig
        void this.logger.information({
          message: `🎬   OMDB Service config updated`,
          data: change,
        })
      }
    })

    this.configDataSet.subscribe('onEntityRemoved', ({ key }) => {
      if (key === 'OMDB_CONFIG') {
        this.config = undefined
        void this.logger.information({
          message: '🚫   OMDB Service config removed, service will not be able to fetch metadata',
        })
      }
    })
  }

  private async fetchWithRetry(
    url: string,
    context: { file?: PiRatFile; description: string },
  ): Promise<OmdbFetchResult<Record<string, unknown>>> {
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
  ): Promise<OmdbFetchResult<OmdbMovieMetadata>> {
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
      return await this.semaphore.execute(async () => {
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

  public async fetchOmdbSeriesMetadata(
    { imdbId }: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<OmdbFetchResult<OmdbSeriesMetadata>> {
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
      return await this.semaphore.execute(async () => {
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
