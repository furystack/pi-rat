import { Injectable, type Injector } from '@furystack/inject'
import type { AppState } from 'common'
import type { InternalAppModel } from '../AppModelManager.js'
import { IotManifest } from './iot-manifest.js'
import { setupIotApi } from './setup-iot-api.js'
import { setupIotStore } from './setup-store.js'

@Injectable({ lifetime: 'singleton' })
export class IotAppModel implements InternalAppModel {
  state: AppState = {
    type: 'initializing',
  }

  manifest = IotManifest

  declare private injector: Injector

  public async setup() {
    await Promise.all([setupIotStore(this.injector), setupIotApi(this.injector)])
  }
}
