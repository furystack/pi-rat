import { Injectable, Injected } from '@furystack/inject'
import type { Chat } from 'common'
import { ChatApiClient } from '../../services/api-clients/chat-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class ChatService {
  @Injected(ChatApiClient)
  declare private readonly chatApiClient: ChatApiClient

  public async addChat(chat: Chat) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat',
      body: chat,
    })
    return result
  }

  public async updateChat(id: string, chat: Partial<Chat>) {
    const { result } = await this.chatApiClient.call({
      method: 'PATCH',
      action: '/chat/:id',
      url: { id },
      body: chat,
    })
    return result
  }

  public async deleteChat(id: string) {
    await this.chatApiClient.call({
      method: 'DELETE',
      action: '/chat/:id',
      url: { id },
    })
  }
}
