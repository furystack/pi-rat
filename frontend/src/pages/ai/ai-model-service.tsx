import { Cache } from '@furystack/cache'
import { Injectable, Injected } from '@furystack/inject'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class AiModelService implements Disposable {
  @Injected(AiApiClient)
  declare private aiApiClient: AiApiClient

  public cache = new Cache({
    load: async () => {
      return this.aiApiClient.call({
        method: 'GET',
        action: '/models',
      })
    },
  })

  public async getModels() {
    return this.cache.get()
  }

  public getModelsAsObservable() {
    return this.cache.getObservable()
  }

  public [Symbol.dispose](): void {
    this.cache[Symbol.dispose]()
  }
}
