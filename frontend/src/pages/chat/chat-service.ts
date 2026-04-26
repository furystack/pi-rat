import { defineService, type Token } from '@furystack/inject'
import type { Chat } from 'common'
import { ChatApiClient } from '../../services/api-clients/chat-api-client.js'

export interface ChatService {
  addChat(chat: Chat): Promise<Chat>
  updateChat(id: string, chat: Partial<Chat>): Promise<Chat>
  deleteChat(id: string): Promise<void>
}

export const ChatService: Token<ChatService, 'singleton'> = defineService({
  name: 'pi-rat/ChatService',
  lifetime: 'singleton',
  factory: ({ inject }): ChatService => {
    const chatApiClient = inject(ChatApiClient)
    return {
      addChat: async (chat) => {
        const { result } = await chatApiClient.call({
          method: 'POST',
          action: '/chat',
          body: chat,
        })
        return result
      },
      updateChat: async (id, chat) => {
        const { result } = await chatApiClient.call({
          method: 'PATCH',
          action: '/chat/:id',
          url: { id },
          body: chat,
        })
        return result as Chat
      },
      deleteChat: async (id) => {
        await chatApiClient.call({
          method: 'DELETE',
          action: '/chat/:id',
          url: { id },
        })
      },
    }
  },
})
