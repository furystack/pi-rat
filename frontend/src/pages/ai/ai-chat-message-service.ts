import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { AiChatMessage } from 'common'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class AiChatMessageService {
  @Injected(AiApiClient)
  declare private aiApi: AiApiClient
  private cache = new Cache({
    load: async (findOptions: FindOptions<AiChatMessage, Array<keyof AiChatMessage>>) => {
      return this.aiApi.call({
        method: 'GET',
        action: '/ai-chat-messages',
        query: { findOptions },
      })
    },
  })

  public async getChatMessages(request: FindOptions<AiChatMessage, Array<keyof AiChatMessage>>) {
    return this.cache.get(request)
  }

  public getChatMessagesAsObservable(request: FindOptions<AiChatMessage, Array<keyof AiChatMessage>>) {
    return this.cache.getObservable(request)
  }

  public async createChatMessage(chat: AiChatMessage) {
    const result = await this.aiApi.call({
      method: 'POST',
      action: '/ai-chat-messages',
      body: chat,
    })

    this.cache.obsoleteRange(() => true)

    return result
  }
}
