import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { Config } from 'common'
import { OllamaClientService } from './ollama-client-service.js'

export const setupAi = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('AI Setup')
  await logger.verbose({ message: '🤖   Initializing AI Services' })
  const clientService = injector.getInstance(OllamaClientService)

  const configDataSet = getRepository(injector).getDataSetFor(Config, 'id')

  configDataSet.subscribe('onEntityAdded', async () => {
    await logger.verbose({ message: '🔄   Config changed, reinitializing AI Services' })
    await clientService.init(injector)
  })

  configDataSet.subscribe('onEntityUpdated', async () => {
    await logger.verbose({ message: '🔄   Config changed, reinitializing AI Services' })
    await clientService.init(injector)
  })
}
