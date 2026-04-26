import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger, type ScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { Semaphore, sleepAsync } from '@furystack/utils'
import type { OmdbConfig, OmdbMovieMetadata, OmdbSeriesMetadata, PiRatFile } from 'common'

import { createConfigWatcher } from '../../../utils/config-watcher.js'
import { ConfigDataSet } from '../../config/setup-config-store.js'
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

export interface OmdbClientService {
  config?: OmdbConfig
  fetchOmdbMovieMetadata(
    args: { title: string; year?: number; season?: number; episode?: number },
    context?: { file?: PiRatFile },
  ): Promise<MetadataFetchResult<OmdbMovieMetadata>>
  fetchOmdbMovieMetadataByImdbId(
    args: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<MetadataFetchResult<OmdbMovieMetadata>>
  fetchOmdbSeriesMetadata(
    args: { imdbId: string },
    context?: { file?: PiRatFile },
  ): Promise<MetadataFetchResult<OmdbSeriesMetadata>>
}

export type CreateOmdbClientServiceOptions = {
  logger: ScopedLogger
  systemInjector?: Injector
  semaphore?: Pick<Semaphore, 'execute'>
  initialConfig?: OmdbConfig
}

export const createOmdbClientService = (options: CreateOmdbClientServiceOptions): OmdbClientService & Disposable => {
  const { logger } = options
  const semaphore = options.semaphore ?? new Semaphore(1)
  const pendingRequests = new Map<string, Promise<MetadataFetchResult<unknown>>>()

  const service: OmdbClientService & Disposable = {
    config: options.initialConfig,
    fetchOmdbMovieMetadata: async () => ({ status: 'not-configured' }),
    fetchOmdbMovieMetadataByImdbId: async () => ({ status: 'not-configured' }),
    fetchOmdbSeriesMetadata: async () => ({ status: 'not-configured' }),
    [Symbol.dispose]: () => {},
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

  const fetchWithRetry = async (
    url: string,
    context: { file?: PiRatFile; description: string },
  ): Promise<MetadataFetchResult<Record<string, unknown>>> => {
    let backoffMs = INITIAL_BACKOFF_MS

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url)
      if (!response.ok) {
        return { status: 'error', error: new Error(`HTTP ${response.status}: ${response.statusText}`) }
      }
      const body = (await response.json()) as Record<string, unknown>

      if (isRateLimitResponse(body)) {
        if (attempt < MAX_RETRIES) {
          await logger.warning({
            message: `⏳  OMDB rate limit reached for ${context.description}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            data: { file: context.file },
          })
          await sleepAsync(backoffMs)
          backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
          continue
        }
        await logger.warning({
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

  service.fetchOmdbMovieMetadata = async ({ title, year, season, episode }, context) => {
    if (!service.config) {
      await logger.error({
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

    const url = `http://www.omdbapi.com/?apikey=${service.config.value.apiKey}&${query}`
    const description = `movie '${title}'${year ? ` (${year})` : ''}`

    try {
      return await fetchWithDedup<OmdbMovieMetadata>(url, async () => {
        const result = await fetchWithRetry(url, { file: context?.file, description })
        if (result.status === 'success') {
          if (typeof result.data.imdbID !== 'string') {
            return { status: 'error', error: new Error(`Invalid OMDB response: missing imdbID`) }
          }
          return { status: 'success' as const, data: result.data as unknown as OmdbMovieMetadata }
        }
        return result
      })
    } catch (error) {
      await logger.warning({
        message: `❗  Failed to fetch OMDB Movie metadata for ${description}`,
        data: { error, title, year, season, episode, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  service.fetchOmdbMovieMetadataByImdbId = async ({ imdbId }, context) => {
    if (!service.config) {
      await logger.error({
        message: '🚫   OMDB Service is not initialized, cannot fetch movie metadata',
        data: { file: context?.file },
      })
      return { status: 'not-configured' }
    }

    const query = [`i=${imdbId}`, 'plot=full'].join('&')
    const url = `http://www.omdbapi.com/?apikey=${service.config.value.apiKey}&${query}`
    const description = `movie by IMDB ID '${imdbId}'`

    try {
      return await fetchWithDedup<OmdbMovieMetadata>(url, async () => {
        const result = await fetchWithRetry(url, { file: context?.file, description })
        if (result.status === 'success') {
          if (typeof result.data.imdbID !== 'string') {
            return { status: 'error', error: new Error(`Invalid OMDB response: missing imdbID`) }
          }
          return { status: 'success' as const, data: result.data as unknown as OmdbMovieMetadata }
        }
        return result
      })
    } catch (error) {
      await logger.warning({
        message: `❗  Failed to fetch OMDB Movie metadata for ${description}`,
        data: { error, imdbId, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  service.fetchOmdbSeriesMetadata = async ({ imdbId }, context) => {
    if (!service.config) {
      await logger.error({
        message: '🚫   OMDB Service is not initialized, cannot fetch series metadata',
        data: { file: context?.file },
      })
      return { status: 'not-configured' }
    }
    const query = [`i=${imdbId}`, 'plot=full'].join('&')
    const url = `http://www.omdbapi.com/?apikey=${service.config.value.apiKey}&${query}`
    const description = `series '${imdbId}'`

    try {
      return await fetchWithDedup<OmdbSeriesMetadata>(url, async () => {
        const result = await fetchWithRetry(url, { file: context?.file, description })
        if (result.status === 'success') {
          if (typeof result.data.imdbID !== 'string') {
            return { status: 'error', error: new Error(`Invalid OMDB response: missing imdbID`) }
          }
          return { status: 'success' as const, data: result.data as unknown as OmdbSeriesMetadata }
        }
        return result
      })
    } catch (error) {
      await logger.warning({
        message: `❗  Failed to fetch OMDB Series metadata for ${description}`,
        data: { error, imdbId, file: context?.file },
      })
      return { status: 'error', error }
    }
  }

  if (options.systemInjector) {
    const { systemInjector } = options
    const configWatcher = createConfigWatcher<OmdbConfig>({
      configDataSet: getDataSetFor(systemInjector, ConfigDataSet),
      systemInjector,
      logger,
      configId: 'OMDB_CONFIG',
      serviceName: 'OMDB Service',
      onChange: (config) => {
        service.config = config
      },
    })

    void configWatcher.init().catch((error) => {
      void logger.error({ message: 'Failed to initialize OMDB Client Service', data: { error } })
    })

    service[Symbol.dispose] = () => configWatcher.dispose()
  }

  return service
}

export const OmdbClientService: Token<OmdbClientService, 'singleton'> = defineService({
  name: 'pi-rat/OmdbClientService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'omdb-service' })
    const service = createOmdbClientService({ logger, systemInjector })

    onDispose(() => service[Symbol.dispose]())
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    return service
  },
})
