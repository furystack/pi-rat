import { Cache } from '@furystack/cache'
import { defineService, type Token } from '@furystack/inject'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

class AiModelServiceImpl implements Disposable {
  public cache = new Cache({
    load: async () => {
      return this.aiApiClient.call({
        method: 'GET',
        action: '/models',
      })
    },
  })

  constructor(private readonly aiApiClient: AiApiClient) {}

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

export type AiModelService = AiModelServiceImpl

export const AiModelService: Token<AiModelService, 'singleton'> = defineService({
  name: 'pi-rat/AiModelService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new AiModelServiceImpl(inject(AiApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
