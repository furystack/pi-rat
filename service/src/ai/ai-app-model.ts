import { Injectable, type Injector } from '@furystack/inject'
import {
  AiChatMessage,
  entitySyncConfig,
  type AppState,
  type EntitySyncModelConfig,
  type InternalAppModel,
} from 'common'
import { AiManifest } from './ai-manifest.js'
import { setupAiRestApi } from './setup-ai-rest-api.js'
import { setupAi } from './setup-ai.js'

@Injectable({ lifetime: 'singleton' })
export class AiAppModel implements InternalAppModel {
  manifest = AiManifest
  state: AppState = {
    type: 'initializing',
  }

  declare private injector: Injector

  public getEntitySyncModels(): EntitySyncModelConfig[] {
    return [entitySyncConfig({ model: AiChatMessage, primaryKey: 'id' })]
  }

  public async setup() {
    await Promise.all([setupAi(this.injector), setupAiRestApi(this.injector)])
  }
}
