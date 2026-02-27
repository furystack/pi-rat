import { Injectable, Injected } from '@furystack/inject'
import type { ChatMessage } from 'common'
import { ChatApiClient } from '../../services/api-clients/chat-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class ChatMessageService {
  @Injected(ChatApiClient)
  declare private readonly chatApiClient: ChatApiClient

  public async addChatMessage(chatMessage: ChatMessage) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat-messages',
      body: chatMessage,
    })
    return result
  }

  public async updateChatMessage(id: string, chatMessage: Partial<ChatMessage>) {
    const { result } = await this.chatApiClient.call({
      method: 'PATCH',
      action: '/chat-messages/:id',
      url: { id },
      body: chatMessage,
    })
    return result
  }

  public async deleteChatMessage(id: string) {
    await this.chatApiClient.call({
      method: 'DELETE',
      action: '/chat-messages/:id',
      url: { id },
    })
  }
}
