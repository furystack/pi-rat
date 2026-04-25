import { Injectable, Injected } from '@furystack/inject'
import { Cache } from '@furystack/cache'
import { MediaApiClient } from './api-clients/media-api-client.js'

/**
 * Provides cached access to localized movie/series display data.
 * Uses 'en' as the default language until user language preferences are integrated.
 */
@Injectable({ lifetime: 'singleton' })
export class LocalizedMetadataService implements Disposable {
  @Injected(MediaApiClient)
  declare private readonly mediaApiClient: MediaApiClient

  public movieLocalizedCache = new Cache({
    capacity: 200,
    load: async (movieImdbId: string, language = 'en') => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/movie-metadata-localized',
        query: {
          findOptions: {
            filter: {
              movieImdbId: { $eq: movieImdbId },
              language: { $eq: language },
            },
            top: 1,
          },
        },
      })
      return result.entries[0]
    },
  })

  public seriesLocalizedCache = new Cache({
    capacity: 200,
    load: async (seriesImdbId: string, language = 'en') => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/series-metadata-localized',
        query: {
          findOptions: {
            filter: {
              seriesImdbId: { $eq: seriesImdbId },
              language: { $eq: language },
            },
            top: 1,
          },
        },
      })
      return result.entries[0]
    },
  })

  public getMovieLocalized = this.movieLocalizedCache.get.bind(this.movieLocalizedCache)
  public getMovieLocalizedAsObservable = this.movieLocalizedCache.getObservable.bind(this.movieLocalizedCache)

  public getSeriesLocalized = this.seriesLocalizedCache.get.bind(this.seriesLocalizedCache)
  public getSeriesLocalizedAsObservable = this.seriesLocalizedCache.getObservable.bind(this.seriesLocalizedCache)

  public [Symbol.dispose](): void {
    this.movieLocalizedCache[Symbol.dispose]()
    this.seriesLocalizedCache[Symbol.dispose]()
  }
}
