import { Injectable, type Injector } from '@furystack/inject'
import type { AppState } from 'common'
import type { InternalAppModel } from '../../AppModelManager.js'
import { configManifest } from './config-manifest.js'
import { setupConfigRestApi } from './setup-config-rest-api.js'
import { setupConfig } from './setup-config-store.js'

@Injectable({ lifetime: 'singleton' })
export class ConfigAppModel implements InternalAppModel {
  declare private injector: Injector
  public async setup() {
    await Promise.all([setupConfig(this.injector), setupConfigRestApi(this.injector)])
  }
  state: AppState = {
    type: 'initializing',
  }
  public manifest = configManifest
}
