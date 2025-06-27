import { Cache, CannotObsoleteUnloadedError } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { AiChatMessage } from 'common'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'
import { WebsocketNotificationsService } from '../../services/websocket-events.js'

@Injectable({ lifetime: 'singleton' })
export class AiChatMessageService {
  @Injected(WebsocketNotificationsService)
  declare private websocketService: WebsocketNotificationsService

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

    try {
      this.cache.obsoleteRange(() => true)
    } catch (error) {
      if (error instanceof CannotObsoleteUnloadedError) {
        // The cache is not loaded yet, we can ignore this error
        return result
      }
      throw error
    }

    return result
  }

  public async init() {
    this.websocketService.subscribe('onMessage', async (message) => {
      if (message.type !== 'ai-chat-message-added') {
        return
      }
      try {
        this.cache.obsoleteRange((value) => {
          return value.result.entries.some((entry) => {
            return entry.aiChatId === message.aiChatMessage.aiChatId
          })
        })
      } catch (error) {
        if (error instanceof CannotObsoleteUnloadedError) {
          // The cache is not loaded yet, we can ignore this error
          return
        }
        throw error
      }
    })
  }
}
