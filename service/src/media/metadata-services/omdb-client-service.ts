import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import type { OmdbConfig, OmdbMovieMetadata, OmdbSeriesMetadata } from 'common'
import { Config } from 'common'

@Injectable({ lifetime: 'singleton' })
export class OmdbClientService {
  public config?: OmdbConfig

  private logger!: ScopedLogger

  public async init(injector: Injector) {
    this.logger = getLogger(injector).withScope('OMDB Client Service')
    this.logger.verbose({ message: '🎬   Initializing OMDB Service' })
    const config = await getStoreManager(injector)
      .getStoreFor(Config, 'id')
      .find({
        top: 2,
        filter: {
          type: {
            $eq: 'OMDB_CONFIG',
          },
        },
        order: {
          updatedAt: 'DESC',
        },
      })
    if (!config.length) {
      this.logger.information({
        message: '🚫   No config found, OMDB Service will not be initialized',
      })
    } else if (config.length > 1) {
      this.logger.warning({
        message: '⚠️   More than one config found, the last recent one will be used',
      })
    } else {
      this.logger.verbose({
        message: '✅   OMDB Service initialized',
      })
    }
    this.config = config[0] as OmdbConfig

    const dataSet = getDataSetFor(injector, Config, 'id')
    dataSet.onEntityRemoved.subscribe(({ key }) => {
      key === config[0].id && this.init(injector)
    })
    dataSet.onEntityUpdated.subscribe(({ id }) => {
      id === config[0].id && this.init(injector)
    })

    dataSet.onEntityAdded.subscribe(({ entity }) => {
      entity.type === 'OMDB_CONFIG' && this.init(injector)
    })
  }

  public async fetchOmdbMovieMetadata({
    title,
    year,
    season,
    episode,
  }: {
    title: string
    year?: number
    season?: number
    episode?: number
  }): Promise<OmdbMovieMetadata | undefined> {
    if (!this.config) {
      this.logger.error({
        message: '🚫   OMDB Service is not initialized, cannot fetch movie metadata',
      })
      return undefined
    }

    const query = [
      `t=${encodeURIComponent(title)}`,
      ...(year ? [`y=${year}`] : []),
      ...(season ? [`Season=${season}`] : []),
      ...(episode ? [`Episode=${episode}`] : []),
      'plot=full',
    ].join('&')

    try {
      const omdbResult = await fetch(`http://www.omdbapi.com/?apikey=${this.config?.value.apiKey}&${query}`)
      if (!omdbResult.ok) {
        throw new Error('Failed to fetch OMDb data')
      }
      const omdbMeta: OmdbMovieMetadata = await omdbResult.json()
      return omdbMeta
    } catch (error) {
      this.logger.warning({
        message: `❗  Failed to fetch OMDB Movie metadata`,
        data: { error, title, year, season, episode },
      })
      return undefined
    }
  }

  public async fetchOmdbSeriesMetadata({ imdbId }: { imdbId: string }): Promise<OmdbSeriesMetadata | undefined> {
    if (!this.config) {
      this.logger.error({
        message: '🚫   OMDB Service is not initialized, cannot fetch series metadata',
      })
      return undefined
    }
    const query = [`i=${imdbId}`, 'plot=full'].join('&')

    try {
      const omdbResult = await fetch(`http://www.omdbapi.com/?apikey=${this.config?.value.apiKey}&${query}`)
      if (!omdbResult.ok) {
        throw new Error('Failed to fetch OMDb data')
      }
      const omdbMeta: OmdbSeriesMetadata = await omdbResult.json()
      return omdbMeta
    } catch (error) {
      this.logger.warning({ message: `❗  Failed to fetch OMDB Series metadata`, data: { error, imdbId } })
      return undefined
    }
  }
}
