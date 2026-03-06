import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { AiChat } from 'common'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class AiChatService implements Disposable {
  @Injected(AiApiClient)
  declare private aiApi: AiApiClient

  public aiChatCache = new Cache({
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
    return this.aiChatCache.get(chatId)
  }

  public getAiChatAsObservable(chatId: string) {
    return this.aiChatCache.getObservable(chatId)
  }

  public aiChatQueryCache = new Cache({
    load: async (findOptions: FindOptions<AiChat, Array<keyof AiChat>>) => {
      const results = await this.aiApi.call({
        method: 'GET',
        action: '/ai-chats',
        query: { findOptions },
      })

      results.result.entries.forEach((chat) => {
        this.aiChatCache.setExplicitValue({
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
    return this.aiChatQueryCache.get(request)
  }

  public getAiChatsAsObservable(request: FindOptions<AiChat, Array<keyof AiChat>>) {
    return this.aiChatQueryCache.getObservable(request)
  }

  public async createChat(chat: AiChat) {
    const result = await this.aiApi.call({
      method: 'POST',
      action: '/ai-chats',
      body: chat,
    })

    this.aiChatQueryCache.obsoleteRange(() => true)

    return result
  }

  public async removeChat(chatId: string) {
    const result = await this.aiApi.call({
      method: 'DELETE',
      action: `/ai-chats/:id`,
      url: { id: chatId },
    })

    this.aiChatQueryCache.obsoleteRange(() => true)

    return result
  }

  public [Symbol.dispose](): void {
    this.aiChatCache[Symbol.dispose]()
    this.aiChatQueryCache[Symbol.dispose]()
  }
}
