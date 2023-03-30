import { Injectable, Injected } from '@furystack/inject'
import { Cache } from '@furystack/cache'
import { DrivesApiClient } from '../../services/drives-api-client'
import type { FilterType } from '@furystack/core'
import type { Drive } from 'common'

@Injectable({ lifetime: 'singleton' })
export class AvailableDrivesService {
  @Injected(DrivesApiClient)
  private api!: DrivesApiClient

  private cache = new Cache({
    capacity: 100,
    load: async (options: FilterType<Drive> = {}) => {
      const { result } = await this.api.call({
        method: 'GET',
        action: '/volumes',
        query: {
          findOptions: {
            filter: options,
          },
        },
      })

      return result
    },
  })

  public getDrives(options: FilterType<Drive> = {}) {
    return this.cache.get(options)
  }

  public getDrivesAsObservable(options: FilterType<Drive> = {}) {
    return this.cache.getObservable(options)
  }

  public async reload(options: FilterType<Drive> = {}) {
    this.cache.remove(options)
    return await this.cache.get(options)
  }
}
