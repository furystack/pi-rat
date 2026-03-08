import { Injectable, type Injector } from '@furystack/inject'
import type { AppState, InternalAppModel } from 'common'
import { IotManifest } from './iot-manifest.js'
import { setupIotApi, type IotApiSetupOptions } from './setup-iot-api.js'
import { setupIotStore, type IotStoreSetupOptions } from './setup-store.js'

export type IotPluginOptions = IotStoreSetupOptions & IotApiSetupOptions

/**
 * IoT plugin AppModel. Requires explicit configuration before setup:
 *
 * ```ts
 * const iot = injector.getInstance(IotAppModel).configure({ port, cors, ... })
 * await appModelManager.registerInternalAppModels(iot)
 * ```
 *
 * `configure()` must be called before `setup()` (enforced at runtime).
 * This pattern exists because plugin AppModels cannot directly import
 * host-level services like `getPort()` or `WebsocketService`.
 */
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
    const opts = this.options
    await Promise.all([setupIotStore(this.injector, opts), setupIotApi(this.injector, opts)])
  }
}
