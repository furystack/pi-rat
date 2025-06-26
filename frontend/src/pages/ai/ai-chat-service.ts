import { Cache } from '@furystack/cache'
import { Injectable, Injected } from '@furystack/inject'
import type { ChatRequest } from 'ollama'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

export type AiChatRequest = ChatRequest & {
  stream?: false | undefined
}

@Injectable({ lifetime: 'singleton' })
export class AiChatService {
  @Injected(AiApiClient)
  declare private aiApi: AiApiClient
  private cache = new Cache({
    load: async (request: AiChatRequest) => {
      return this.aiApi.call({
        method: 'POST',
        action: '/chat',
        body: request,
      })
    },
  })

  public async chat(request: AiChatRequest) {
    return this.cache.get(request)
  }

  public getChatAsObservable(request: AiChatRequest) {
    return this.cache.getObservable(request)
  }
}
