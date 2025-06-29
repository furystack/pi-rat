import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { ChatRequest, ChatResponse, ModelResponse } from 'ollama'
import type { AiChat, AiChatMessage } from '../models/index.js'

export type GetModelsAction = {
  result: ModelResponse[]
}

export type ChatAction = {
  body: ChatRequest & { stream?: false }
  result: ChatResponse
}

export interface AiApi extends RestApi {
  GET: {
    '/models': GetModelsAction
    '/ai-chats': GetCollectionEndpoint<AiChat>
    '/ai-chats/:id': GetEntityEndpoint<AiChat, 'id'>
    '/ai-chat-messages': GetCollectionEndpoint<AiChatMessage>
    '/ai-chat-messages/:id': GetEntityEndpoint<AiChatMessage, 'id'>
  }
  POST: {
    // @deprecated
    '/chat': ChatAction
    '/ai-chats': PostEndpoint<AiChat, 'id'>
    '/ai-chat-messages': PostEndpoint<AiChatMessage, 'id'>
  }
  PATCH: {
    '/ai-chats/:id': PatchEndpoint<AiChat, 'id'>
  }
  DELETE: {
    '/ai-chats/:id': DeleteEndpoint<AiChat, 'id'>
  }
}
