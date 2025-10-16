import { Injectable, Injected, Injector } from '@furystack/inject'
import type { AppModel } from 'common'
import { AppModelManager } from '../AppModelManager.js'
import { ChatAppManifest } from './manifest.js'

import { setupChatRestApi } from './setup-chat-api.js'
import { setupChat } from './setup-chat.js'

@Injectable({ lifetime: 'singleton' })
export class ChatAppModel implements AppModel {
  public manifest = ChatAppManifest
  public state = {
    type: 'initializing' as const,
  }

  @Injected(AppModelManager)
  declare private appModelManager: AppModelManager

  public async register(injector: Injector) {
    this.appModelManager.registerInternalAppModel(this)
    await setupChat(injector)
    await setupChatRestApi(injector)
    this.appModelManager.updateAppModelState(this.manifest.id, { type: 'running', lastHealthCheck: new Date() })
  }
}
