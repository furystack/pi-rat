import { Injectable, Injected } from '@furystack/inject'
import { MediaApiClient } from './api-clients/media-api-client.js'
import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import type { MovieWatchHistoryEntry } from 'common'

@Injectable({ lifetime: 'singleton' })
export class WatchProgressService {
  @Injected(MediaApiClient)
  private readonly mediaApiClient!: MediaApiClient

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
      return result
    },
  })

  public getWatchProgress = this.watchProgressCache.get.bind(this.watchProgressCache)

  public getDashboardAsObservable = this.watchProgressCache.getObservable.bind(this.watchProgressCache)

  public findWatchProgress = this.watchProgressQueryCache.get.bind(this.watchProgressQueryCache)

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
    this.watchProgressCache.remove(result.id)
    this.watchProgressQueryCache.flushAll()
    return result
  }
}