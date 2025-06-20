import type { Chat, ChatMessage, ChatMessageAttachment } from '../models/chat/index.js'

export type ChatMessageAddedMessage = {
  type: 'chat-message-added'
  chat: Chat
  chatMessage: ChatMessage
  attachments: ChatMessageAttachment[]
}
