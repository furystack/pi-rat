import { JsonResult, type RequestAction } from '@furystack/rest-service'
import type { ChatAction as ChatActionType } from 'common'
import { OllamaClientService } from '../ollama-client-service.js'

export const ChatAction: RequestAction<ChatActionType> = async ({ injector, getBody }) => {
  const payload = await getBody()

  const ollamaService = injector.getInstance(OllamaClientService)

  const result = await ollamaService.chat(payload)

  return JsonResult(result)
}
