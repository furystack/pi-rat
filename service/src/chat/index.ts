import { Injectable, Injector } from '@furystack/inject'
import { type InternalAppModel } from '../AppModelManager.js'
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

  public async setup() {
    await Promise.all([setupChatStore(this.injector), setupChatRestApi(this.injector)])
  }
}
