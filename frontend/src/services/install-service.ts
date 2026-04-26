import { Cache } from '@furystack/cache'
import { defineService, type Token } from '@furystack/inject'
import { InstallApiClient } from './api-clients/install-api-client.js'

class InstallServiceImpl implements Disposable {
  private cache = new Cache({
    load: async () => {
      const { result } = await this.apiClient.call({
        method: 'GET',
        action: '/serviceStatus',
      })
      return result
    },
  })

  constructor(private readonly apiClient: InstallApiClient) {}

  public getServiceStatus = this.cache.get.bind(this.cache)
  public getServiceStatusAsObservable = this.cache.getObservable.bind(this.cache)

  public [Symbol.dispose](): void {
    this.cache[Symbol.dispose]()
  }
}

export type InstallService = InstallServiceImpl

export const InstallService: Token<InstallService, 'singleton'> = defineService({
  name: 'pi-rat/InstallService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new InstallServiceImpl(inject(InstallApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
