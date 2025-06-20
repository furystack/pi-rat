import { Cache } from '@furystack/cache'
import type { FilterType } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { ChatMessage } from 'common'
import { ChatApiClient } from '../../services/api-clients/chat-api-client.js'
import { WebsocketNotificationsService } from '../../services/websocket-events.js'

@Injectable({ lifetime: 'singleton' })
export class ChatMessageService {
  @Injected(ChatApiClient)
  declare private readonly chatApiClient: ChatApiClient

  @Injected(WebsocketNotificationsService)
  declare private readonly websocketNotificationsService: WebsocketNotificationsService

  private chatMessageCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.chatApiClient.call({
        method: 'GET',
        action: '/chat-messages/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  private chatMessagesQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: { filter?: FilterType<ChatMessage> }) => {
      const { result } = await this.chatApiClient.call({
        method: 'GET',
        action: '/chat-messages',
        query: {
          findOptions,
        },
      })

      result.entries.forEach((entry) => {
        this.chatMessageCache.setExplicitValue({
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

  public async getChatMessage(id: string) {
    return this.chatMessageCache.get(id)
  }

  public getChatMessageAsObservable(id: string) {
    return this.chatMessageCache.getObservable(id)
  }

  public async getChatMessages(findOptions: { filter?: FilterType<ChatMessage> }) {
    return this.chatMessagesQueryCache.get(findOptions)
  }

  public getChatMessagesAsObservable(findOptions: { filter?: FilterType<ChatMessage> }) {
    return this.chatMessagesQueryCache.getObservable(findOptions)
  }

  public async addChatMessage(chatMessage: ChatMessage) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat-messages',
      body: chatMessage,
    })

    this.chatMessageCache.setExplicitValue({
      loadArgs: [result.id],
      value: {
        status: 'loaded',
        value: result,
        updatedAt: new Date(),
      },
    })

    this.chatMessagesQueryCache.obsoleteRange(() => true)

    return result
  }

  public async updateChatMessage(id: string, chatMessage: Partial<ChatMessage>) {
    const { result } = await this.chatApiClient.call({
      method: 'PATCH',
      action: '/chat-messages/:id',
      url: { id },
      body: chatMessage,
    })

    this.chatMessageCache.setExplicitValue({
      loadArgs: [id],
      value: {
        status: 'loaded',
        value: result as ChatMessage,
        updatedAt: new Date(),
      },
    })
    this.chatMessagesQueryCache.obsoleteRange(() => true)
    return result
  }

  public async deleteChatMessage(id: string) {
    await this.chatApiClient.call({
      method: 'DELETE',
      action: '/chat-messages/:id',
      url: { id },
    })

    this.chatMessageCache.remove(id)
    this.chatMessagesQueryCache.obsoleteRange(() => true)
  }

  public init() {
    this.websocketNotificationsService.addListener('onMessage', async (message) => {
      if (message.type === 'chat-message-added') {
        this.chatMessageCache.setExplicitValue({
          loadArgs: [message.chatMessage.id],
          value: {
            status: 'loaded',
            value: message.chatMessage,
            updatedAt: new Date(),
          },
        })

        try {
          this.chatMessagesQueryCache.obsoleteRange((entity) => {
            return entity?.entries.some((entry) => entry.chatId === message.chatMessage.chatId)
          })
        } catch (error) {
          // Ignore - Maybe already reloading
        }
      }
    })
  }
}
