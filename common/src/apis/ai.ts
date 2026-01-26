import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type {
  ModelResponse,
  ChatRequest as OllamaChatRequest,
  ChatResponse as OllamaChatResponse,
  Message as OllamaMessage,
} from 'ollama'
import type { AiChat, AiChatMessage } from '../models/index.js'

// Override OllamaMessage to use string[] for images instead of Uint8Array[] | string[]
// This avoids schema generation issues with Uint8Array
type OllamaApiMessage = Omit<OllamaMessage, 'images'> & {
  images?: string[]
}

type ChatRequest = Omit<OllamaChatRequest, 'messages'> & {
  messages: OllamaApiMessage[]
}

export type ChatResponse = Omit<OllamaChatResponse, 'message'> & {
  message: OllamaApiMessage
}

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
