import { IdentityContext, useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'
import { AiChat, AiChatMessage, Config, User } from 'common'
import { ImpersonatedIdentityContext } from '../utils/impersonated-identity-context.js'
import { OllamaClientService } from './ollama-client-service.js'
import { setupAiStore } from './setup-ai-store.js'

export const setupAi = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('AI Setup')
  const clientService = injector.getInstance(OllamaClientService)

  const configDataSet = getDataSetFor(injector, Config, 'id')

  configDataSet.subscribe('onEntityAdded', async ({ entity }) => {
    if (entity.id === 'OLLAMA_CONFIG') {
      await logger.verbose({ message: '🔄   Config changed, reinitializing AI Services' })
      await clientService.init()
    }
  })

  configDataSet.subscribe('onEntityUpdated', async ({ id }) => {
    if (id === 'OLLAMA_CONFIG') {
      await logger.verbose({ message: '🔄   Config changed, reinitializing AI Services' })
      await clientService.init()
    }
  })

  await setupAiStore(injector)

  const systemInjector = useSystemIdentityContext({ injector, username: 'ai-setup' })
  const chatMessageDataSet = getDataSetFor(injector, AiChatMessage, 'id')
  const chatDataSet = getDataSetFor(injector, AiChat, 'id')
  const userDataSet = getDataSetFor(injector, User, 'username')

  chatMessageDataSet.subscribe('onEntityAdded', async ({ entity }) => {
    const chat = await chatDataSet.get(systemInjector, entity.aiChatId)
    if (!chat) {
      await logger.error({ message: `❌  Chat with ID ${entity.aiChatId} not found for message ${entity.id}` })
      return
    }
    const chatHistory = await chatMessageDataSet.find(systemInjector, {
      filter: { aiChatId: { $eq: chat.id } },
      order: { createdAt: 'DESC' },
      top: 20,
    })

    const currentUser = await userDataSet.get(systemInjector, entity.owner)

    await usingAsync(injector.createChild({}), async (handlerInjector) => {
      handlerInjector.setExplicitInstance(new ImpersonatedIdentityContext(currentUser), IdentityContext)
      try {
        await clientService.handleChatMessageReceived(handlerInjector, entity, chat, chatHistory)
      } catch (error) {
        await logger.error({
          message: `❌  Error handling chat message received for chat ${chat.id} and message ${entity.id}`,
          data: {
            error,
          },
        })
      }
    })
  })
}
