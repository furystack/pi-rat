import type { InternalAppModel } from '../../AppModelManager.js'
import { configManifest } from './config-manifest.js'
import { setupConfigRestApi } from './setup-config-rest-api.js'
import { setupConfig } from './setup-config-store.js'

export const ConfigAppModel: InternalAppModel = {
  manifest: configManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupConfig(injector), setupConfigRestApi(injector)])
  },
}
