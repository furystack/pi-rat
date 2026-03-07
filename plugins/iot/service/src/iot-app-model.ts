import { Injectable, type Injector } from '@furystack/inject'
import type { AppState, InternalAppModel } from 'common'
import { IotManifest } from './iot-manifest.js'
import { setupIotApi, type IotApiSetupOptions } from './setup-iot-api.js'
import { setupIotStore, type IotStoreSetupOptions } from './setup-store.js'

export type IotPluginOptions = IotStoreSetupOptions & IotApiSetupOptions

@Injectable({ lifetime: 'singleton' })
export class IotAppModel implements InternalAppModel {
  state: AppState = {
    type: 'initializing',
  }

  manifest = IotManifest

  declare private injector: Injector

  private options: IotPluginOptions | undefined

  public configure(options: IotPluginOptions) {
    this.options = options
    return this
  }

  public async setup() {
    if (!this.options) {
      throw new Error('IotAppModel.configure() must be called before setup()')
    }
    await Promise.all([setupIotStore(this.injector, this.options), setupIotApi(this.injector, this.options)])
  }
}
