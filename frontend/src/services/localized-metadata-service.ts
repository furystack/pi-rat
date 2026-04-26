import { Cache } from '@furystack/cache'
import { defineService, type Token } from '@furystack/inject'
import { MediaApiClient } from './api-clients/media-api-client.js'

class LocalizedMetadataServiceImpl implements Disposable {
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

  constructor(private readonly mediaApiClient: MediaApiClient) {}

  public getMovieLocalized = this.movieLocalizedCache.get.bind(this.movieLocalizedCache)
  public getMovieLocalizedAsObservable = this.movieLocalizedCache.getObservable.bind(this.movieLocalizedCache)
  public getSeriesLocalized = this.seriesLocalizedCache.get.bind(this.seriesLocalizedCache)
  public getSeriesLocalizedAsObservable = this.seriesLocalizedCache.getObservable.bind(this.seriesLocalizedCache)

  public [Symbol.dispose](): void {
    this.movieLocalizedCache[Symbol.dispose]()
    this.seriesLocalizedCache[Symbol.dispose]()
  }
}

export type LocalizedMetadataService = LocalizedMetadataServiceImpl

export const LocalizedMetadataService: Token<LocalizedMetadataService, 'singleton'> = defineService({
  name: 'pi-rat/LocalizedMetadataService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new LocalizedMetadataServiceImpl(inject(MediaApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
