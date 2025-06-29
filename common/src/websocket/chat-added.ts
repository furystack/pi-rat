import type { Chat } from '../models/index.js'

export type ChatAddedMessage = {
  type: 'chat-added'
  chat: Chat
}
