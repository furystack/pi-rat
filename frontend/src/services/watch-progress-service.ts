import { Injectable, Injected } from '@furystack/inject'
import { MediaApiClient } from './api-clients/media-api-client.js'
import { Cache } from '@furystack/cache'
import type { FilterType, FindOptions } from '@furystack/core'
import type { MovieWatchHistoryEntry } from 'common'
import type { PiRatFile } from 'common'

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

  public findWatchProgressForFile = async ({ path, driveLetter }: PiRatFile) => {
    const { result } = await this.mediaApiClient.call({
      method: 'GET',
      action: '/my-watch-progresses',
      query: {
        findOptions: {
          filter: {
            path: { $eq: path },
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

  public async findWatchProgressesForFile({ driveLetter, path }: PiRatFile) {
    return await this.findWatchProgress({
      filter: {
        driveLetter: { $eq: driveLetter },
        path: { $eq: path },
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

  public async prefetchWatchProgressForFiles(files: PiRatFile[]) {
    const filter: FilterType<MovieWatchHistoryEntry> = {
      $or: files.map(({ path, driveLetter }) => ({
        path: { $eq: path },
        driveLetter: { $eq: driveLetter },
      })),
    }

    const result = await this.findWatchProgress({
      filter,
    })

    files.forEach(({ path, driveLetter }) => {
      const relatedWatchProgresses = result.entries.filter(
        (entry) => entry.path === path && entry.driveLetter === driveLetter,
      )
      this.watchProgressQueryCache.setExplicitValue({
        loadArgs: [
          {
            filter: {
              path: { $eq: path },
              driveLetter: { $eq: driveLetter },
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
