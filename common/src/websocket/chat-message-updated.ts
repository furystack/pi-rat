import type { Chat, ChatMessage } from '../models/chat/index.js'

export type ChatMessageUpdatedMessage = {
  type: 'chat-message-updated'
  id: string
  change: Partial<ChatMessage>
  chat: Chat
}
