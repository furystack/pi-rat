import { defineService, type Token } from '@furystack/inject'
import type { AiChatMessage } from 'common'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

export interface AiChatMessageService {
  createChatMessage(chat: AiChatMessage): Promise<{ result: AiChatMessage }>
}

export const AiChatMessageService: Token<AiChatMessageService, 'singleton'> = defineService({
  name: 'pi-rat/AiChatMessageService',
  lifetime: 'singleton',
  factory: ({ inject }) => {
    const aiApi = inject(AiApiClient)
    return {
      createChatMessage: async (chat) =>
        aiApi.call({
          method: 'POST',
          action: '/ai-chat-messages',
          body: chat,
        }),
    }
  },
})
