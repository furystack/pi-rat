import { Cache } from '@furystack/cache'
import type { FilterType } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { Chat } from 'common'
import { ChatApiClient } from '../../services/api-clients/chat-api-client.js'
import { ChatInvitationService } from './chat-intivation-service.js'

@Injectable({ lifetime: 'singleton' })
export class ChatService {
  @Injected(ChatInvitationService)
  declare private readonly chatInvitationService: ChatInvitationService

  @Injected(ChatApiClient)
  declare private readonly chatApiClient: ChatApiClient

  private chatCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.chatApiClient.call({
        method: 'GET',
        action: '/chat/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  private chatQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: { filter?: FilterType<Chat> }) => {
      const { result } = await this.chatApiClient.call({
        method: 'GET',
        action: '/chat',
        query: {
          findOptions,
        },
      })

      result.entries.forEach((entry) => {
        this.chatCache.setExplicitValue({
          loadArgs: [entry.id],
          value: {
            status: 'loaded',
            value: entry,
            updatedAt: new Date(),
          },
        })
      })

      return result
    },
  })

  public async getChat(id: string) {
    return this.chatCache.get(id)
  }

  public getChatAsObservable(id: string) {
    return this.chatCache.getObservable(id)
  }

  public async getChats(findOptions: { filter?: FilterType<Chat> }) {
    return this.chatQueryCache.get(findOptions)
  }

  public getChatsAsObservable(findOptions: { filter?: FilterType<Chat> }) {
    return this.chatQueryCache.getObservable(findOptions)
  }

  public async addChat(chat: Chat) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat',
      body: chat,
    })

    this.chatCache.setExplicitValue({
      loadArgs: [result.id],
      value: {
        status: 'loaded',
        value: result,
        updatedAt: new Date(),
      },
    })

    this.chatQueryCache.obsoleteRange(() => true)

    return result
  }

  public async updateChat(id: string, chat: Partial<Chat>) {
    const { result } = await this.chatApiClient.call({
      method: 'PATCH',
      action: '/chat/:id',
      url: { id },
      body: chat,
    })

    this.chatCache.setExplicitValue({
      loadArgs: [id],
      value: {
        status: 'loaded',
        value: result as Chat,
        updatedAt: new Date(),
      },
    })
    this.chatQueryCache.obsoleteRange(() => true)
    return result
  }

  public async deleteChat(id: string) {
    await this.chatApiClient.call({
      method: 'DELETE',
      action: '/chat/:id',
      url: { id },
    })

    this.chatCache.remove(id)
    this.chatQueryCache.obsoleteRange(() => true)
  }

  public init() {
    this.chatInvitationService.subscribe('invitationAccepted', () => {
      this.chatQueryCache.obsoleteRange(() => true)
    })
  }
}
