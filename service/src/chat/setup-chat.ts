import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { setupChatStore } from './setup-chat-store.js'

export const setupChat = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Chat')
  await logger.verbose({ message: '💬 Setting up Chat store and repository...' })

  await setupChatStore(injector)

  await logger.verbose({ message: '✅ Chat setup completed' })
}
