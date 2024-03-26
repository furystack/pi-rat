import { Injectable, Injected } from '@furystack/inject'
import { InstallApiClient } from './api-clients/install-api-client.js'
import { Cache } from '@furystack/cache'

@Injectable({ lifetime: 'singleton' })
export class InstallService {
  @Injected(InstallApiClient)
  private declare readonly apiClient: InstallApiClient

  private cache = new Cache({
    load: async () => {
      const { result } = await this.apiClient.call({
        method: 'GET',
        action: '/serviceStatus',
      })
      return result
    },
  })

  public getServiceStatus = this.cache.get.bind(this.cache)
  public getServiceStatusAsObservable = this.cache.getObservable.bind(this.cache)
}
