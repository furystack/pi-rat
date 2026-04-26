import type { InternalAppModel } from '../../AppModelManager.js'
import { ChatAppManifest } from './manifest.js'
import { setupChatRestApi } from './setup-chat-api.js'
import { setupChatStore } from './setup-chat-store.js'

export const ChatAppModel: InternalAppModel = {
  manifest: ChatAppManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupChatStore(injector), setupChatRestApi(injector)])
  },
}
