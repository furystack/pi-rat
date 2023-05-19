import { Injectable, Injected } from '@furystack/inject'
import { MediaApiClient } from './api-clients/media-api-client.js'
import { Cache } from '@furystack/cache'
import type { FindOptions, WithOptionalId } from '@furystack/core'
import type { Movie, MovieFile } from 'common'

@Injectable({ lifetime: 'singleton' })
export class MovieFilesService {
  @Injected(MediaApiClient)
  private readonly mediaApiClient!: MediaApiClient

  public movieFileCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/movie-files/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  public movieFileQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<MovieFile, Array<keyof MovieFile>>) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/movie-files',
        query: {
          findOptions,
        },
      })

      result.entries.forEach((entry) => {
        this.movieFileCache.setExplicitValue({
          loadArgs: [entry.id],
          value: {
            status: 'loaded',
            value: entry,
            updatedAt: new Date(),
          },
        })

        // path / driveLetter / fileName is unique
        this.movieFileQueryCache.setExplicitValue({
          loadArgs: [
            {
              filter: {
                path: { $eq: entry.path },
                driveLetter: { $eq: entry.driveLetter },
                fileName: { $eq: entry.fileName },
              },
            },
          ],
          value: {
            status: 'loaded',
            value: result,
            updatedAt: new Date(),
          },
        })
      })

      return result
    },
  })

  public getMovieFile = this.movieFileCache.get.bind(this.movieFileCache)

  public getMovieFileAsObservable = this.movieFileCache.getObservable.bind(this.movieFileCache)

  public findMovieFile = this.movieFileQueryCache.get.bind(this.movieFileQueryCache)

  public findMovieFileAsObservable = this.movieFileQueryCache.getObservable.bind(this.movieFileQueryCache)
  public deleteMovieFile = async (id: string) => {
    await this.mediaApiClient.call({
      method: 'DELETE',
      action: '/movie-files/:id',
      url: { id },
    })
    this.movieFileCache.remove(id)
    this.movieFileQueryCache.flushAll()
  }

  public updateMovieFile = async (
    id: string,
    body: Omit<WithOptionalId<MovieFile, 'id'>, 'createdAt' | 'updatedAt'>,
  ) => {
    const { result } = await this.mediaApiClient.call({
      method: 'PATCH',
      action: '/movie-files/:id',
      url: { id },
      body,
    })
    this.movieFileCache.setObsolete(id)
    this.movieFileQueryCache.flushAll()
    return result
  }

  public createMovieFile = async (body: Omit<MovieFile, 'createdAt' | 'updatedAt'>) => {
    const { result } = await this.mediaApiClient.call({
      method: 'POST',
      action: '/movie-files',
      body,
    })
    this.movieFileQueryCache.flushAll()
    return result
  }

  public prefetchMovieFilesForMovies = async (movies: Movie[]) => {
    const imdbIds = Array.from(new Set(movies.map((movie) => movie.imdbId)))
    const entries = await this.findMovieFile({
      filter: {
        imdbId: { $in: imdbIds },
      },
    })

    imdbIds.forEach((imdbId) => {
      const relatedMovieFiles = entries.entries.filter((entry) => entry.imdbId === imdbId)
      this.movieFileQueryCache.setExplicitValue({
        loadArgs: [
          {
            filter: {
              imdbId: { $eq: imdbId },
            },
          },
        ],
        value: {
          status: 'loaded',
          value: {
            entries: relatedMovieFiles,
            count: relatedMovieFiles.length,
          },
          updatedAt: new Date(),
        },
      })
    })
  }
}
