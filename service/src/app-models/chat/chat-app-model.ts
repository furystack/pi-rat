import { Injectable, Injector } from '@furystack/inject'
import { Chat, ChatMessage, entitySyncConfig } from 'common'
import type { EntitySyncModelConfig, InternalAppModel } from 'common'
import { ChatAppManifest } from './manifest.js'
import { setupChatRestApi } from './setup-chat-api.js'
import { setupChatStore } from './setup-chat-store.js'

@Injectable({ lifetime: 'singleton' })
export class ChatAppModel implements InternalAppModel {
  public manifest = ChatAppManifest
  public state = {
    type: 'initializing' as const,
  }

  declare private injector: Injector

  public getEntitySyncModels(): EntitySyncModelConfig[] {
    return [
      entitySyncConfig({ model: Chat, primaryKey: 'id' }),
      entitySyncConfig({ model: ChatMessage, primaryKey: 'id', debounceMs: 100 }),
    ]
  }

  public async setup() {
    await Promise.all([setupChatStore(this.injector), setupChatRestApi(this.injector)])
  }
}
