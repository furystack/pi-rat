import type { Chat } from '../models/index.js'

export type ChatUpdatedMessage = {
  type: 'chat-updated'
  id: string
  change: Partial<Chat>
}
