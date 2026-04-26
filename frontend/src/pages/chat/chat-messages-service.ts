import { defineService, type Token } from '@furystack/inject'
import type { ChatMessage } from 'common'
import { ChatApiClient } from '../../services/api-clients/chat-api-client.js'

export interface ChatMessageService {
  addChatMessage(chatMessage: ChatMessage): Promise<ChatMessage>
  updateChatMessage(id: string, chatMessage: Partial<ChatMessage>): Promise<ChatMessage>
  deleteChatMessage(id: string): Promise<void>
}

export const ChatMessageService: Token<ChatMessageService, 'singleton'> = defineService({
  name: 'pi-rat/ChatMessageService',
  lifetime: 'singleton',
  factory: ({ inject }): ChatMessageService => {
    const chatApiClient = inject(ChatApiClient)
    return {
      addChatMessage: async (chatMessage) => {
        const { result } = await chatApiClient.call({
          method: 'POST',
          action: '/chat-messages',
          body: chatMessage,
        })
        return result
      },
      updateChatMessage: async (id, chatMessage) => {
        const { result } = await chatApiClient.call({
          method: 'PATCH',
          action: '/chat-messages/:id',
          url: { id },
          body: chatMessage,
        })
        return result as ChatMessage
      },
      deleteChatMessage: async (id) => {
        await chatApiClient.call({
          method: 'DELETE',
          action: '/chat-messages/:id',
          url: { id },
        })
      },
    }
  },
})
