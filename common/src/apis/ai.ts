import type { GetCollectionEndpoint, GetEntityEndpoint, PatchEndpoint, PostEndpoint, RestApi } from '@furystack/rest'
import type { ChatRequest, ChatResponse, ModelResponse } from 'ollama'
import type { AiChat } from '../models/index.js'

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
    '/ai-chat-messages': GetCollectionEndpoint<AiChat>
    '/ai-chat-messages/:id': GetEntityEndpoint<AiChat, 'id'>
  }
  POST: {
    // @deprecated
    '/chat': ChatAction
    '/ai-chats': PostEndpoint<AiChat, 'id'>
    '/ai-chat-messages': PostEndpoint<AiChat, 'id'>
  }
  PATCH: {
    '/ai-chats/:id': PatchEndpoint<AiChat, 'id'>
  }
}
