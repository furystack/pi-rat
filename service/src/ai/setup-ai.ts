import { getCurrentUser, getStoreManager, IdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { usingAsync } from '@furystack/utils'
import { AiChat, AiChatMessage, Config, User } from 'common'
import { ImpersonatedIdentityContext } from '../utils/impersonated-identity-context.js'
import { WebsocketService } from '../websocket-service.js'
import { OllamaClientService } from './ollama-client-service.js'
import { setupAiStore } from './setup-ai-store.js'

export const setupAi = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('AI Setup')
  await logger.verbose({ message: '🤖   Initializing AI Services' })
  const clientService = injector.getInstance(OllamaClientService)

  const storeManager = getStoreManager(injector)

  const configStore = storeManager.getStoreFor(Config, 'id')

  configStore.subscribe('onEntityAdded', async () => {
    await logger.verbose({ message: '🔄   Config changed, reinitializing AI Services' })
    await clientService.init(injector)
  })

  configStore.subscribe('onEntityUpdated', async () => {
    await logger.verbose({ message: '🔄   Config changed, reinitializing AI Services' })
    await clientService.init(injector)
  })

  await setupAiStore(injector)

  const chatMessageStore = storeManager.getStoreFor(AiChatMessage, 'id')
  const chatStore = storeManager.getStoreFor(AiChat, 'id')

  chatMessageStore.subscribe('onEntityAdded', async ({ entity }) => {
    const ws = injector.getInstance(WebsocketService)
    await ws.announce(
      {
        type: 'ai-chat-message-added',
        aiChatMessage: entity,
      },
      async ({ injector: i }) => {
        const user = await getCurrentUser(i)
        return user.username === entity.owner
      },
    )
  })

  chatMessageStore.subscribe('onEntityAdded', async ({ entity }) => {
    const chat = await chatStore.get(entity.aiChatId)
    if (!chat) {
      await logger.error({ message: `❌  Chat with ID ${entity.aiChatId} not found for message ${entity.id}` })
      return
    }
    const chatHistory = await chatMessageStore.find({
      filter: { aiChatId: { $eq: chat.id } },
      order: { createdAt: 'DESC' },
      top: 20,
    })

    const currentUser = await getStoreManager(injector).getStoreFor(User, 'username').get(entity.owner)

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
