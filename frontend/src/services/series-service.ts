import { Injectable, Injected } from '@furystack/inject'
import { MediaApiClient } from './api-clients/media-api-client.js'
import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import type { Series } from 'common'

@Injectable({ lifetime: 'singleton' })
export class SeriesService {
  @Injected(MediaApiClient)
  private readonly mediaApiClient!: MediaApiClient

  public seriesCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/series/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  public seriesQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<Series, Array<keyof Series>>) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/series',
        query: {
          findOptions,
        },
      })

      result.entries.forEach((entry) => {
        this.seriesCache.setExplicitValue({
          loadArgs: [entry.imdbId],
          value: { status: 'loaded', value: entry, updatedAt: new Date() },
        })
      })

      return result
    },
  })

  public getSeries = this.seriesCache.get.bind(this.seriesCache)

  public getSeriesAsObservable = this.seriesCache.getObservable.bind(this.seriesCache)

  public findSeries = this.seriesQueryCache.get.bind(this.seriesQueryCache)

  public findSeriesAsObservable = this.seriesQueryCache.getObservable.bind(this.seriesQueryCache)
}
