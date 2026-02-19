import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import type { OmdbConfig, OmdbMovieMetadata, OmdbSeriesMetadata } from 'common'
import { Config } from 'common'

@Injectable({ lifetime: 'singleton' })
export class OmdbClientService {
  public config?: OmdbConfig

  @Injected((injector) => getLogger(injector).withScope('OMDB Client Service'))
  declare private logger: ScopedLogger

  @Injected((injector) => getDataSetFor(injector, Config, 'id'))
  declare private configDataSet: DataSet<Config, 'id'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'omdb-service' }))
  declare private systemInjector: Injector

  public async init() {
    const config = await this.configDataSet.get(this.systemInjector, 'OMDB_CONFIG')
    if (!config) {
      this.config = undefined
      await this.logger.information({
        message: '🚫   No config found, OMDB Service will not be initialized',
      })
    } else {
      await this.logger.verbose({
        message: '✅   OMDB Service initialized',
      })
    }
    this.config = config as OmdbConfig

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
      await this.logger.error({
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
      await this.logger.warning({
        message: `❗  Failed to fetch OMDB Movie metadata`,
        data: { error, title, year, season, episode },
      })
      return undefined
    }
  }

  public async fetchOmdbSeriesMetadata({ imdbId }: { imdbId: string }): Promise<OmdbSeriesMetadata | undefined> {
    if (!this.config) {
      await this.logger.error({
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
      await this.logger.warning({ message: `❗  Failed to fetch OMDB Series metadata`, data: { error, imdbId } })
      return undefined
    }
  }
}
