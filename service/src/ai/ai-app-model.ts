import { Injectable, type Injector } from '@furystack/inject'
import type { AppState } from 'common'
import type { InternalAppModel } from '../AppModelManager.js'
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

  public async setup() {
    await Promise.all([setupAi(this.injector), setupAiRestApi(this.injector)])
  }
}
