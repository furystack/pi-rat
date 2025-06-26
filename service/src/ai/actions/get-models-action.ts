import { JsonResult, type RequestAction } from '@furystack/rest-service'
import type { GetModelsAction as GetModelsActionType } from 'common'
import { OllamaClientService } from '../ollama-client-service.js'

export const GetModelsAction: RequestAction<GetModelsActionType> = async ({ injector }) => {
  const ollamaService = injector.getInstance(OllamaClientService)
  const { models } = await ollamaService.getSupportedModels()

  return JsonResult(models)
}
