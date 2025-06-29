import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { AiChat } from 'common'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class AiChatService {
  @Injected(AiApiClient)
  declare private aiApi: AiApiClient

  private cache = new Cache({
    load: async (chatId: string) => {
      const { result } = await this.aiApi.call({
        method: 'GET',
        action: '/ai-chats/:id',
        url: { id: chatId },
        query: {},
      })
      return result
    },
  })

  public async getAiChat(chatId: string) {
    return this.cache.get(chatId)
  }

  public getAiChatAsObservable(chatId: string) {
    return this.cache.getObservable(chatId)
  }

  private queryCache = new Cache({
    load: async (findOptions: FindOptions<AiChat, Array<keyof AiChat>>) => {
      const results = await this.aiApi.call({
        method: 'GET',
        action: '/ai-chats',
        query: { findOptions },
      })

      results.result.entries.forEach((chat) => {
        this.cache.setExplicitValue({
          loadArgs: [chat.id],
          value: {
            status: 'loaded',
            updatedAt: new Date(),
            value: chat,
          },
        })
      })

      return results.result
    },
  })

  public async getAiChats(request: FindOptions<AiChat, Array<keyof AiChat>>) {
    return this.queryCache.get(request)
  }

  public getAiChatsAsObservable(request: FindOptions<AiChat, Array<keyof AiChat>>) {
    return this.queryCache.getObservable(request)
  }

  public async createChat(chat: AiChat) {
    const result = await this.aiApi.call({
      method: 'POST',
      action: '/ai-chats',
      body: chat,
    })

    this.queryCache.obsoleteRange(() => true)

    return result
  }

  public async removeChat(chatId: string) {
    const result = await this.aiApi.call({
      method: 'DELETE',
      action: `/ai-chats/:id`,
      url: { id: chatId },
    })

    this.queryCache.obsoleteRange(() => true)

    return result
  }
}
