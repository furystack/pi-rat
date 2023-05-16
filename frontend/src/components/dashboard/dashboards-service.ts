import { Injectable, Injected } from '@furystack/inject'
import { DashboardsApiClient } from '../../services/api-clients/dashboards-api-client.js'
import { Cache } from '@furystack/cache'
import type { Dashboard } from 'common'
import type { FindOptions, WithOptionalId } from '@furystack/core'

@Injectable({ lifetime: 'singleton' })
export class DashboardService {
  @Injected(DashboardsApiClient)
  private readonly dashboardsApiClient!: DashboardsApiClient

  private dashboardCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.dashboardsApiClient.call({
        method: 'GET',
        action: '/dashboards/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  private dashboardQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<Dashboard, Array<keyof Dashboard>>) => {
      const { result } = await this.dashboardsApiClient.call({
        method: 'GET',
        action: '/dashboards',
        query: {
          findOptions,
        },
      })
      return result
    },
  })

  public getDashboard = this.dashboardCache.get.bind(this.dashboardCache)

  public getDashboardAsObservable = this.dashboardCache.getObservable.bind(this.dashboardCache)

  public findDashboard = this.dashboardQueryCache.get.bind(this.dashboardQueryCache)

  public getDashboardByNameAsObservable = this.dashboardQueryCache.getObservable.bind(this.dashboardQueryCache)
  public deleteDashboard = async (id: string) => {
    await this.dashboardsApiClient.call({
      method: 'DELETE',
      action: '/dashboards/:id',
      url: { id },
    })
    this.dashboardCache.remove(id)
    this.dashboardQueryCache.flushAll()
  }

  public updateDashboard = async (
    id: string,
    body: Omit<WithOptionalId<Dashboard, 'id'>, 'createdAt' | 'updatedAt'>,
  ) => {
    const { result } = await this.dashboardsApiClient.call({
      method: 'PATCH',
      action: '/dashboards/:id',
      url: { id },
      body,
    })
    this.dashboardCache.setObsolete(id)
    this.dashboardQueryCache.flushAll()
    return result
  }

  public createDashboard = async (body: Omit<WithOptionalId<Dashboard, 'id'>, 'createdAt' | 'updatedAt'>) => {
    const { result } = await this.dashboardsApiClient.call({
      method: 'POST',
      action: '/dashboards',
      body,
    })
    this.dashboardQueryCache.flushAll()
    return result
  }
}
