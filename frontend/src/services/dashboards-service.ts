import { Cache } from '@furystack/cache'
import type { FindOptions, WithOptionalId } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { Dashboard } from 'common'
import { DashboardsApiClient } from './api-clients/dashboards-api-client.js'

class DashboardServiceImpl implements Disposable {
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

  public dashboardQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<Dashboard, Array<keyof Dashboard>>) => {
      const { result } = await this.dashboardsApiClient.call({
        method: 'GET',
        action: '/dashboards',
        query: { findOptions },
      })
      return result
    },
  })

  constructor(private readonly dashboardsApiClient: DashboardsApiClient) {}

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

  public [Symbol.dispose](): void {
    this.dashboardCache[Symbol.dispose]()
    this.dashboardQueryCache[Symbol.dispose]()
  }
}

export type DashboardService = DashboardServiceImpl

export const DashboardService: Token<DashboardService, 'singleton'> = defineService({
  name: 'pi-rat/DashboardService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new DashboardServiceImpl(inject(DashboardsApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
