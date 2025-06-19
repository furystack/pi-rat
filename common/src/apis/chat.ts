import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { Chat, ChatMessage, ChatMessageAttachment } from '../models/index.js'

export interface ChatApi extends RestApi {
  GET: {
    '/chat': GetCollectionEndpoint<Chat>
    '/chat/:id': GetEntityEndpoint<Chat, 'id'>
    '/chat-messages': GetCollectionEndpoint<ChatMessage>
    '/chat-messages/:id': GetEntityEndpoint<ChatMessage, 'id'>
    '/chat-message-attachments': GetCollectionEndpoint<ChatMessageAttachment>
    '/chat-message-attachments/:id': GetEntityEndpoint<ChatMessageAttachment, 'id'>
  }
  POST: {
    '/chat': PostEndpoint<Chat, 'id'>
    '/chat-messages': PostEndpoint<ChatMessage, 'id'>
    '/chat-message-attachments': PostEndpoint<ChatMessageAttachment, 'id'>
  }
  PATCH: {
    '/chat/:id': PatchEndpoint<Chat, 'id'>
    '/chat-messages/:id': PatchEndpoint<ChatMessage, 'id'>
    '/chat-message-attachments/:id': PatchEndpoint<ChatMessageAttachment, 'id'>
  }
  DELETE: {
    '/chat/:id': DeleteEndpoint<Chat, 'id'>
    '/chat-messages/:id': DeleteEndpoint<ChatMessage, 'id'>
    '/chat-message-attachments/:id': DeleteEndpoint<ChatMessageAttachment, 'id'>
  }
}
