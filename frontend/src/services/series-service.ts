import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { Series } from 'common'
import { MediaApiClient } from './api-clients/media-api-client.js'

class SeriesServiceImpl implements Disposable {
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
        query: { findOptions },
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

  constructor(private readonly mediaApiClient: MediaApiClient) {}

  public getSeries = this.seriesCache.get.bind(this.seriesCache)
  public getSeriesAsObservable = this.seriesCache.getObservable.bind(this.seriesCache)
  public findSeries = this.seriesQueryCache.get.bind(this.seriesQueryCache)
  public findSeriesAsObservable = this.seriesQueryCache.getObservable.bind(this.seriesQueryCache)

  public [Symbol.dispose](): void {
    this.seriesCache[Symbol.dispose]()
    this.seriesQueryCache[Symbol.dispose]()
  }
}

export type SeriesService = SeriesServiceImpl

export const SeriesService: Token<SeriesService, 'singleton'> = defineService({
  name: 'pi-rat/SeriesService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new SeriesServiceImpl(inject(MediaApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
