import { Injectable, Injected } from '@furystack/inject'
import { MediaApiClient } from './api-clients/media-api-client.js'
import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import type { Movie, MovieWatchHistoryEntry } from 'common'

@Injectable({ lifetime: 'singleton' })
export class WatchProgressService {
  @Injected(MediaApiClient)
  private declare readonly mediaApiClient: MediaApiClient

  private watchProgressCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/my-watch-progresses/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  private watchProgressQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<MovieWatchHistoryEntry, Array<keyof MovieWatchHistoryEntry>>) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/my-watch-progresses',
        query: {
          findOptions,
        },
      })
      result.entries.forEach((entry) => {
        this.watchProgressCache.setExplicitValue({
          loadArgs: [entry.id],
          value: { status: 'loaded', value: entry, updatedAt: new Date() },
        })
        this.watchProgressQueryCache.setExplicitValue({
          loadArgs: [
            {
              filter: {
                path: { $eq: entry.path },
                driveLetter: { $eq: entry.driveLetter },
                fileName: { $eq: entry.fileName },
              },
            },
          ],
          value: { status: 'loaded', value: result, updatedAt: new Date() },
        })
      })

      return result
    },
  })

  public getWatchProgress = this.watchProgressCache.get.bind(this.watchProgressCache)

  public getWatchProgressAsObservable = this.watchProgressCache.getObservable.bind(this.watchProgressCache)

  public findWatchProgress = this.watchProgressQueryCache.get.bind(this.watchProgressQueryCache)

  public findWatchProgressForFile = async ({
    path,
    fileName,
    driveLetter,
  }: {
    path: string
    fileName: string
    driveLetter: string
  }) => {
    const { result } = await this.mediaApiClient.call({
      method: 'GET',
      action: '/my-watch-progresses',
      query: {
        findOptions: {
          filter: {
            path: { $eq: path },
            fileName: { $eq: fileName },
            driveLetter: { $eq: driveLetter },
          },
        },
      },
    })

    result.entries.forEach((entry) => {
      this.watchProgressCache.setExplicitValue({
        loadArgs: [entry.id],
        value: { status: 'loaded', value: entry, updatedAt: new Date() },
      })
    })

    return result
  }

  public async findWatchProgressesForMovie(movie: Movie) {
    return await this.findWatchProgress({
      filter: {
        imdbId: { $eq: movie.imdbId },
      },
    })
  }

  public findWatchProgressAsObservable = this.watchProgressQueryCache.getObservable.bind(this.watchProgressQueryCache)
  public deleteWatchEntry = async (id: string) => {
    await this.mediaApiClient.call({
      method: 'DELETE',
      action: '/my-watch-progresses/:id',
      url: { id },
    })
    this.watchProgressCache.remove(id)
    this.watchProgressQueryCache.flushAll()
  }

  public updateWatchEntry = async (
    body: Omit<MovieWatchHistoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'userName'>,
  ) => {
    const { result } = await this.mediaApiClient.call({
      method: 'POST',
      action: '/save-watch-progress',
      body,
    })
    this.watchProgressCache.setExplicitValue({
      loadArgs: [result.id],
      value: { status: 'loaded', value: result, updatedAt: new Date() },
    })
    this.watchProgressQueryCache.flushAll()
    return result
  }

  public async prefetchWatchProgressForMovies(movies: Movie[]) {
    const imdbIds = Array.from(new Set(movies.map((movie) => movie.imdbId)))

    const result = await this.findWatchProgress({
      filter: {
        imdbId: { $in: imdbIds },
      },
    })

    imdbIds.forEach((imdbId) => {
      const relatedWatchProgresses = result.entries.filter((entry) => entry.imdbId === imdbId)
      this.watchProgressQueryCache.setExplicitValue({
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
            entries: relatedWatchProgresses,
            count: relatedWatchProgresses.length,
          },
          updatedAt: new Date(),
        },
      })
    })
  }
}
