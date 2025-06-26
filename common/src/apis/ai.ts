import type { RestApi } from '@furystack/rest'
import type { ChatRequest, ChatResponse, ModelResponse } from 'ollama'

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
  }
  POST: {
    '/chat': ChatAction
  }
}
