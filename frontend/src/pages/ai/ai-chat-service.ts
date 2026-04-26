import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { AiChat } from 'common'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

class AiChatServiceImpl implements Disposable {
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
          value: { status: 'loaded', updatedAt: new Date(), value: chat },
        })
      })

      return results.result
    },
  })

  constructor(private readonly aiApi: AiApiClient) {}

  public async getAiChat(chatId: string) {
    return this.aiChatCache.get(chatId)
  }

  public getAiChatAsObservable(chatId: string) {
    return this.aiChatCache.getObservable(chatId)
  }

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

export type AiChatService = AiChatServiceImpl

export const AiChatService: Token<AiChatService, 'singleton'> = defineService({
  name: 'pi-rat/AiChatService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new AiChatServiceImpl(inject(AiApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
