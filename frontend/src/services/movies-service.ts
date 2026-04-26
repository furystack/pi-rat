import { Cache } from '@furystack/cache'
import type { FindOptions, WithOptionalId } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { Movie } from 'common'
import { MediaApiClient } from './api-clients/media-api-client.js'

class MoviesServiceImpl implements Disposable {
  public movieCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/movies/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  public movieQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<Movie, Array<keyof Movie>>) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/movies',
        query: { findOptions },
      })

      result.entries.forEach((entry) => {
        this.movieCache.setExplicitValue({
          loadArgs: [entry.imdbId],
          value: { status: 'loaded', value: entry, updatedAt: new Date() },
        })
      })

      return result
    },
  })

  constructor(private readonly mediaApiClient: MediaApiClient) {}

  public getMovie = this.movieCache.get.bind(this.movieCache)
  public getMovieAsObservable = this.movieCache.getObservable.bind(this.movieCache)
  public findMovie = this.movieQueryCache.get.bind(this.movieQueryCache)
  public findMovieAsObservable = this.movieQueryCache.getObservable.bind(this.movieQueryCache)

  public deleteMovie = async (id: string) => {
    await this.mediaApiClient.call({
      method: 'DELETE',
      action: '/movies/:id',
      url: { id },
    })
    this.movieCache.remove(id)
    this.movieQueryCache.flushAll()
  }

  public updateMovie = async (id: string, body: Omit<WithOptionalId<Movie, 'imdbId'>, 'createdAt' | 'updatedAt'>) => {
    const { result } = await this.mediaApiClient.call({
      method: 'PATCH',
      action: '/movies/:id',
      url: { id },
      body,
    })
    this.movieCache.setObsolete(id)
    this.movieQueryCache.flushAll()
    return result
  }

  public createMovie = async (body: Omit<Movie, 'createdAt' | 'updatedAt'>) => {
    const { result } = await this.mediaApiClient.call({
      method: 'POST',
      action: '/movies',
      body,
    })
    this.movieQueryCache.flushAll()
    return result
  }

  public [Symbol.dispose](): void {
    this.movieCache[Symbol.dispose]()
    this.movieQueryCache[Symbol.dispose]()
  }
}

export type MoviesService = MoviesServiceImpl

export const MoviesService: Token<MoviesService, 'singleton'> = defineService({
  name: 'pi-rat/MoviesService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new MoviesServiceImpl(inject(MediaApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
