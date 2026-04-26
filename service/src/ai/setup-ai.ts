import { IdentityContext, useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'
import { UserDataSet } from '../app-models/identity/setup-identity-store.js'
import { createImpersonatedIdentityContext } from '../utils/impersonated-identity-context.js'
import { OllamaClientService } from './ollama-client-service.js'
import { AiChatDataSet, AiChatMessageDataSet, setupAiStore } from './setup-ai-store.js'

export const setupAi = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('AI Setup')

  await setupAiStore(injector)

  const clientService = injector.get(OllamaClientService)
  clientService.init()

  const systemInjector = useSystemIdentityContext({ injector, username: 'ai-setup' })
  const chatMessageDataSet = getDataSetFor(injector, AiChatMessageDataSet)
  const chatDataSet = getDataSetFor(injector, AiChatDataSet)
  const userDataSet = getDataSetFor(injector, UserDataSet)

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

    await usingAsync(injector.createScope({}), async (handlerInjector) => {
      handlerInjector.bind(IdentityContext, () => createImpersonatedIdentityContext(currentUser))
      try {
        await clientService.handleChatMessageReceived(handlerInjector, entity, chat, chatHistory)
      } catch (error) {
        await logger.error({
          message: `❌  Error handling chat message received for chat ${chat.id} and message ${entity.id}`,
          data: { error },
        })
      }
    })
  })
}
