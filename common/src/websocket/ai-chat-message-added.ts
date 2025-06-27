import type { AiChatMessage } from '../models/index.js'

export type AiChatMessageAdded = {
  type: 'ai-chat-message-added'
  aiChatMessage: AiChatMessage
}
